"use client";

import { useEffect, useState, useCallback } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line
} from "recharts";

const SHEET_ID = "19vjqayIvLC-OxD7D5f9Vna1fbXj8aXCGqpW2Vxa8-1U";
const DAILY_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Daily%20Stats`;
const ACT_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Activities`;

type DailyRow = {
  Date: string;
  Steps: string;
  "Total Calories": string;
  "Active Minutes": string;
  "Resting HR": string;
  "Avg HR": string;
};

type ActivityRow = {
  Date: string;
  "Activity Name": string;
  Type: string;
  "Distance (km)": string;
  "Duration (min)": string;
  Calories: string;
  "Avg HR": string;
};

async function fetchCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const text = await res.text();
  const result = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

function fmt(n: string | number) {
  return Math.round(Number(n || 0)).toLocaleString();
}

function fmtDate(d: string) {
  if (!d) return "";
  const p = d.split("-");
  if (p.length < 3) return d;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m[parseInt(p[1]) - 1] + " " + parseInt(p[2]);
}

function fmtType(t: string) {
  if (!t) return "";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
      <div className="text-xs text-neutral-400 mt-1">{sub}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1">{label}</p>
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [activeTab, setActiveTab] = useState<"steps" | "calories">("steps");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, a] = await Promise.all([
        fetchCSV<DailyRow>(DAILY_URL),
        fetchCSV<ActivityRow>(ACT_URL),
      ]);
      setDaily(d);
      setActivities(a);
      setUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSteps = daily.reduce((s, r) => s + Number(r.Steps || 0), 0);
  const totalCals  = daily.reduce((s, r) => s + Number(r["Total Calories"] || 0), 0);
  const avgActive  = daily.length ? Math.round(daily.reduce((s, r) => s + Number(r["Active Minutes"] || 0), 0) / daily.length) : 0;
  const hrVals     = daily.map(r => Number(r["Resting HR"] || 0)).filter(v => v > 0);
  const avgHR      = hrVals.length ? Math.round(hrVals.reduce((a, b) => a + b, 0) / hrVals.length) : null;
  const actCals    = activities.reduce((s, r) => s + Number(r.Calories || 0), 0);

  const chartData = daily.map(r => ({
    date: fmtDate(r.Date),
    steps: Number(r.Steps || 0),
    calories: Number(r["Total Calories"] || 0),
    active: Number(r["Active Minutes"] || 0),
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-8 h-8 border-2 border-neutral-200 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-neutral-500 text-sm">Loading your data...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-red-600 dark:text-red-400 text-sm">
      Could not load data. Make sure your Google Sheet is shared publicly as Viewer.
      <br /><span className="opacity-60 text-xs">{error}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Steps"         value={fmt(totalSteps)} sub={`last ${daily.length} days`}      color="#10b981" />
        <StatCard label="Calories"      value={fmt(totalCals)}  sub={`last ${daily.length} days`}      color="#f97316" />
        <StatCard label="Avg active"    value={`${avgActive} min`} sub="per day"                       color="#f59e0b" />
        <StatCard label="Resting HR"    value={avgHR ? `${avgHR} bpm` : "—"} sub="avg resting"        color="#ec4899" />
        <StatCard label="Activity cals" value={fmt(actCals)}    sub={`${activities.length} activities`} color="#3b82f6" />
      </div>

      {/* Chart Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("steps")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "steps"
                  ? "bg-emerald-500 text-white"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              Steps
            </button>
            <button
              onClick={() => setActiveTab("calories")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "calories"
                  ? "bg-orange-500 text-white"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              Calories
            </button>
          </div>
          <span className="text-xs text-neutral-400">Last {daily.length} days</span>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(128,128,128,0.06)" }} />
            {activeTab === "steps"
              ? <Bar dataKey="steps"    fill="#10b981" radius={[5,5,0,0]} />
              : <Bar dataKey="calories" fill="#f97316" radius={[5,5,0,0]} />
            }
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Minutes Trend */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Active minutes trend</h2>
          <span className="text-xs text-neutral-400">Last {daily.length} days</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(128,128,128,0.2)" }} />
            <Line dataKey="active" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Activities Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Activities</h2>
        </div>
        {activities.length === 0 ? (
          <p className="text-neutral-400 text-sm p-5">No activities found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  {["Date","Activity","Type","Distance","Duration","Calories","Avg HR"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.slice().reverse().map((a, i) => (
                  <tr key={i} className="border-b border-neutral-50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-5 py-3 text-neutral-400 text-xs">{fmtDate(a.Date)}</td>
                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">{a["Activity Name"] || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        {fmtType(a.Type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">{Number(a["Distance (km)"] || 0).toFixed(1)} km</td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">{Math.round(Number(a["Duration (min)"] || 0))} min</td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">{fmt(a.Calories)}</td>
                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-300">{a["Avg HR"] || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
