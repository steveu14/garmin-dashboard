import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Fitness Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Synced from Garmin Connect</p>
        </div>
      </div>
      <Dashboard />
    </main>
  );
}
