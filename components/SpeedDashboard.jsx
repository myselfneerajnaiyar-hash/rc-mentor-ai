"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import TabGroup from "../components/TabGroup";
import PracticeSwitcher from "./PracticeSwitcher";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function SpeedDashboard() {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
const perPage = 5;

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("speed_sessions")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: true });

    if (data) setHistory(data);
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
  if (!history.length)
    return (
      <div style={{ padding: 30 }}>
        <h2>Speed Profile</h2>
        <p>No drills yet.</p>
      </div>
    );

  const drills = history.length;
  const totalPages = Math.ceil(history.length / perPage);

const paginated = history
  .slice()
  .reverse()
  .slice((page - 1) * perPage, page * perPage);

  const avgEff = Math.round(
    history.reduce((a, b) => a + b.effective_wpm, 0) / drills
  );
  const avgRaw = Math.round(
    history.reduce((a, b) => a + b.raw_wpm, 0) / drills
  );
  const avgAcc = Math.round(
    history.reduce((a, b) => a + b.accuracy_percent, 0) / drills
  );
  const avgTime = Math.round(
    history.reduce((a, b) => a + (b.time_per_paragraph_s || 0), 0) / drills
  );
  const efficiencyGap = avgRaw - avgEff;



  // --- Growth %
const firstEff = history[0]?.effective_wpm || 0;
const lastEff = history[history.length - 1]?.effective_wpm || 0;

const growthPercent =
  firstEff > 0
    ? Math.round(((lastEff - firstEff) / firstEff) * 100)
    : 0;

// --- Control Score
const controlScore =
  avgRaw > 0
    ? Math.round((avgEff / avgRaw) * 100)
    : 0;

  const chartData = history.slice(-20).map((d, i) => ({
    index: i + 1,
    effective: d.effective_wpm,
    raw: d.raw_wpm,
    accuracy: d.accuracy_percent,
  }));

  const volatility =
  chartData.length > 3
    ? Math.max(...chartData.map(d => d.effective)) -
      Math.min(...chartData.map(d => d.effective))
    : 0;

  const effDelta =
    chartData.length > 1
      ? chartData[chartData.length - 1].effective -
        chartData[0].effective
      : 0;

  const momentum =
    effDelta > 15
      ? "Acceleration phase — fluency compounding."
      : effDelta < -15
      ? "Drop detected — fatigue or inconsistency."
      : "Stable base — consistency building.";

     let phase;

if (avgAcc < 60) {
  phase = "Over-speeding / Comprehension Breakdown";
} else if (efficiencyGap > 60) {
  phase = "Control Deficit Phase";
} else if (volatility > 100) {
  phase = "High Variability — Inconsistent Output";
} else if (growthPercent > 10) {
  phase = "Acceleration Phase";
} else if (growthPercent < -10) {
  phase = "Regression Phase";
} else {
  phase = "Stability Consolidation";
}

function generateMentorMessage() {
  if (avgAcc < 60) {
    return "You are pushing speed beyond cognitive control. Reduce pace slightly and rebuild accuracy before scaling again.";
  }

  if (efficiencyGap > 60) {
    return "Raw speed is significantly higher than effective speed. Focus on comprehension retention and answer precision.";
  }

  if (volatility > 100) {
    return "Performance swings indicate inconsistent mental state. Prioritize routine timing and reading rhythm.";
  }

  if (growthPercent > 10) {
    return "Strong upward momentum. Carefully increase difficulty while protecting accuracy.";
  }

  if (growthPercent < -10) {
    return "Recent decline suggests fatigue or overload. Stabilize before attempting higher speeds.";
  }

  return "You are in consolidation mode. Build consistency before targeting the next performance jump.";
}


const riskLevel =
  avgAcc < 60
    ? "High Cognitive Strain"
    : effDelta < -15
    ? "Instability Detected"
    : "Healthy Training Zone";
  return (
    <div
      style={{
        marginTop: 30,
        padding: 30,
        borderRadius: 24,
        background: "#0f172a",
        color: "#e2e8f0",
      }}
    >
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
        Speed Profile
      </h2>

      {/* TABS */}
      <TabGroup
  tabs={[
    { value: "overview", label: "Overview" },
    { value: "trends", label: "Trends" },
    { value: "sessions", label: "Sessions" },
  ]}
  active={activeTab}
  onChange={setActiveTab}
/>
      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              marginBottom: 30,
            }}
          >
           <Stat label="Effective WPM" value={avgEff} />
<Stat label="Raw WPM" value={avgRaw} />
<Stat label="Avg Accuracy" value={avgAcc + "%"} />
<Stat label="Control Score" value={controlScore + "%"} />
<Stat label="Growth" value={growthPercent + "%"} />
<Stat label="Efficiency Gap" value={efficiencyGap} />
          </div>

          <h3 style={{ marginTop: 40, marginBottom: 12 }}>
  Recent Performance Snapshot
</h3>

<ResponsiveContainer width="100%" height={200}>
  <LineChart data={chartData.slice(-7)}>
    <CartesianGrid stroke="#1e293b" />
    <XAxis dataKey="index" />
    <YAxis />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="effective"
      stroke="#22c55e"
      strokeWidth={3}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>

          <div
  style={{
    background: "#1e293b",
    padding: 20,
    borderRadius: 16,
    borderLeft:
      growthPercent >= 0
        ? "6px solid #22c55e"
        : "6px solid #ef4444",
  }}
>
            <h3 style={{ marginBottom: 8 }}>Momentum Insight</h3>
            <p style={{ color: "#94a3b8" }}>{momentum}</p>
            <div
  style={{
    marginTop: 12,
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    background:
      riskLevel === "Healthy Training Zone"
        ? "#14532d"
        : riskLevel === "Instability Detected"
        ? "#7c2d12"
        : "#7f1d1d",
    color: "#fff",
  }}
>
  {riskLevel}
</div>
          </div>
          <div
  style={{
    marginTop: 40,
    background: "#111827",
    padding: 24,
    borderRadius: 18,
    border: "1px solid #1f2937",
  }}
>
  <h3 style={{ marginBottom: 12 }}>Mentor Analysis</h3>

  <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>
    <strong>Current Phase:</strong> {phase}
  </p>

  <p style={{ marginTop: 12, color: "#94a3b8", lineHeight: 1.7 }}>
    {generateMentorMessage()}
  </p>
</div>
        </>
      )}

      {/* TRENDS TAB */}
      {activeTab === "trends" && (
        <>
          <h3 style={{ marginBottom: 12 }}>Effective Speed</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="effective"
                stroke="#22c55e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
          <h3 style={{ marginTop: 40, marginBottom: 12 }}>
  Speed Comparison
</h3>

<ResponsiveContainer width="100%" height={250}>
  <LineChart data={chartData}>
    <CartesianGrid stroke="#1e293b" />
    <XAxis dataKey="index" />
    <YAxis />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="effective"
      stroke="#22c55e"
      strokeWidth={3}
    />
    <Line
      type="monotone"
      dataKey="raw"
      stroke="#f97316"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>

          <h3 style={{ marginTop: 40, marginBottom: 12 }}>
            Accuracy Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* SESSIONS TAB */}
      {activeTab === "sessions" && (
        <>
        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
       {paginated.map(d => (
            <div
              key={d.id}
              style={{
                background: "#1e293b",
                padding: 18,
                borderRadius: 14,
              }}
            >
              <div style={{ fontWeight: 700 }}>
                Effective: {d.effective_wpm} WPM
              </div>
              <div style={{ fontSize: 14 }}>
                Raw: {d.raw_wpm} WPM
              </div>
              <div style={{ fontSize: 14 }}>
                Accuracy: {d.accuracy_percent}%
              </div>
              <div style={{ fontSize: 14 }}>
                Time/Para: {d.time_per_paragraph_s}s
              </div>
            </div>
          ))}
        </div>  
         <div
  style={{
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
    gap: 12,
  }}
>
  <button
    disabled={page === 1}
    onClick={() => setPage(p => p - 1)}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      background: "#2563eb",
      color: "#fff",
      opacity: page === 1 ? 0.5 : 1,
    }}
  >
    Prev
  </button>

  <div style={{ padding: "8px 12px" }}>
    Page {page} / {totalPages}
  </div>

  <button
    disabled={page === totalPages}
    onClick={() => setPage(p => p + 1)}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      background: "#2563eb",
      color: "#fff",
      opacity: page === totalPages ? 0.5 : 1,
    }}
  >
    Next
  </button>
</div>  
</>
      )}

     
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        background: "#1e293b",
        padding: 20,
        borderRadius: 16,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>
        {label}
      </div>
    </div>
  );
}