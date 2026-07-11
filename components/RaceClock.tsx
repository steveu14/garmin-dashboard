"use client";

const RACE_DATE = "2026-10-18";
const TOTAL_WEEKS = 18;
const GOAL_TIME = "3:50:00";
const GOAL_PACE = "5:20-5:27/km";

export default function RaceClock({ currentWeek }: { currentWeek: number }) {
  const today = new Date();
  const race = new Date(RACE_DATE + "T00:00:00");
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysOut = Math.max(0, Math.ceil((race.getTime() - today.getTime()) / msPerDay));

  const weekClamped = Math.min(Math.max(currentWeek, 0), TOTAL_WEEKS);

  return (
    <div className="rounded-xl border border-[var(--color-paper-line)] bg-[var(--color-void)] text-white px-6 py-6 sm:px-8 sm:py-7 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <div className="eyebrow text-white/50 mb-1.5">Race Day Countdown</div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono-data text-6xl sm:text-7xl font-medium leading-none">
              {daysOut}
            </span>
            <span className="font-display uppercase text-sm tracking-wide text-white/60 pb-1">
              {daysOut === 1 ? "day" : "days"} to go
            </span>
          </div>
        </div>

        <div className="flex gap-6 sm:gap-8 font-mono-data text-sm">
          <div>
            <div className="text-white/50 text-[11px] eyebrow mb-1 font-mono-data tracking-normal normal-case">Goal</div>
            <div className="text-base">{GOAL_TIME}</div>
            <div className="text-white/50 text-xs">{GOAL_PACE}</div>
          </div>
          <div>
            <div className="text-white/50 text-[11px] eyebrow mb-1 font-mono-data tracking-normal normal-case">Race</div>
            <div className="text-base">Oct 18</div>
            <div className="text-white/50 text-xs">2026</div>
          </div>
        </div>
      </div>

      {/* Week progress rail, ticked per week like a track lane meter marking */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-[11px] font-mono-data text-white/50 mb-1.5">
          <span>WK {weekClamped} / {TOTAL_WEEKS}</span>
          <span>{Math.round((weekClamped / TOTAL_WEEKS) * 100)}% ELAPSED</span>
        </div>
        <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-bib)] transition-all"
            style={{ width: `${(weekClamped / TOTAL_WEEKS) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {Array.from({ length: TOTAL_WEEKS + 1 }).map((_, i) => (
            <span
              key={i}
              className="w-px h-1.5"
              style={{ backgroundColor: i <= weekClamped ? "var(--color-bib)" : "rgba(255,255,255,0.15)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
