"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import CoachChat from "@/components/CoachChat";
import RaceClock from "@/components/RaceClock";
import RaceProjection from "@/components/RaceProjection";
import {
  PlannedWorkout,
  Activity,
  MatchedRun,
  buildMatchedRuns,
  buildFeedback,
  buildWeeklyRollups,
  formatPace,
  FeedbackSeverity,
} from "@/lib/trainingFeedback";

function flagColor(severity: FeedbackSeverity) {
  switch (severity) {
    case "good": return "var(--color-flag-green)";
    case "info": return "var(--color-flag-blue)";
    case "warning": return "var(--color-flag-amber)";
    case "missed": return "var(--color-flag-red)";
  }
}

function flagLabel(severity: FeedbackSeverity) {
  switch (severity) {
    case "good": return "On track";
    case "info": return "Extra";
    case "warning": return "Review";
    case "missed": return "Missed";
  }
}

function StatusFlag({ severity }: { severity: FeedbackSeverity }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono-data text-[11px] uppercase tracking-wide" style={{ color: flagColor(severity) }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: flagColor(severity) }} />
      {flagLabel(severity)}
    </span>
  );
}

function fmtDate(d: string) {
  const p = d.split("-");
  if (p.length < 3) return d;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${m[parseInt(p[1]) - 1]} ${parseInt(p[2])}`;
}

export default function TrainingPlan() {
  const [plan, setPlan] = useState<PlannedWorkout[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFuture, setShowFuture] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [planRes, actRes] = await Promise.all([
        supabase.from("planned_workouts").select("*").order("workout_date"),
        supabase.from("activities").select(
          "activity_date, activity_name, activity_type, distance_km, duration_seconds, avg_pace_sec_per_km, avg_hr, splits"
        ),
      ]);
      if (planRes.error) throw planRes.error;
      if (actRes.error) throw actRes.error;
      setPlan(planRes.data as PlannedWorkout[]);
      setActivities(actRes.data as Activity[]);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const matchedRuns: MatchedRun[] = useMemo(
    () => buildMatchedRuns(plan, activities),
    [plan, activities]
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentWeekNumber = useMemo(() => {
    const pastWeeks = plan.filter((p) => p.workout_date <= todayStr).map((p) => p.week_number);
    return pastWeeks.length ? Math.max(...pastWeeks) : 0;
  }, [plan, todayStr]);

  const visibleRuns = useMemo(
    () => (showFuture ? matchedRuns : matchedRuns.filter((r) => r.week_number <= currentWeekNumber)),
    [matchedRuns, showFuture, currentWeekNumber]
  );

  const weeklyRollups = useMemo(() => buildWeeklyRollups(visibleRuns), [visibleRuns]);
  const currentWeek = weeklyRollups.find((w) => w.week_number === currentWeekNumber) ?? weeklyRollups[weeklyRollups.length - 1];

  const missedCount = visibleRuns.filter((r) => r.planned_km && !r.actual_km).length;
  const reviewCount = visibleRuns.filter((r) => buildFeedback(r).severity === "warning").length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-[var(--color-ink-faint)]">
      <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-bib)]" />
      <span className="font-mono-data text-sm">Loading training data...</span>
    </div>
  );

  if (error) return (
    <Card className="border-[var(--color-flag-red)]/30 bg-[var(--color-flag-red-tint)]">
      <CardContent className="pt-6 text-sm text-[var(--color-flag-red)]">
        Could not load training data from Supabase.
        <br /><span className="opacity-60 text-xs font-mono-data">{error}</span>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      {/* Main column */}
      <div className="space-y-5 min-w-0">
        <RaceClock currentWeek={currentWeekNumber} />

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFuture((v) => !v)}
            className="eyebrow text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] rounded-md px-3 py-1.5 transition-colors"
          >
            {showFuture ? "Show up to today" : "Show full plan"}
          </button>
          <button onClick={() => load(true)}
            className="flex items-center gap-1.5 eyebrow text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] rounded-md px-3 py-1.5 transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Summary strip -- scoreboard style, not generic stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-[var(--color-paper-line)] bg-[var(--color-paper-dim)] overflow-hidden">
          {[
            { label: "Current Week", value: currentWeek ? `W${currentWeek.week_number}` : "—", sub: currentWeek?.phase ?? "", color: "var(--color-ink)" },
            { label: "Volume", value: currentWeek ? `${currentWeek.actual_km}/${currentWeek.planned_km}` : "—", sub: "actual / planned km", color: "var(--color-lane)" },
            { label: "To Review", value: String(reviewCount), sub: "pace / HR / distance", color: "var(--color-flag-amber)" },
            { label: "Missed", value: String(missedCount), sub: "no activity found", color: "var(--color-flag-red)" },
          ].map((s, i) => (
            <div key={s.label} className={cn("px-5 py-4", i > 0 && "border-l border-[var(--color-paper-line)]")}>
              <div className="eyebrow text-[10px] text-[var(--color-ink-faint)] mb-1.5">{s.label}</div>
              <div className="font-mono-data text-2xl font-medium" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Weekly volume chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Weekly Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyRollups} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-dim)" vertical={false} />
                <XAxis dataKey="week_number" tickFormatter={(w) => `${w}`} tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} unit="km" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-paper-line)", backgroundColor: "var(--color-paper-dim)", color: "var(--color-ink)", fontFamily: "var(--font-mono)", fontSize: 12 }}
                  labelStyle={{ color: "var(--color-ink-faint)" }}
                  itemStyle={{ color: "var(--color-ink)" }}
                />
                <Bar dataKey="planned_km" name="Planned" fill="var(--color-paper-line)" radius={[3,3,0,0]} />
                <Bar dataKey="actual_km" name="Actual" fill="var(--color-bib)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <RaceProjection runs={matchedRuns} />

        {/* Split sheet: plan vs actual */}
        <Card>
          <CardHeader>
            <CardTitle>Split Sheet</CardTitle>
            <p className="text-xs text-[var(--color-ink-faint)] normal-case font-body">
              Runs matched to plan by distance/pace rank within each week, not exact day.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {visibleRuns.length === 0
              ? <p className="text-[var(--color-ink-faint)] text-sm px-6 pb-6">No plan data yet — seed planned_workouts in Supabase.</p>
              : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["Ran on","Wk","Workout","Planned","Actual","Pace","HR","Status"].map(h => (
                          <th key={h} className="text-left eyebrow text-[10px] text-[var(--color-ink-faint)] px-4 py-2.5 whitespace-nowrap border-b border-[var(--color-paper-line)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-mono-data">
                      {visibleRuns
                        .slice()
                        .sort((a, b) => {
                          if (b.week_number !== a.week_number) return b.week_number - a.week_number;
                          return (b.planned_km ?? -1) - (a.planned_km ?? -1);
                        })
                        .map((r, i) => {
                          const { severity } = buildFeedback(r);
                          return (
                            <tr key={`${r.week_number}-${r.badge}-${i}`} className={cn("transition-colors hover:bg-[var(--color-paper-dim)]", i % 2 === 1 && "bg-[var(--color-paper)]")}>
                              <td className="px-4 py-2.5 text-[var(--color-ink-faint)] text-xs whitespace-nowrap">{r.activity_date ? fmtDate(r.activity_date) : "—"}</td>
                              <td className="px-4 py-2.5 text-[var(--color-ink-faint)] text-xs whitespace-nowrap">{r.week_number}</td>
                              <td className="px-4 py-2.5 font-display font-medium text-[var(--color-ink)] whitespace-nowrap normal-case tracking-normal">{r.badge}</td>
                              <td className="px-4 py-2.5 text-[var(--color-ink-soft)] whitespace-nowrap">{r.planned_km ? `${r.planned_km}km` : "—"}</td>
                              <td className="px-4 py-2.5 text-[var(--color-ink-soft)] whitespace-nowrap">{r.actual_km ? `${r.actual_km}km` : "—"}</td>
                              <td className="px-4 py-2.5 text-[var(--color-ink-soft)] whitespace-nowrap">{formatPace(r.avg_pace_sec_per_km)}</td>
                              <td className="px-4 py-2.5 text-[var(--color-ink-soft)] whitespace-nowrap">{r.avg_hr ?? "—"}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <StatusFlag severity={severity} />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: coach chat, sticky */}
      <div className="lg:sticky lg:top-4 lg:self-start w-full lg:max-h-[calc(100vh-2rem)]">
        <CoachChat rollups={weeklyRollups} runs={visibleRuns} />
      </div>
    </div>
  );
}
