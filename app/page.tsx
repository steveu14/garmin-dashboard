import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            Fitness Dashboard
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Synced from Garmin Connect</p>
        </div>
      </div>
      <Dashboard />
    </main>
  );
}
