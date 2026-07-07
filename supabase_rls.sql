-- Run after supabase_schema.sql. This is a single-user personal project,
-- so these policies just allow public SELECT (read) via the anon key used
-- by the browser. All writes still go through the service role key from
-- the sync/seed scripts, which bypasses RLS entirely.

alter table planned_workouts enable row level security;
alter table activities enable row level security;
alter table daily_metrics enable row level security;

create policy "public read planned_workouts" on planned_workouts
  for select using (true);

create policy "public read activities" on activities
  for select using (true);

create policy "public read daily_metrics" on daily_metrics
  for select using (true);
