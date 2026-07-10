"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import CoachChat from "@/components/CoachChat";
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

function severityBadgeClass(severity: FeedbackSeverity) {
  switch (severity) {
    case "good":
      return "bg-emerald-100 text-emerald-700 border-transparent";
    case "info":
      return "bg-blue-100 text-blue-700 border-transparent";
    case "warning":
      return "bg-amber-100 text-amber-700 border-transparent";
    case "missed":
      return "bg-red-100 text-red-700 border-transparent";
  }
}

function severityLabel(severity: FeedbackSeverity) {
  switch (severity) {
    case "good": return "On track";
    case "info": return "Extra";
    case "warning": return "Review";
    case "missed": return "Missed";
  }
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
          "activity_date, activity_name, activity_type, distance_km, duration_seconds, avg_pace_sec_per_km, avg_hr"
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
  // "up to today" = everything through the current week (weeks are matched as a
  // whole, so partial-week filtering by exact day doesn't make sense here).
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
  const reviewCount = visibleRuns.filter((r) => {
    const { severity } = buildFeedback(r);
    return severity === "warning";
  }).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-neutral-400">
      <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
      <span className="text-sm">Loading training data...</span>
    </div>
  );

  if (error) return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6 text-sm text-red-600">
        Could not load training data from Supabase.
        <br /><span className="opacity-60 text-xs">{error}</span>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      {/* Refresh row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFuture((v) => !v)}
          className="text-xs text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          {showFuture ? "Show up to today" : "Show full plan"}
        </button>
        <button onClick={() => load(true)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-neutral-500">Current Week</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-neutral-900">{currentWeek ? `Week ${currentWeek.week_number}` : "—"}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{currentWeek?.phase ?? ""}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-neutral-500">This Week's Volume</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-neutral-900">
              {currentWeek ? `${currentWeek.actual_km} / ${currentWeek.planned_km}km` : "—"}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">actual / planned</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-neutral-500">Runs to Review</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-neutral-900">{reviewCount}</div>
            <div className="text-xs text-neutral-400 mt-0.5">pace/HR/distance flags</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-neutral-500">Missed Runs</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-neutral-900">{missedCount}</div>
            <div className="text-xs text-neutral-400 mt-0.5">planned, no activity found</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly volume chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Weekly Volume: Planned vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyRollups} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" vertical={false} />
              <XAxis dataKey="week_number" tickFormatter={(w) => `Wk ${w}`} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} unit="km" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="planned_km" name="Planned" fill="#d4d4d4" radius={[4,4,0,0]} />
              <Bar dataKey="actual_km" name="Actual" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan vs actual, matched within each week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Plan vs Actual</CardTitle>
          <p className="text-xs text-neutral-400">
            Runs are matched to plan by distance rank within each week, not by exact day — e.g. the week's longest run is treated as the long run, regardless of which day it fell on.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {visibleRuns.length === 0
            ? <p className="text-neutral-400 text-sm px-6 pb-6">No plan data yet — seed planned_workouts in Supabase.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-neutral-100">
                      {["Ran on","Wk","Workout","Planned","Actual","Pace","Avg HR","Status"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap bg-neutral-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRuns
                      .slice()
                      .sort((a, b) => {
                        if (b.week_number !== a.week_number) return b.week_number - a.week_number;
                        return (b.planned_km ?? -1) - (a.planned_km ?? -1);
                      })
                      .map((r, i) => {
                        const { severity } = buildFeedback(r);
                        return (
                          <tr key={`${r.week_number}-${r.badge}-${i}`} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors align-top">
                            <td className="px-5 py-3 text-neutral-400 text-xs whitespace-nowrap">{r.activity_date ? fmtDate(r.activity_date) : "—"}</td>
                            <td className="px-5 py-3 text-neutral-400 text-xs whitespace-nowrap">{r.week_number}</td>
                            <td className="px-5 py-3 font-semibold text-neutral-900 whitespace-nowrap">{r.badge}</td>
                            <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{r.planned_km ? `${r.planned_km}km` : "—"}</td>
                            <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{r.actual_km ? `${r.actual_km}km` : "—"}</td>
                            <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatPace(r.avg_pace_sec_per_km)}</td>
                            <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{r.avg_hr ?? "—"}</td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <Badge className={severityBadgeClass(severity)}>{severityLabel(severity)}</Badge>
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

      <CoachChat rollups={weeklyRollups} runs={visibleRuns} />
    </div>
  );
}