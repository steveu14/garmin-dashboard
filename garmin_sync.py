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
    try:
        client.login(TOKEN_STORE)
    except Exception:
        client.login()
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


def parse_pace_sec_per_km(activity: dict):
    speed = activity.get("averageSpeed")  # m/s
    if not speed:
        return None
    try:
        return round(1000 / speed)
    except ZeroDivisionError:
        return None


def sync_activities(client, sb, start: date, end: date):
    print(f"Fetching activities {start} to {end}...")
    activities = client.get_activities_by_date(start.isoformat(), end.isoformat())
    rows = []
    for a in activities:
        activity_id = a.get("activityId")
        if not activity_id:
            continue
        start_time_raw = a.get("startTimeLocal") or a.get("startTimeGMT")
        rows.append({
            "garmin_activity_id": activity_id,
            "activity_date": (start_time_raw or "")[:10] or None,
            "start_time": start_time_raw,
            "activity_type": (a.get("activityType") or {}).get("typeKey"),
            "activity_name": a.get("activityName"),
            "distance_km": round((a.get("distance") or 0) / 1000, 2),
            "duration_seconds": int(a.get("duration") or 0),
            "avg_pace_sec_per_km": parse_pace_sec_per_km(a),
            "avg_hr": a.get("averageHR"),
            "max_hr": a.get("maxHR"),
            "avg_cadence": a.get("averageRunningCadenceInStepsPerMinute"),
            "elevation_gain_m": a.get("elevationGain"),
            "calories": a.get("calories"),
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
            metrics["resting_hr"] = stats.get("restingHeartRate")
            metrics["body_battery_max"] = stats.get("bodyBatteryHighestValue")
            metrics["body_battery_min"] = stats.get("bodyBatteryLowestValue")
            metrics["stress_avg"] = stats.get("averageStressLevel")
        except Exception as e:
            print(f"  [{ds}] get_stats failed: {e}")

        try:
            sleep = client.get_sleep_data(ds)
            daily_sleep = (sleep or {}).get("dailySleepDTO", {})
            metrics["sleep_score"] = (daily_sleep.get("sleepScores") or {}).get("overall", {}).get("value")
            metrics["sleep_duration_min"] = round((daily_sleep.get("sleepTimeSeconds") or 0) / 60)
        except Exception as e:
            print(f"  [{ds}] get_sleep_data failed: {e}")

        try:
            hrv = client.get_hrv_data(ds)
            summary = (hrv or {}).get("hrvSummary", {})
            metrics["hrv_status"] = summary.get("status")
            metrics["hrv_last_night_avg"] = summary.get("lastNightAvg")
        except Exception as e:
            print(f"  [{ds}] get_hrv_data failed: {e}")

        try:
            readiness = client.get_training_readiness(ds)
            if isinstance(readiness, list) and readiness:
                metrics["training_readiness_score"] = readiness[0].get("score")
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
