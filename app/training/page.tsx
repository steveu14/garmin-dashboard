import TrainingPlan from "@/components/TrainingPlan";
import SiteHeader from "@/components/SiteHeader";

export default function TrainingPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Training Plan</h1>
          <p className="text-sm text-[var(--color-ink-faint)] mt-0.5">
            Split sheet: plan vs actual, matched by week from Garmin activities.
          </p>
        </div>
        <TrainingPlan />
      </main>
    </>
  );
}
