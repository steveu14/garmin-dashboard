import garminconnect
import gspread
from google.oauth2.service_account import Credentials
from datetime import date, timedelta
import os

# Config
CREDENTIALS_PATH = "credentials.json"
SHEET_ID         = "19vjqayIvLC-OxD7D5f9Vna1fbXj8aXCGqpW2Vxa8-1U"
GARMIN_EMAIL     = "stevenwu3084@gmail.com"
DAYS_TO_SYNC     = 7

def get_or_create_worksheet(sheet, title, headers):
    try:
        ws = sheet.worksheet(title)
    except gspread.exceptions.WorksheetNotFound:
        ws = sheet.add_worksheet(title=title, rows=1000, cols=len(headers))
        ws.append_row(headers)
    return ws

def get_mfa():
    return input("Enter your Garmin MFA code: ")

def sync():
    print("Connecting to Google Sheets...")
    scopes = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=scopes)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(SHEET_ID)

    daily_ws = get_or_create_worksheet(
        sh, "Daily Stats",
        ["Date", "Steps", "Total Calories", "Active Minutes", "Resting HR", "Avg HR"]
    )
    activities_ws = get_or_create_worksheet(
        sh, "Activities",
        ["Date", "Activity Name", "Type", "Distance (km)", "Duration (min)", "Calories", "Avg HR"]
    )

    print("Logging into Garmin Connect...")
    password = os.environ.get("GARMIN_PASSWORD")
    if not password:
        raise ValueError("GARMIN_PASSWORD environment variable is not set")

    client = garminconnect.Garmin(GARMIN_EMAIL, password, prompt_mfa=get_mfa)
    client.login()
    print("Logged in successfully.\n")

    today = date.today()
    start_date = today - timedelta(days=DAYS_TO_SYNC)

    # ── Daily stats ───────────────────────────────────────────────────────────
    print("Fetching daily stats...")
    existing_dates = set(daily_ws.col_values(1)[1:])

    for i in range(DAYS_TO_SYNC):
        day = start_date + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")

        if day_str in existing_dates:
            print("  Skipping " + day_str + " (already in sheet)")
            continue

        try:
            stats = client.get_stats(day_str)
            steps = stats.get("totalSteps", 0) or 0
            calories = stats.get("totalKilocalories", 0) or 0
            active_mins = (
                (stats.get("highlyActiveSeconds", 0) or 0) +
                (stats.get("activeSeconds", 0) or 0)
            ) // 60
            resting_hr = stats.get("restingHeartRate", "N/A")
            avg_hr = stats.get("averageHeartRate", "N/A")

            daily_ws.append_row([day_str, steps, calories, active_mins, resting_hr, avg_hr])
            print("  Added " + day_str + " - " + str(steps) + " steps, " + str(calories) + " kcal")
        except Exception as e:
            print("  Could not fetch stats for " + day_str + ": " + str(e))

    # ── Activities ────────────────────────────────────────────────────────────
    print("\nFetching activities...")
    try:
        # Build a set of existing activity keys (date + name + duration)
        existing_rows = activities_ws.get_all_values()[1:]  # skip header
        existing_keys = set()
        for row in existing_rows:
            if len(row) >= 5:
                # key = date + activity name + duration
                key = (row[0] + "|" + row[1] + "|" + row[4]).strip()
                existing_keys.add(key)

        activities = client.get_activities_by_date(
            start_date.strftime("%Y-%m-%d"),
            today.strftime("%Y-%m-%d")
        )

        added = 0
        skipped = 0
        for act in activities:
            act_date = (act.get("startTimeLocal") or "")[:10]
            act_name = act.get("activityName", "N/A")
            act_type = (act.get("activityType") or {}).get("typeKey", "N/A")
            distance = round((act.get("distance") or 0) / 1000, 2)
            duration = round((act.get("duration") or 0) / 60, 1)
            calories = act.get("calories", 0) or 0
            avg_hr   = act.get("averageHR", "N/A")

            # Check for duplicate using date + name + duration as unique key
            key = (act_date + "|" + act_name + "|" + str(duration)).strip()
            if key in existing_keys:
                skipped += 1
                print("  Skipping duplicate: " + act_name + " on " + act_date)
                continue

            activities_ws.append_row([act_date, act_name, act_type, distance, duration, calories, avg_hr])
            existing_keys.add(key)
            added += 1
            print("  Added: " + act_name + " on " + act_date)

        print("\n  " + str(added) + " activities added, " + str(skipped) + " duplicates skipped.")

    except Exception as e:
        print("  Could not fetch activities: " + str(e))

    print("\nSync complete! Check your Google Sheet.")

if __name__ == "__main__":
    sync()
