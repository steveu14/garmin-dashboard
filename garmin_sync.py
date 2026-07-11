"""
Pulls Garmin Connect activities + daily health metrics into Supabase.

Requires garminconnect >= 0.3.1 (the version that replaced garth with a
native curl_cffi-based auth engine after Garmin's March 2026 Cloudflare
changes). Older versions cannot log in.

    pip install "garminconnect>=0.3.1" curl_cffi ua-generator supabase

Env vars required:
  GARMIN_PASSWORD     (email is hardcoded below, same as before)
  SUPABASE_URL
  SUPABASE_KEY        (service role key -- this script bypasses RLS)

Optional:
  SYNC_START_DATE     ISO date. If unset, defaults to a rolling lookback
                       window (LOOKBACK_DAYS) for routine scheduled runs.
                       For the one-time historical backfill, run this once
                       with SYNC_START_DATE=2026-06-15 (the plan's start).

Notes on reliability:
  - Each metric fetch is wrapped in its own try/except so one broken or
    rate-limited endpoint doesn't abort the whole sync.
  - Garmin's Cloudflare protections are known to be stricter against
    datacenter/cloud IPs than home IPs. If this fails when run from
    GitHub-hosted Actions runners, prefer running it locally or from a
    self-hosted runner instead.
"""

import os
import sys
import time
from datetime import date, timedelta

import garminconnect
from supabase import create_client

CREDENTIALS_EMAIL = "stevenwu3084@gmail.com"
LOOKBACK_DAYS = 7
TOKEN_STORE = os.path.expanduser("~/.garminconnect")


def get_mfa():
    return input("Enter your Garmin MFA code: ")


def get_garmin_client():
    password = os.environ.get("GARMIN_PASSWORD")
    if not password:
        sys.exit("Set GARMIN_PASSWORD environment variable.")

    client = garminconnect.Garmin(CREDENTIALS_EMAIL, password, prompt_mfa=get_mfa)
    # login(tokenstore) already falls back to a full credential login
    # internally if no cached tokens exist -- don't call login() again on
    # failure, that just doubles the auth attempts and risks tripping
    # Garmin's rate limiting.
    client.login(TOKEN_STORE)
    return client


def get_supabase_client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_KEY environment variables.")
    return create_client(url, key)


def daterange(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def safe_int(value):
    """Garmin's API sometimes returns numeric fields as strings (e.g. '149.0'),
    which Postgres rejects for integer columns. Coerce defensively."""
    if value is None or value == "":
        return None
    try:
        return int(round(float(value)))
    except (ValueError, TypeError):
        return None


def safe_float(value, ndigits=2):
    if value is None or value == "":
        return None
    try:
        return round(float(value), ndigits)
    except (ValueError, TypeError):
        return None


def parse_pace_sec_per_km(activity: dict):
    speed = safe_float(activity.get("averageSpeed"), ndigits=4)  # m/s
    if not speed:
        return None
    try:
        return round(1000 / speed)
    except ZeroDivisionError:
        return None


def fetch_splits(client, activity_id) -> list | None:
    """Per-km lap splits for one activity, normalized to a compact list of
    dicts. Returns None on any failure -- this must never abort the sync,
    it's an enhancement on top of the summary stats we already store."""
    try:
        data = client.get_activity_splits(activity_id)
    except Exception as e:
        print(f"    splits fetch failed for {activity_id}: {e}")
        return None

    # Garmin's response nests laps under "lapDTOs"; fall back to a couple of
    # other keys defensively in case the shape differs by activity/version.
    laps = data.get("lapDTOs") or data.get("laps") or data.get("splits") or []
    if not laps:
        return None

    splits = []
    for i, lap in enumerate(laps, start=1):
        distance_m = safe_float(lap.get("distance"))
        duration_s = safe_int(lap.get("duration"))
        speed = safe_float(lap.get("averageSpeed"), ndigits=4)
        pace_sec_per_km = round(1000 / speed) if speed else None
        splits.append({
            "km": i,
            "distance_m": distance_m,
            "duration_s": duration_s,
            "pace_sec_per_km": pace_sec_per_km,
            "avg_hr": safe_int(lap.get("averageHR")),
            "max_hr": safe_int(lap.get("maxHR")),
            "elevation_gain_m": safe_float(lap.get("elevationGain")),
        })
    return splits or None


def sync_activities(client, sb, start: date, end: date, fetch_split_detail: bool = True):
    print(f"Fetching activities {start} to {end}...")
    activities = client.get_activities_by_date(start.isoformat(), end.isoformat())
    rows = []
    for a in activities:
        activity_id = a.get("activityId")
        if not activity_id:
            continue
        start_time_raw = a.get("startTimeLocal") or a.get("startTimeGMT")
        activity_type = (a.get("activityType") or {}).get("typeKey")

        splits = None
        if fetch_split_detail and activity_type and "running" in activity_type:
            splits = fetch_splits(client, activity_id)
            time.sleep(0.3)  # be gentle with Garmin's rate limits -- one extra call per run

        rows.append({
            "garmin_activity_id": activity_id,
            "activity_date": (start_time_raw or "")[:10] or None,
            "start_time": start_time_raw,
            "activity_type": activity_type,
            "activity_name": a.get("activityName"),
            "distance_km": safe_float(round((a.get("distance") or 0) / 1000, 2)),
            "duration_seconds": safe_int(a.get("duration")) or 0,
            "avg_pace_sec_per_km": parse_pace_sec_per_km(a),
            "avg_hr": safe_int(a.get("averageHR")),
            "max_hr": safe_int(a.get("maxHR")),
            "avg_cadence": safe_float(a.get("averageRunningCadenceInStepsPerMinute")),
            "elevation_gain_m": safe_float(a.get("elevationGain")),
            "calories": safe_int(a.get("calories")),
            "splits": splits,
            "raw_json": a,
        })

    if not rows:
        print("No activities found in range.")
        return

    result = sb.table("activities").upsert(rows, on_conflict="garmin_activity_id").execute()
    print(f"Upserted {len(result.data)} activities.")


def sync_daily_metrics(client, sb, start: date, end: date):
    rows = []
    for d in daterange(start, end):
        ds = d.isoformat()
        metrics = {"metric_date": ds}

        try:
            stats = client.get_stats(ds)
            metrics["resting_hr"] = safe_int(stats.get("restingHeartRate"))
            metrics["body_battery_max"] = safe_int(stats.get("bodyBatteryHighestValue"))
            metrics["body_battery_min"] = safe_int(stats.get("bodyBatteryLowestValue"))
            metrics["stress_avg"] = safe_int(stats.get("averageStressLevel"))
        except Exception as e:
            print(f"  [{ds}] get_stats failed: {e}")

        try:
            sleep = client.get_sleep_data(ds)
            daily_sleep = (sleep or {}).get("dailySleepDTO", {})
            metrics["sleep_score"] = safe_int((daily_sleep.get("sleepScores") or {}).get("overall", {}).get("value"))
            metrics["sleep_duration_min"] = safe_int((daily_sleep.get("sleepTimeSeconds") or 0) / 60)
        except Exception as e:
            print(f"  [{ds}] get_sleep_data failed: {e}")

        try:
            hrv = client.get_hrv_data(ds)
            summary = (hrv or {}).get("hrvSummary", {})
            metrics["hrv_status"] = summary.get("status")
            metrics["hrv_last_night_avg"] = safe_float(summary.get("lastNightAvg"))
        except Exception as e:
            print(f"  [{ds}] get_hrv_data failed: {e}")

        try:
            readiness = client.get_training_readiness(ds)
            if isinstance(readiness, list) and readiness:
                metrics["training_readiness_score"] = safe_int(readiness[0].get("score"))
        except Exception as e:
            print(f"  [{ds}] get_training_readiness failed: {e}")

        metrics["raw_json"] = metrics.copy()
        rows.append(metrics)
        time.sleep(0.5)  # be gentle with Garmin's rate limits

    result = sb.table("daily_metrics").upsert(rows, on_conflict="metric_date").execute()
    print(f"Upserted {len(result.data)} daily metric rows.")


def main():
    end = date.today()
    start_str = os.environ.get("SYNC_START_DATE")
    start = date.fromisoformat(start_str) if start_str else end - timedelta(days=LOOKBACK_DAYS)

    if start > end:
        sys.exit(f"Start date {start} is in the future.")

    client = get_garmin_client()
    sb = get_supabase_client()

    sync_activities(client, sb, start, end)
    sync_daily_metrics(client, sb, start, end)
    print("\nSync complete.")


if __name__ == "__main__":
    main()
