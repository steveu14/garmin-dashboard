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

export type Split = {
  km: number;
  distance_m: number | null;
  duration_s: number | null;
  pace_sec_per_km: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  elevation_gain_m: number | null;
};

export type Activity = {
  activity_date: string;
  activity_name: string | null;
  activity_type: string | null;
  distance_km: number;
  duration_seconds: number;
  avg_pace_sec_per_km: number | null;
  avg_hr: number | null;
  splits?: Split[] | null;
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
  // Derived from splits (if available) -- not raw per-km data, just the
  // two signals that actually matter for coaching feedback.
  paceFadeSecPerKm: number | null; // positive = slowed in 2nd half, negative = negative split
  hrDriftBpm: number | null; // positive = HR climbed in 2nd half (cardiac drift/fatigue)
};

/** Compares first-half vs second-half splits to get pace fade and HR drift.
 * These two numbers are far more useful for coaching than raw per-km data,
 * and far cheaper to include in the AI coach's context. */
function computeSplitSignals(splits: Split[] | null | undefined): { paceFadeSecPerKm: number | null; hrDriftBpm: number | null } {
  if (!splits || splits.length < 4) return { paceFadeSecPerKm: null, hrDriftBpm: null }; // need enough splits for a meaningful half/half comparison
  const mid = Math.floor(splits.length / 2);
  const firstHalf = splits.slice(0, mid);
  const secondHalf = splits.slice(mid);

  const avg = (vals: (number | null)[]) => {
    const nums = vals.filter((v): v is number => v !== null);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  };

  const paceFirst = avg(firstHalf.map((s) => s.pace_sec_per_km));
  const paceSecond = avg(secondHalf.map((s) => s.pace_sec_per_km));
  const hrFirst = avg(firstHalf.map((s) => s.avg_hr));
  const hrSecond = avg(secondHalf.map((s) => s.avg_hr));

  return {
    paceFadeSecPerKm: paceFirst !== null && paceSecond !== null ? Math.round(paceSecond - paceFirst) : null,
    hrDriftBpm: hrFirst !== null && hrSecond !== null ? Math.round(hrSecond - hrFirst) : null,
  };
}

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

const PACE_WEIGHT_KM_PER_MIN = 2; // 1 min/km pace deviation costs as much as 2km of distance deviation

/** Cost of pairing a planned workout with an actual run: lower = better match.
 * Combines distance closeness and pace closeness (vs the planned pace target),
 * so e.g. an 8km run at easy pace won't get matched to a 19km long run just
 * because it's the only run logged that week. */
function matchCost(planned: PlannedWorkout, actual: Activity): number {
  const distDiff = Math.abs((planned.planned_km ?? 0) - actual.distance_km);
  let paceDiff = 0;
  const range = parsePaceRange(planned.pace_target);
  if (range && actual.avg_pace_sec_per_km) {
    const midSec = (range.minSec + range.maxSec) / 2;
    paceDiff = Math.abs(actual.avg_pace_sec_per_km - midSec) / 60; // minutes/km deviation
  }
  return distDiff + paceDiff * PACE_WEIGHT_KM_PER_MIN;
}

function matchedRow(week: WeekBucket, planned: PlannedWorkout, actual: Activity): MatchedRun {
  const { paceFadeSecPerKm, hrDriftBpm } = computeSplitSignals(actual.splits);
  return {
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
    paceFadeSecPerKm,
    hrDriftBpm,
  };
}

function missedRow(week: WeekBucket, planned: PlannedWorkout): MatchedRun {
  return {
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
    paceFadeSecPerKm: null,
    hrDriftBpm: null,
  };
}

function extraRow(week: WeekBucket, actual: Activity): MatchedRun {
  const { paceFadeSecPerKm, hrDriftBpm } = computeSplitSignals(actual.splits);
  return {
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
    paceFadeSecPerKm,
    hrDriftBpm,
  };
}

/** Greedy nearest-match: repeatedly pair whichever remaining planned/actual
 * run combo has the lowest cost, until one side runs out. This handles
 * partial weeks correctly -- a single 8km run won't get force-matched to a
 * 19km long run just because nothing else is logged yet. */
function matchWeek(week: WeekBucket, weekActivities: Activity[]): MatchedRun[] {
  const remainingPlanned = [...week.plannedRuns];
  const remainingActual = [...weekActivities];
  const results: MatchedRun[] = [];

  while (remainingPlanned.length && remainingActual.length) {
    let bestPi = -1, bestAi = -1, bestCost = Infinity;
    for (let pi = 0; pi < remainingPlanned.length; pi++) {
      for (let ai = 0; ai < remainingActual.length; ai++) {
        const cost = matchCost(remainingPlanned[pi], remainingActual[ai]);
        if (cost < bestCost) { bestCost = cost; bestPi = pi; bestAi = ai; }
      }
    }
    results.push(matchedRow(week, remainingPlanned[bestPi], remainingActual[bestAi]));
    remainingPlanned.splice(bestPi, 1);
    remainingActual.splice(bestAi, 1);
  }

  for (const planned of remainingPlanned) results.push(missedRow(week, planned));
  for (const actual of remainingActual) results.push(extraRow(week, actual));

  return results;
}

/** Build the full set of matched runs across all weeks. */
export function buildMatchedRuns(plan: PlannedWorkout[], activities: Activity[]): MatchedRun[] {
  const weeks = buildWeekBuckets(plan);
  const activitiesByWeek = assignActivitiesToWeeks(activities, weeks);
  return weeks.flatMap((w) => matchWeek(w, activitiesByWeek.get(w.week_number) ?? []));
}

/** Compact text summary of training data, sized for an LLM context window. */
export function buildCoachContext(rollups: WeeklyRollup[], runs: MatchedRun[]): string {
  const rollupLines = rollups
    .map((r) => `Week ${r.week_number} (${r.phase}): ${r.actual_km}/${r.planned_km}km actual/planned, ${r.adherence_pct}% adherence, ${r.runs_missed} run(s) missed`)
    .join("\n");

  const runLines = runs
    .slice()
    .sort((a, b) => a.week_number - b.week_number)
    .map((r) => {
      const dVerdict = distanceVerdict(r);
      const pVerdict = paceVerdict(r);
      const dateStr = r.activity_date ?? "not run";
      const paceStr = formatPace(r.avg_pace_sec_per_km);
      const splitNote = r.paceFadeSecPerKm !== null
        ? `, splits: ${r.paceFadeSecPerKm > 0 ? "+" : ""}${r.paceFadeSecPerKm}s/km fade 2nd half, HR drift ${r.hrDriftBpm !== null ? (r.hrDriftBpm > 0 ? "+" : "") + r.hrDriftBpm + "bpm" : "n/a"}`
        : "";
      return `Wk${r.week_number} ${r.badge} (planned ${r.planned_km ?? "-"}km @ ${r.pace_target ?? "n/a"}): ${dateStr}, actual ${r.actual_km ?? "-"}km @ ${paceStr}, HR ${r.avg_hr ?? "-"}, distance:${dVerdict}, pace:${pVerdict}${splitNote}`;
    })
    .join("\n");

  const projection = computeRaceProjection(runs);
  const projectionLine = projection.current
    ? `\n\nRACE PROJECTION: ${formatDuration(projection.current.projectedSeconds)} (Riegel formula, extrapolated from Wk${projection.current.week_number}'s best effort: ${projection.current.sourceKm}km ${projection.current.sourceBadge} @ ${formatPace(projection.current.sourcePaceSecPerKm)}). This is an estimate with real uncertainty -- not a guarantee.`
    : "";

  return `WEEKLY SUMMARY:\n${rollupLines}\n\nRUN-BY-RUN DETAIL (splits shown only when Garmin provided lap data):\n${runLines}${projectionLine}`;
}

const MARATHON_KM = 42.195;
const RIEGEL_EXPONENT = 1.06;

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export type RaceProjectionPoint = {
  week_number: number;
  projectedSeconds: number;
  sourceKm: number;
  sourcePaceSecPerKm: number;
  sourceBadge: string; // which run type produced this week's best effort
};

export type RaceProjection = {
  current: RaceProjectionPoint | null;
  history: RaceProjectionPoint[];
};

const MIN_PROJECTION_KM = 5; // Riegel's extrapolation is unreliable below this distance
// Only runs at genuine race-representative effort are usable Riegel inputs.
// Easy/medium/long/recovery runs are deliberately run well below race effort
// (that's the point of them), so feeding one in just because it happened to
// be the fastest thing logged so far this week produces a falsely slow
// projection -- Riegel has no way to know a pace was "easy for you."
const HARD_EFFORT_TYPES = new Set(["tempo", "pace", "race"]);

/** Projects marathon finish time using Riegel's formula (T2 = T1 * (D2/D1)^1.06).
 * Considers tempo, pace, and race-day runs of at least MIN_PROJECTION_KM --
 * not just designated "pace run" weeks, but deliberately excluding easy,
 * medium, long, and recovery runs, since those are run well below race
 * effort on purpose and would falsely drag the projection slower if one
 * happened to be the fastest thing logged before that week's hard session.
 * For each week, takes the single best (fastest Riegel-implied) effort
 * among eligible runs. Riegel is a well-established formula, not invented
 * for this app, but it's still an ESTIMATE -- it doesn't account for
 * marathon-specific glycogen depletion past ~30km, taper, weather, or
 * race-day variables. */
export function computeRaceProjection(runs: MatchedRun[]): RaceProjection {
  const eligible = runs.filter(
    (r) =>
      r.actual_km &&
      r.actual_km >= MIN_PROJECTION_KM &&
      r.avg_pace_sec_per_km &&
      HARD_EFFORT_TYPES.has(r.workout_type)
  );

  const byWeek = new Map<number, MatchedRun[]>();
  for (const r of eligible) {
    if (!byWeek.has(r.week_number)) byWeek.set(r.week_number, []);
    byWeek.get(r.week_number)!.push(r);
  }

  const history: RaceProjectionPoint[] = [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, weekRuns]) => {
      const points = weekRuns.map((r) => {
        const t1 = r.actual_km! * r.avg_pace_sec_per_km!; // seconds, derived from pace (not raw logged duration)
        const projectedSeconds = t1 * Math.pow(MARATHON_KM / r.actual_km!, RIEGEL_EXPONENT);
        return { projectedSeconds, sourceKm: r.actual_km!, sourcePaceSecPerKm: r.avg_pace_sec_per_km!, sourceBadge: r.badge };
      });
      // best effort = lowest projected time
      const best = points.reduce((a, b) => (b.projectedSeconds < a.projectedSeconds ? b : a));
      return { week_number: week, projectedSeconds: Math.round(best.projectedSeconds), sourceKm: best.sourceKm, sourcePaceSecPerKm: best.sourcePaceSecPerKm, sourceBadge: best.sourceBadge };
    });

  return {
    current: history.length ? history[history.length - 1] : null,
    history,
  };
}


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