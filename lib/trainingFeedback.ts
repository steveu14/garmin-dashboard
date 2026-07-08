// Coach-style analysis: matches actual Garmin runs to planned workouts
// WITHIN THE SAME WEEK, rather than requiring an exact date match.
//
// Rationale: the plan assigns workout types to specific days (e.g. "long run
// on Sunday"), but real training weeks shift around. So each week, planned
// runs (excluding rest days) are ranked by distance, actual runs that week
// are ranked by distance, and they're paired by rank -- the longest run of
// the week is assumed to be the long run, the shortest are the easy runs,
// etc. This is a heuristic, not a guarantee, but distance rank is a strong
// proxy for workout intent within a single training week.
//
// Numbers used here that come directly from Steven's own plan text (not
// invented): the 145 bpm easy-run ceiling ("HR <145 bpm" appears verbatim in
// the plan's easy-run instructions) and the 179 bpm LT reference used as an
// informational ceiling for tempo effort. Pace ranges are parsed from each
// day's own `pace_target` field.

export type PlannedWorkout = {
  workout_date: string; // YYYY-MM-DD
  week_number: number;
  phase: string;
  day_name: string;
  workout_type: string; // rest | easy | medium | tempo | pace | long | race
  badge: string;
  planned_km: number | null;
  pace_target: string | null;
  instructions: string | null;
};

export type Activity = {
  activity_date: string;
  activity_name: string | null;
  activity_type: string | null;
  distance_km: number;
  duration_seconds: number;
  avg_pace_sec_per_km: number | null;
  avg_hr: number | null;
};

/** One matched (or unmatched) run for a given week. */
export type MatchedRun = {
  week_number: number;
  phase: string;
  workout_type: string; // 'unplanned' for extra runs with no plan slot left
  badge: string;
  planned_km: number | null;
  pace_target: string | null;
  instructions: string | null;
  actual_km: number | null;
  avg_pace_sec_per_km: number | null;
  avg_hr: number | null;
  activity_date: string | null; // the date the run actually happened
  activity_name: string | null;
};

const EASY_HR_CEILING = 145; // from the plan's own "HR <145 bpm" instruction
const LT_HR_REFERENCE = 179; // Steven's known lactate-threshold HR
const EASY_LIKE_TYPES = new Set(["easy", "medium", "long", "recovery"]);
const MIN_RUN_DISTANCE_KM = 0.3; // filters out e.g. strength sessions logged with ~0 distance

type WeekBucket = {
  week_number: number;
  phase: string;
  start: string;
  end: string;
  plannedRuns: PlannedWorkout[]; // rest days excluded
};

function buildWeekBuckets(plan: PlannedWorkout[]): WeekBucket[] {
  const byWeek = new Map<number, PlannedWorkout[]>();
  for (const p of plan) {
    if (!byWeek.has(p.week_number)) byWeek.set(p.week_number, []);
    byWeek.get(p.week_number)!.push(p);
  }

  const buckets: WeekBucket[] = [];
  for (const [week, days] of [...byWeek.entries()].sort((a, b) => a[0] - b[0])) {
    const dates = days.map((d) => d.workout_date).sort();
    buckets.push({
      week_number: week,
      phase: days[0].phase,
      start: dates[0],
      end: dates[dates.length - 1],
      plannedRuns: days.filter((d) => d.planned_km !== null),
    });
  }
  return buckets;
}

function assignActivitiesToWeeks(activities: Activity[], weeks: WeekBucket[]): Map<number, Activity[]> {
  const byWeek = new Map<number, Activity[]>();
  for (const w of weeks) byWeek.set(w.week_number, []);

  for (const a of activities) {
    if (!a.distance_km || a.distance_km < MIN_RUN_DISTANCE_KM) continue; // skip non-run/near-zero entries
    const week = weeks.find((w) => a.activity_date >= w.start && a.activity_date <= w.end);
    if (week) byWeek.get(week.week_number)!.push(a);
  }
  return byWeek;
}

/** Rank-match planned runs to actual runs within one week, by descending distance. */
function matchWeek(week: WeekBucket, weekActivities: Activity[]): MatchedRun[] {
  const plannedSorted = [...week.plannedRuns].sort((a, b) => (b.planned_km ?? 0) - (a.planned_km ?? 0));
  const actualSorted = [...weekActivities].sort((a, b) => b.distance_km - a.distance_km);

  const results: MatchedRun[] = [];
  const pairCount = Math.max(plannedSorted.length, actualSorted.length);

  for (let i = 0; i < pairCount; i++) {
    const planned = plannedSorted[i];
    const actual = actualSorted[i];

    if (planned && actual) {
      results.push({
        week_number: week.week_number,
        phase: week.phase,
        workout_type: planned.workout_type,
        badge: planned.badge,
        planned_km: planned.planned_km,
        pace_target: planned.pace_target,
        instructions: planned.instructions,
        actual_km: Math.round(actual.distance_km * 100) / 100,
        avg_pace_sec_per_km: actual.avg_pace_sec_per_km,
        avg_hr: actual.avg_hr,
        activity_date: actual.activity_date,
        activity_name: actual.activity_name,
      });
    } else if (planned && !actual) {
      results.push({
        week_number: week.week_number,
        phase: week.phase,
        workout_type: planned.workout_type,
        badge: planned.badge,
        planned_km: planned.planned_km,
        pace_target: planned.pace_target,
        instructions: planned.instructions,
        actual_km: null,
        avg_pace_sec_per_km: null,
        avg_hr: null,
        activity_date: null,
        activity_name: null,
      });
    } else if (!planned && actual) {
      results.push({
        week_number: week.week_number,
        phase: week.phase,
        workout_type: "unplanned",
        badge: "Extra run",
        planned_km: null,
        pace_target: null,
        instructions: null,
        actual_km: Math.round(actual.distance_km * 100) / 100,
        avg_pace_sec_per_km: actual.avg_pace_sec_per_km,
        avg_hr: actual.avg_hr,
        activity_date: actual.activity_date,
        activity_name: actual.activity_name,
      });
    }
  }

  return results;
}

/** Build the full set of matched runs across all weeks. */
export function buildMatchedRuns(plan: PlannedWorkout[], activities: Activity[]): MatchedRun[] {
  const weeks = buildWeekBuckets(plan);
  const activitiesByWeek = assignActivitiesToWeeks(activities, weeks);
  return weeks.flatMap((w) => matchWeek(w, activitiesByWeek.get(w.week_number) ?? []));
}

/** Parse the first "m:ss-m:ss" range found in a pace_target string, in seconds/km. */
export function parsePaceRange(paceTarget: string | null): { minSec: number; maxSec: number } | null {
  if (!paceTarget) return null;
  const match = paceTarget.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const a = parseInt(match[1]) * 60 + parseInt(match[2]);
  const b = parseInt(match[3]) * 60 + parseInt(match[4]);
  return { minSec: Math.min(a, b), maxSec: Math.max(a, b) };
}

export function formatPace(secPerKm: number | null): string {
  if (!secPerKm) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

export type DistanceVerdict = "missed" | "short" | "on_target" | "long" | "extra";

export function distanceVerdict(run: MatchedRun): DistanceVerdict {
  if (run.workout_type === "unplanned") return "extra";
  if (!run.actual_km) return "missed";
  if (!run.planned_km) return "on_target"; // shouldn't happen, but guard
  const pct = (run.actual_km / run.planned_km) * 100;
  if (pct < 90) return "short";
  if (pct > 110) return "long";
  return "on_target";
}

export type PaceVerdict = "n/a" | "no_data" | "faster" | "on_pace" | "slower";

export function paceVerdict(run: MatchedRun): PaceVerdict {
  const range = parsePaceRange(run.pace_target);
  if (!range) return "n/a";
  if (!run.avg_pace_sec_per_km) return "no_data";
  const tolerance = 8; // seconds/km buffer either side
  if (run.avg_pace_sec_per_km < range.minSec - tolerance) return "faster";
  if (run.avg_pace_sec_per_km > range.maxSec + tolerance) return "slower";
  return "on_pace";
}

export function hrNote(run: MatchedRun): string | null {
  if (!run.avg_hr) return null;
  if (EASY_LIKE_TYPES.has(run.workout_type) && run.avg_hr > EASY_HR_CEILING) {
    return `HR averaged ${run.avg_hr} bpm — above the ${EASY_HR_CEILING} bpm easy-day ceiling. Likely ran too hard for the intended effort.`;
  }
  if ((run.workout_type === "tempo" || run.workout_type === "pace") && run.avg_hr > LT_HR_REFERENCE) {
    return `HR averaged ${run.avg_hr} bpm — above your LT reference of ${LT_HR_REFERENCE} bpm. Effort may have drifted past "comfortably hard."`;
  }
  return null;
}

export type FeedbackSeverity = "good" | "info" | "warning" | "missed";

export function buildFeedback(run: MatchedRun): { severity: FeedbackSeverity; message: string } {
  const dVerdict = distanceVerdict(run);
  const pVerdict = paceVerdict(run);
  const hr = hrNote(run);

  if (dVerdict === "missed") {
    return {
      severity: "missed",
      message: `No run matched this ${run.badge.toLowerCase()} (${run.planned_km}km planned) anywhere in week ${run.week_number} — looks like it was skipped.`,
    };
  }

  if (dVerdict === "extra") {
    return {
      severity: "info",
      message: `Unplanned run of ${run.actual_km}km on ${run.activity_date} — beyond what week ${run.week_number}'s plan called for. Bonus mileage, or the week got rearranged.`,
    };
  }

  const parts: string[] = [];

  if (dVerdict === "short") {
    parts.push(`Came in short: ${run.actual_km}km of ${run.planned_km}km planned (matched by distance rank within week ${run.week_number}).`);
  } else if (dVerdict === "long") {
    parts.push(`Ran long: ${run.actual_km}km vs ${run.planned_km}km planned.`);
  } else {
    parts.push(`Distance on target (${run.actual_km}km vs ${run.planned_km}km planned).`);
  }

  if (pVerdict === "faster") {
    parts.push(`Pace was faster than the ${run.pace_target} target — fine occasionally, but watch for creeping intensity on what should be easier days.`);
  } else if (pVerdict === "slower") {
    parts.push(`Pace was slower than the ${run.pace_target} target.`);
  } else if (pVerdict === "on_pace") {
    parts.push(`Pace matched target (${run.pace_target}).`);
  }

  if (hr) parts.push(hr);

  let severity: FeedbackSeverity = "good";
  if (dVerdict === "short" || pVerdict === "slower") severity = "warning";
  if (hr) severity = "warning";
  if (dVerdict === "long" && run.workout_type !== "long") severity = "warning";

  return { severity, message: parts.join(" ") };
}

export type WeeklyRollup = {
  week_number: number;
  phase: string;
  planned_km: number;
  actual_km: number;
  adherence_pct: number;
  runs_missed: number;
};

export function buildWeeklyRollups(runs: MatchedRun[]): WeeklyRollup[] {
  const byWeek = new Map<number, MatchedRun[]>();
  for (const r of runs) {
    if (!byWeek.has(r.week_number)) byWeek.set(r.week_number, []);
    byWeek.get(r.week_number)!.push(r);
  }

  const rollups: WeeklyRollup[] = [];
  for (const [week, weekRuns] of [...byWeek.entries()].sort((a, b) => a[0] - b[0])) {
    const planned = weekRuns.reduce((s, r) => s + (r.planned_km || 0), 0);
    const actual = weekRuns.reduce((s, r) => s + (r.actual_km || 0), 0);
    const missed = weekRuns.filter((r) => r.planned_km && !r.actual_km).length;
    rollups.push({
      week_number: week,
      phase: weekRuns[0].phase,
      planned_km: Math.round(planned * 10) / 10,
      actual_km: Math.round(actual * 10) / 10,
      adherence_pct: planned > 0 ? Math.round((actual / planned) * 1000) / 10 : 0,
      runs_missed: missed,
    });
  }
  return rollups;
}