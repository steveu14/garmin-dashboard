import Dashboard from "@/components/Dashboard";
import { RefreshCw } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-primary inline-block animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight">Fitness Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">Synced from Garmin Connect</p>
      </div>
      <Dashboard />
    </main>
  );
}
