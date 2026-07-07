// Coach-style analysis: matches planned workouts to actual Garmin activities
// and flags distance/pace/HR deviations.
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

export type MergedDay = PlannedWorkout & {
  actual_km: number | null;
  avg_pace_sec_per_km: number | null;
  avg_hr: number | null;
  matched_activity_name: string | null;
  extra_activities_count: number; // additional activities logged same day
};

const EASY_HR_CEILING = 145; // from the plan's own "HR <145 bpm" instruction
const LT_HR_REFERENCE = 179; // Steven's known lactate-threshold HR
const EASY_LIKE_TYPES = new Set(["easy", "medium", "long", "recovery"]);

/** Merge one day of plan with the best-matching activity(ies) for that date. */
export function mergeDay(plan: PlannedWorkout, activitiesForDay: Activity[]): MergedDay {
  if (activitiesForDay.length === 0) {
    return {
      ...plan,
      actual_km: null,
      avg_pace_sec_per_km: null,
      avg_hr: null,
      matched_activity_name: null,
      extra_activities_count: 0,
    };
  }

  // Assume the longest activity that day is "the" run; sum distance across all.
  const sorted = [...activitiesForDay].sort((a, b) => b.distance_km - a.distance_km);
  const primary = sorted[0];
  const totalKm = activitiesForDay.reduce((s, a) => s + (a.distance_km || 0), 0);

  return {
    ...plan,
    actual_km: Math.round(totalKm * 100) / 100,
    avg_pace_sec_per_km: primary.avg_pace_sec_per_km,
    avg_hr: primary.avg_hr,
    matched_activity_name: primary.activity_name,
    extra_activities_count: activitiesForDay.length - 1,
  };
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

export type DistanceVerdict = "rest" | "missed" | "short" | "on_target" | "long";

export function distanceVerdict(day: MergedDay): DistanceVerdict {
  if (day.planned_km === null) return "rest";
  if (!day.actual_km) return "missed";
  const pct = (day.actual_km / day.planned_km) * 100;
  if (pct < 90) return "short";
  if (pct > 110) return "long";
  return "on_target";
}

export type PaceVerdict = "n/a" | "no_data" | "faster" | "on_pace" | "slower";

export function paceVerdict(day: MergedDay): PaceVerdict {
  const range = parsePaceRange(day.pace_target);
  if (!range) return "n/a";
  if (!day.avg_pace_sec_per_km) return "no_data";
  const tolerance = 8; // seconds/km buffer either side
  if (day.avg_pace_sec_per_km < range.minSec - tolerance) return "faster";
  if (day.avg_pace_sec_per_km > range.maxSec + tolerance) return "slower";
  return "on_pace";
}

export function hrNote(day: MergedDay): string | null {
  if (!day.avg_hr) return null;
  if (EASY_LIKE_TYPES.has(day.workout_type) && day.avg_hr > EASY_HR_CEILING) {
    return `HR averaged ${day.avg_hr} bpm — above the ${EASY_HR_CEILING} bpm easy-day ceiling. Likely ran too hard for the intended effort.`;
  }
  if ((day.workout_type === "tempo" || day.workout_type === "pace") && day.avg_hr > LT_HR_REFERENCE) {
    return `HR averaged ${day.avg_hr} bpm — above your LT reference of ${LT_HR_REFERENCE} bpm. Effort may have drifted past "comfortably hard."`;
  }
  return null;
}

export type FeedbackSeverity = "good" | "info" | "warning" | "missed" | "rest";

export function buildFeedback(day: MergedDay): { severity: FeedbackSeverity; message: string } {
  const dVerdict = distanceVerdict(day);
  const pVerdict = paceVerdict(day);
  const hr = hrNote(day);

  if (dVerdict === "rest") {
    return { severity: "rest", message: "Rest day." };
  }
  if (dVerdict === "missed") {
    return { severity: "missed", message: "No matching activity found — run appears to have been missed." };
  }

  const parts: string[] = [];

  if (dVerdict === "short") {
    parts.push(`Came in short: ${day.actual_km}km of ${day.planned_km}km planned.`);
  } else if (dVerdict === "long") {
    parts.push(`Ran long: ${day.actual_km}km vs ${day.planned_km}km planned.`);
  } else {
    parts.push(`Distance on target (${day.actual_km}km vs ${day.planned_km}km planned).`);
  }

  if (pVerdict === "faster") {
    parts.push(`Pace was faster than the ${day.pace_target} target — fine occasionally, but watch for creeping intensity on what should be easier days.`);
  } else if (pVerdict === "slower") {
    parts.push(`Pace was slower than the ${day.pace_target} target.`);
  } else if (pVerdict === "on_pace") {
    parts.push(`Pace matched target (${day.pace_target}).`);
  }

  if (hr) parts.push(hr);

  let severity: FeedbackSeverity = "good";
  if (dVerdict === "short" || pVerdict === "slower") severity = "warning";
  if (hr) severity = "warning";
  if (dVerdict === "long" && day.workout_type !== "long") severity = "warning";

  return { severity, message: parts.join(" ") };
}

export type WeeklyRollup = {
  week_number: number;
  phase: string;
  planned_km: number;
  actual_km: number;
  adherence_pct: number;
  days_missed: number;
};

export function buildWeeklyRollups(days: MergedDay[]): WeeklyRollup[] {
  const byWeek = new Map<number, MergedDay[]>();
  for (const d of days) {
    if (!byWeek.has(d.week_number)) byWeek.set(d.week_number, []);
    byWeek.get(d.week_number)!.push(d);
  }

  const rollups: WeeklyRollup[] = [];
  for (const [week, weekDays] of [...byWeek.entries()].sort((a, b) => a[0] - b[0])) {
    const planned = weekDays.reduce((s, d) => s + (d.planned_km || 0), 0);
    const actual = weekDays.reduce((s, d) => s + (d.actual_km || 0), 0);
    const missed = weekDays.filter((d) => d.planned_km && !d.actual_km).length;
    rollups.push({
      week_number: week,
      phase: weekDays[0].phase,
      planned_km: Math.round(planned * 10) / 10,
      actual_km: Math.round(actual * 10) / 10,
      adherence_pct: planned > 0 ? Math.round((actual / planned) * 1000) / 10 : 0,
      days_missed: missed,
    });
  }
  return rollups;
}
