import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Fitness Dashboard</h1>
          <p className="text-sm text-[var(--color-ink-faint)] mt-0.5">Synced from Garmin Connect.</p>
        </div>
        <Dashboard />
      </main>
    </>
  );
}
