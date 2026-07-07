-- Run this in the Supabase SQL editor for your "marathon-training" project.

-- 1. Planned workouts, transcribed from your marathon-training plan (index.html)
create table if not exists planned_workouts (
  id serial primary key,
  workout_date date not null unique,
  week_number int not null,
  phase text not null,
  day_name text not null,           -- Mon, Tue, ...
  workout_type text not null,       -- rest, easy, medium, tempo, pace, long, race
  badge text,
  planned_km numeric(5,2),
  pace_target text,                 -- kept as text, e.g. "6:30-6:50/km" (ranges vary in format)
  instructions text,
  created_at timestamptz default now()
);

-- 2. Actual Garmin activities
create table if not exists activities (
  id serial primary key,
  garmin_activity_id bigint unique not null,
  activity_date date not null,
  start_time timestamptz,
  activity_type text,
  activity_name text,
  distance_km numeric(6,2),
  duration_seconds int,
  avg_pace_sec_per_km int,
  avg_hr int,
  max_hr int,
  avg_cadence numeric(6,2),
  elevation_gain_m numeric(6,2),
  calories int,
  raw_json jsonb,
  created_at timestamptz default now()
);

-- 3. Daily health metrics (one row per calendar day)
create table if not exists daily_metrics (
  id serial primary key,
  metric_date date unique not null,
  resting_hr int,
  hrv_status text,
  hrv_last_night_avg numeric(6,2),
  sleep_score int,
  sleep_duration_min int,
  body_battery_max int,
  body_battery_min int,
  stress_avg int,
  training_readiness_score int,
  raw_json jsonb,
  created_at timestamptz default now()
);

-- Helpful view: plan vs actual, joined by date.
-- Matches a planned workout to the best same-day activity by distance (if multiple runs that day).
create or replace view plan_vs_actual as
select
  pw.workout_date,
  pw.week_number,
  pw.phase,
  pw.day_name,
  pw.workout_type,
  pw.planned_km,
  pw.pace_target,
  a.distance_km as actual_km,
  a.avg_pace_sec_per_km,
  a.avg_hr,
  a.duration_seconds,
  case
    when pw.planned_km is null or pw.planned_km = 0 then null
    else round((coalesce(a.distance_km, 0) / pw.planned_km) * 100, 1)
  end as pct_of_planned_distance
from planned_workouts pw
left join activities a on a.activity_date = pw.workout_date
order by pw.workout_date;

-- Indexes for common lookups
create index if not exists idx_activities_date on activities (activity_date);
create index if not exists idx_daily_metrics_date on daily_metrics (metric_date);
