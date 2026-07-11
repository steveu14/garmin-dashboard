"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchedRun, computeRaceProjection, formatDuration, formatPace } from "@/lib/trainingFeedback";

const GOAL_SECONDS = 3 * 3600 + 50 * 60; // 3:50:00
const GOAL_LABEL = "3:50:00";

export default function RaceProjection({ runs }: { runs: MatchedRun[] }) {
  const projection = computeRaceProjection(runs);

  if (!projection.current) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Race Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-ink-faint)]">
            No tempo, pace, or race-day runs logged yet — this fills in once you've completed one of those (easy/long runs are deliberately excluded, since they're not representative of race effort).
          </p>
        </CardContent>
      </Card>
    );
  }

  const deltaSeconds = projection.current.projectedSeconds - GOAL_SECONDS;
  const ahead = deltaSeconds <= 0;
  const deltaColor = ahead ? "var(--color-flag-green)" : "var(--color-flag-amber)";

  const chartData = projection.history.map((p) => ({
    week: p.week_number,
    minutes: Math.round(p.projectedSeconds / 60),
  }));
  const goalMinutes = Math.round(GOAL_SECONDS / 60);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Race Projection</CardTitle>
        <p className="text-xs text-[var(--color-ink-faint)] normal-case font-body">
          Riegel formula, from your best tempo/pace/race effort each week. An estimate, not a guarantee.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3 mb-5">
          <div>
            <div className="eyebrow text-[10px] text-[var(--color-ink-faint)] mb-1">Projected Finish</div>
            <div className="font-mono-data text-3xl font-medium text-[var(--color-ink)]">
              {formatDuration(projection.current.projectedSeconds)}
            </div>
          </div>
          <div>
            <div className="eyebrow text-[10px] text-[var(--color-ink-faint)] mb-1">Goal</div>
            <div className="font-mono-data text-lg text-[var(--color-ink-soft)]">{GOAL_LABEL}</div>
          </div>
          <div>
            <div className="eyebrow text-[10px] text-[var(--color-ink-faint)] mb-1">Delta</div>
            <div className="font-mono-data text-lg" style={{ color: deltaColor }}>
              {ahead ? "-" : "+"}{formatDuration(Math.abs(deltaSeconds))}
            </div>
          </div>
          <div>
            <div className="eyebrow text-[10px] text-[var(--color-ink-faint)] mb-1">From</div>
            <div className="font-mono-data text-sm text-[var(--color-ink-soft)]">
              Wk{projection.current.week_number} {projection.current.sourceBadge}, {projection.current.sourceKm}km @ {formatPace(projection.current.sourcePaceSecPerKm)}
            </div>
          </div>
        </div>

        {chartData.length >= 2 && (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-dim)" vertical={false} />
              <XAxis dataKey="week" tickFormatter={(w) => `W${w}`} tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }}
                axisLine={false} tickLine={false}
                tickFormatter={(m) => formatDuration(m * 60).slice(0, -3)}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <ReferenceLine y={goalMinutes} stroke="var(--color-flag-green)" strokeDasharray="4 4" />
              <Tooltip
                formatter={(v) => formatDuration(Number(v) * 60)}
                labelFormatter={(w) => `Week ${w}`}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--color-paper-line)", backgroundColor: "var(--color-paper-dim)", fontFamily: "var(--font-mono)", fontSize: 12 }}
                labelStyle={{ color: "var(--color-ink-faint)" }}
              />
              <Line dataKey="minutes" stroke="var(--color-bib)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-bib)", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}