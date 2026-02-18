"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function LineChart({ data, color, label, unit }) {
  const w = 720;
  const h = 220;
  const pad = 28;

  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  if (!isFinite(max) || !isFinite(min) || max === min) return null;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return { x, y, v };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 16, marginBottom: 10, fontWeight: 700 }}>
        {label}
      </div>

      <div
        style={{
          background: "#f8fbff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
        }}
      >
        <svg width={w} height={h}>
          <path d={path} fill="none" stroke={color} strokeWidth="3" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={color} />
              <text
                x={p.x}
                y={p.y - 10}
                fontSize="11"
                textAnchor="middle"
                fill="#374151"
              >
                {p.v}{unit}
              </text>
            </g>
          ))}
        </svg>

        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          Last {data.length} drills
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: "linear-gradient(135deg, #f0f9ff, #eef2ff)",
        border: "1px solid #e5e7eb",
        textAlign: "center",
        transition: "0.2s",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#475569" }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, marginTop: 4, color: "#64748b" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function SpeedDashboard() {
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpeedHistory();
  }, []);

  async function fetchSpeedHistory() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("speed_sessions")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setHistory(data);
    }

    setLoading(false);
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!history.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Speed Profile</h2>
        <p>No drills yet. Start your first drill.</p>
      </div>
    );
  }

  const drills = history.length;
  const recent = history.slice(-15);

  const effTimeline = recent.map(d => d.effective_wpm);
  const rawTimeline = recent.map(d => d.raw_wpm);
  const accTimeline = recent.map(d => d.accuracy_percent);

  const avgEff = Math.round(
    history.reduce((a, b) => a + b.effective_wpm, 0) / drills
  );
  const avgRaw = Math.round(
    history.reduce((a, b) => a + b.raw_wpm, 0) / drills
  );
  const avgAcc = Math.round(
    history.reduce((a, b) => a + b.accuracy_percent, 0) / drills
  );
  const lastDrill = history[history.length - 1];
const difficulty = lastDrill?.difficulty_level;

const avgTimePerPara = Math.round(
  history.reduce((a, b) => a + (b.time_per_paragraph_s || 0), 0) / drills
);

const stability =
  avgAcc >= 75
    ? "Comprehension stable"
    : avgAcc >= 60
    ? "Developing control"
    : "Speed overpowering accuracy";

  const last3 = history.slice(-3);

const effDelta =
  effTimeline.length > 1
    ? effTimeline[effTimeline.length - 1] - effTimeline[0]
    : 0;

const momentum =
  effDelta > 15
    ? "Acceleration phase — reading fluency compounding."
    : effDelta < -15
    ? "Drop detected — fatigue or rushing."
    : "Stable base — consistency building.";


 return (
 <div
  style={{
    marginTop: 30,
    padding: 30,
    borderRadius: 24,
   background: "#ffffff",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  }}
>
    
    

      <h2
  style={{
    fontSize: 30,
    fontWeight: 800,
    marginBottom: 30,
    color: "#0f172a",
  }}
>
  Speed Profile
</h2>

     <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 14,
    marginBottom: 30,
  }}
>
  <StatCard label="Effective WPM" value={avgEff} sub="True reading speed" />
  <StatCard label="Raw WPM" value={avgRaw} sub="Eye movement speed" />
  <StatCard label="Avg Accuracy" value={avgAcc + "%"} sub={stability} />
  <StatCard label="Avg Time / Para" value={avgTimePerPara + "s"} />
 <StatCard
  label="Current Level"
  value={difficulty ? difficulty.toUpperCase() : "—"}
/>
</div>

      <LineChart data={effTimeline} color="#22c55e" label="Effective Speed Trend" unit="" />
<LineChart data={accTimeline} color="#3b82f6" label="Accuracy Trend" unit="%" />

<div style={{ marginTop: 30 }}>
  <h3>Performance Insight</h3>
  <p style={{ color: "#475569", fontSize: 14 }}>
    {momentum}
  </p>
</div>

<h3 style={{ marginTop: 30 }}>Last 3 Drills</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  }}
>
  {last3.map((d) => {
    const accuracyColor =
      d.accuracy_percent >= 75
        ? "#16a34a"
        : d.accuracy_percent >= 60
        ? "#2563eb"
        : "#dc2626";

    const levelTint =
      d.difficulty_level === "elite"
        ? "#f0fdf4"
        : d.difficulty_level === "hard"
        ? "#eff6ff"
        : "#fef2f2";

    return (
      <div
        key={d.id}
        style={{
          padding: 20,
          borderRadius: 18,
          background: levelTint,
          borderLeft: `6px solid ${accuracyColor}`,
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          Effective: {d.effective_wpm} WPM
        </div>

        <div style={{ color: "#475569", fontSize: 14 }}>
          Raw: {d.raw_wpm} WPM
        </div>

        <div style={{ color: accuracyColor, fontWeight: 600 }}>
          Accuracy: {d.accuracy_percent}%
        </div>

        <div style={{ fontSize: 13, marginTop: 6 }}>
          Level: {d.difficulty_level}
        </div>

        <div style={{ fontSize: 13 }}>
          Time/Para: {d.time_per_paragraph_s}s
        </div>
      </div>
    );
  })}
</div>
</div>   // outer white card
);
}