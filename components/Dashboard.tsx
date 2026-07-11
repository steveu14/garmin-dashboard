"use client";

import { useEffect, useState, useCallback } from "react";
import Papa from "papaparse";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Footprints, Flame, Timer, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_ID = "19vjqayIvLC-OxD7D5f9Vna1fbXj8aXCGqpW2Vxa8-1U";
const DAILY_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Daily%20Stats`;
const ACT_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Activities`;

type Row = Record<string, string>;

async function fetchCSV(url: string): Promise<Row[]> {
  const res = await fetch(url);
  const text = await res.text();
  return Papa.parse<Row>(text, { header: true, skipEmptyLines: true }).data;
}

function fmt(n: string | number) { return Math.round(Number(n || 0)).toLocaleString(); }
function fmtDate(d: string) {
  if (!d) return "";
  const p = d.split("-");
  if (p.length < 3) return d;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m[parseInt(p[1]) - 1] + " " + parseInt(p[2]);
}
function fmtType(t: string) {
  return (t || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] rounded-lg px-3 py-2 shadow-lg text-sm font-mono-data">
      <p className="text-[var(--color-ink-faint)] text-xs mb-1">{label}</p>
      <p className="font-semibold text-[var(--color-ink)]">{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

export default function Dashboard() {
  const [daily, setDaily]     = useState<Row[]>([]);
  const [acts, setActs]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [updatedAt, setUpd]   = useState("");
  const [tab, setTab]         = useState<"steps"|"calories">("steps");
  const [refreshing, setRef]  = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRef(true); else setLoading(true);
    setError(null);
    try {
      const [d, a] = await Promise.all([fetchCSV(DAILY_URL), fetchCSV(ACT_URL)]);
      const seen = new Set<string>();
      const unique = a.filter(r => {
        const key = r.Date + r["Activity Name"];
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      setDaily(d); setActs(unique);
      setUpd(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e: any) { setError(e.message); }
    finally { setLoading(false); setRef(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSteps = daily.reduce((s,r) => s+Number(r.Steps||0), 0);
  const totalCals  = daily.reduce((s,r) => s+Number(r["Total Calories"]||0), 0);
  const avgActive  = daily.length ? Math.round(daily.reduce((s,r)=>s+Number(r["Active Minutes"]||0),0)/daily.length) : 0;
  const hrVals     = daily.map(r=>Number(r["Resting HR"]||0)).filter(v=>v>0);
  const avgHR      = hrVals.length ? Math.round(hrVals.reduce((a,b)=>a+b,0)/hrVals.length) : null;
  const actCals    = acts.reduce((s,r)=>s+Number(r.Calories||0),0);

  const chartData = daily.map(r => ({
    date: fmtDate(r.Date),
    steps: Number(r.Steps||0),
    calories: Number(r["Total Calories"]||0),
    active: Number(r["Active Minutes"]||0),
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-[var(--color-ink-faint)]">
      <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-bib)]" />
      <span className="font-mono-data text-sm">Loading your data...</span>
    </div>
  );

  if (error) return (
    <Card className="border-[var(--color-flag-red)]/30 bg-[var(--color-flag-red-tint)]">
      <CardContent className="pt-6 text-sm text-[var(--color-flag-red)]">
        Could not load data. Make sure your Google Sheet is shared publicly as Viewer.
        <br /><span className="opacity-60 text-xs font-mono-data">{error}</span>
      </CardContent>
    </Card>
  );

  const stats = [
    { label: "Steps",        icon: Footprints, color: "var(--color-bib)",        value: fmt(totalSteps), sub: `last ${daily.length} days` },
    { label: "Calories",     icon: Flame,      color: "var(--color-flag-amber)", value: fmt(totalCals),  sub: `last ${daily.length} days` },
    { label: "Avg Active",   icon: Timer,      color: "var(--color-lane)",       value: `${avgActive} min`, sub: "per day" },
    { label: "Resting HR",   icon: Heart,      color: "var(--color-flag-red)",   value: avgHR ? `${avgHR} bpm` : "—", sub: "avg resting" },
    { label: "Activity Cals",icon: Zap,        color: "var(--color-flag-green)", value: fmt(actCals), sub: `${acts.length} activities` },
  ];

  return (
    <div className="space-y-5">
      {/* Refresh row */}
      <div className="flex items-center justify-end gap-3">
        {updatedAt && <span className="font-mono-data text-xs text-[var(--color-ink-faint)]">Updated {updatedAt}</span>}
        <button onClick={() => load(true)}
          className="flex items-center gap-1.5 eyebrow text-[11px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] bg-[var(--color-paper-dim)] border border-[var(--color-paper-line)] rounded-md px-3 py-1.5 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, icon: Icon, color, value, sub }) => (
          <Card key={label} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: color }} />
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-[10px] text-[var(--color-ink-faint)] flex items-center gap-1.5 normal-case tracking-wide">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="font-mono-data text-2xl font-medium text-[var(--color-ink)]">{value}</div>
              <div className="text-xs text-[var(--color-ink-faint)] mt-0.5">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Steps / Calories */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(["steps","calories"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("px-3 py-1.5 rounded-md eyebrow text-xs transition-all",
                    tab === t
                      ? t === "steps" ? "bg-[var(--color-bib)] text-white" : "bg-[var(--color-flag-amber)] text-white"
                      : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                  )}>
                  {t}
                </button>
              ))}
            </div>
            <span className="font-mono-data text-xs text-[var(--color-ink-faint)]">Last {daily.length} days</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-dim)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-paper-dim)" }} />
              {tab === "steps"
                ? <Bar dataKey="steps"    fill="var(--color-bib)" radius={[3,3,0,0]} />
                : <Bar dataKey="calories" fill="var(--color-flag-amber)" radius={[3,3,0,0]} />}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Active minutes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Active Minutes Trend</CardTitle>
            <span className="font-mono-data text-xs text-[var(--color-ink-faint)]">Last {daily.length} days</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-dim)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9a9da6", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="active" stroke="var(--color-lane)" strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-lane)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {acts.length === 0
            ? <p className="text-[var(--color-ink-faint)] text-sm px-6 pb-6">No activities found.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {["Date","Activity","Type","Distance","Duration","Calories","Avg HR"].map(h => (
                        <th key={h} className="text-left eyebrow text-[10px] text-[var(--color-ink-faint)] px-4 py-2.5 whitespace-nowrap border-b border-[var(--color-paper-line)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono-data">
                    {acts.slice().reverse().map((a, i) => (
                      <tr key={i} className={cn("transition-colors hover:bg-[var(--color-paper-dim)]", i % 2 === 1 && "bg-[var(--color-paper)]")}>
                        <td className="px-4 py-2.5 text-[var(--color-ink-faint)] text-xs whitespace-nowrap">{fmtDate(a.Date)}</td>
                        <td className="px-4 py-2.5 font-display font-medium text-[var(--color-ink)] whitespace-nowrap normal-case tracking-normal">{a["Activity Name"] || "—"}</td>
                        <td className="px-4 py-2.5"><Badge variant="success">{fmtType(a.Type)}</Badge></td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{Number(a["Distance (km)"]||0).toFixed(1)} km</td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{Math.round(Number(a["Duration (min)"]||0))} min</td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{fmt(a.Calories)}</td>
                        <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{a["Avg HR"] || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
