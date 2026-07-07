"""
Flattens PLAN (from plan_data.py) into one row per day and upserts into
the planned_workouts table in Supabase.

Run once to seed the table. Safe to re-run (upserts on workout_date).

Env vars required:
  SUPABASE_URL   - e.g. https://xxxx.supabase.co
  SUPABASE_KEY   - service role key (Project Settings -> API -> service_role)
"""

import os
import sys
from datetime import date, timedelta

from supabase import create_client

from plan_data import PLAN

DAY_OFFSET = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}


def flatten_plan():
    rows = []
    for phase_block in PLAN:
        phase = phase_block["phase"]
        for week in phase_block["weeks"]:
            week_start = date.fromisoformat(week["start"])
            for day in week["days"]:
                workout_date = week_start + timedelta(days=DAY_OFFSET[day["d"]])
                rows.append({
                    "workout_date": workout_date.isoformat(),
                    "week_number": week["n"],
                    "phase": phase,
                    "day_name": day["d"],
                    "workout_type": day["type"],
                    "badge": day["badge"],
                    "planned_km": day["km"],
                    "pace_target": day["pace"],
                    "instructions": day["instr"],
                })
    return rows


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_KEY environment variables first.")

    client = create_client(url, key)
    rows = flatten_plan()
    print(f"Prepared {len(rows)} planned workout rows "
          f"({rows[0]['workout_date']} to {rows[-1]['workout_date']}).")

    # upsert in one batch, matched on the unique workout_date column
    result = client.table("planned_workouts").upsert(
        rows, on_conflict="workout_date"
    ).execute()

    print(f"Upserted {len(result.data)} rows into planned_workouts.")


if __name__ == "__main__":
    main()
