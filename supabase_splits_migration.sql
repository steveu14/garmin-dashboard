-- Run once in the Supabase SQL editor. Adds per-km split storage to activities.
-- Splits are stored as a JSONB array: [{ km, duration_s, pace_sec_per_km, avg_hr, elevation_gain_m }, ...]
alter table activities add column if not exists splits jsonb;
