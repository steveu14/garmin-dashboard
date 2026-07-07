import TrainingPlan from "@/components/TrainingPlan";
import Link from "next/link";

export default function TrainingPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-primary inline-block animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight">Training Plan</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Plan vs actual, matched from Garmin activities.{" "}
          <Link href="/" className="underline hover:text-neutral-900">Back to Fitness Dashboard</Link>
        </p>
      </div>
      <TrainingPlan />
    </main>
  );
}
