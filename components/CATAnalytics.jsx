"use client";
import React from "react";
const STORAGE_KEY = "catRCResults";

function getSectionalAccuracyTrend() {
  try {
    const data = JSON.parse(localStorage.getItem("catRCResults")) || {};

    return Object.entries(data)
      .map(([sectionalId, attempts]) => {
        if (!Array.isArray(attempts) || attempts.length === 0) return null;

        const a = attempts[0]; // locked attempt
        if (!a.correct || !a.total) return null;

        return {
          label: sectionalId.toUpperCase(),
          accuracy: Math.round((a.correct / a.total) * 100),
          time: a.timestamp,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
  } catch {
    return [];
  }
}
function getAverageTimePerQuestion() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    let totalQuestions = 0;
    let totalTime = 0;

    Object.values(data).forEach(sectionAttempts => {
      if (!Array.isArray(sectionAttempts) || sectionAttempts.length === 0)
        return;

      const attempt = sectionAttempts[0];

      if (attempt.total && attempt.timeTaken) {
        totalQuestions += attempt.total;
        totalTime += attempt.timeTaken;
      }
    });

    if (totalQuestions === 0) return null;

    return Math.round(totalTime / totalQuestions);
  } catch {
    return null;
  }
}
function getOverallAccuracy() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    let correct = 0;
    let total = 0;

    Object.values(data).forEach(sectionAttempts => {
      if (!Array.isArray(sectionAttempts) || sectionAttempts.length === 0)
        return;

      const attempt = sectionAttempts[0]; // locked attempt
      correct += attempt.correct || 0;
      total += attempt.total || 0;
    });

    if (total === 0) return null;

    return Math.round((correct / total) * 100);
  } catch {
    return null;
  }
}

function getRCSkillMetrics() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const attempts = Object.values(data)
      .map(a => (Array.isArray(a) ? a[0] : null))
      .filter(Boolean);

    if (attempts.length === 0) return null;

    let correct = 0;
    let total = 0;
    let totalTime = 0;

    attempts.forEach(a => {
      correct += a.correct || 0;
      total += a.total || 0;
      totalTime += a.timeTaken || 0;
    });

    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const avgTime = total ? Math.round(totalTime / total) : 0;

    // Heuristic scores (CAT-style logic)
    const speedScore =
      avgTime <= 45 ? 80 :
      avgTime <= 60 ? 65 :
      avgTime <= 75 ? 50 : 35;

    const selectionScore =
      accuracy >= 75 ? 75 :
      accuracy >= 65 ? 65 :
      accuracy >= 55 ? 55 : 45;

    const eliminationScore =
      accuracy >= 70 ? 70 :
      accuracy >= 60 ? 55 :
      accuracy >= 50 ? 45 : 35;

    const enduranceScore =
      attempts.length >= 6 ? 70 :
      attempts.length >= 4 ? 60 :
      attempts.length >= 2 ? 50 : 40;

    return {
      accuracy,
      speed: speedScore,
      selection: selectionScore,
      elimination: eliminationScore,
      endurance: enduranceScore,
    };
  } catch {
    return null;
  }
}
export default function CATAnalytics() {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      {/* ================= HEADER ================= */}
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>
        📊 CAT Sectional Analytics
      </h1>

      <p style={{ color: "#64748b", marginBottom: 28 }}>
        This analytics page reflects only your performance in CAT RC sectional
        tests. Practice RC, SpeedGym, and Vocabulary are not included.
      </p>

      {/* ================= GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* -------- Learning Overview -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Learning Overview</h3>
          <p style={cardSub}>
            Tracks your sectional test performance over time
          </p>

        <div style={{ width: "100%", height: 220 }}>
  {(() => {
    const data = getSectionalAccuracyTrend();

    if (data.length === 0) {
      return <span style={{ color: "#64748b" }}>No data yet</span>;
    }

    return (
    <div
  style={{
    height: 180,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
  }}
>
  {(() => {
    const data = getSectionalAccuracyTrend();

    if (!data.length) {
      return (
        <div style={{ color: "#64748b", textAlign: "center", marginTop: 60 }}>
          No data yet
        </div>
      );
    }

   const width = 500;
const height = 140;
const padding = 30;

const points = data.map((d, i) => {
  const x =
    padding +
    (i * (width - padding * 2)) / (data.length - 1 || 1);

  const y =
    padding +
    ((100 - d.accuracy) * (height - padding * 2)) / 100;

  return { x, y, label: d.label, accuracy: d.accuracy };
});

return (
  <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
    {/* X axis */}
    <line
      x1={padding}
      y1={height - padding}
      x2={width - padding}
      y2={height - padding}
      stroke="#cbd5e1"
    />

    {/* Y axis */}
    <line
      x1={padding}
      y1={padding}
      x2={padding}
      y2={height - padding}
      stroke="#cbd5e1"
    />

    {/* Line */}
    <polyline
      fill="none"
      stroke="#2563eb"
      strokeWidth="3"
      points={points.map(p => `${p.x},${p.y}`).join(" ")}
    />

    {/* Dots + values */}
    {points.map((p, i) => (
      <g key={i}>
       <circle cx={p.x} cy={p.y} r="4" fill="#2563eb">
  <title>{p.label} – {p.accuracy}% accuracy</title>
</circle>
        <text
          x={p.x}
          y={p.y - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#2563eb"
        >
          {p.accuracy}%
        </text>

        {/* X-axis label */}
        <text
          x={p.x}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#334155"
        >
          {p.label}
        </text>
      </g>
    ))}
  </svg>
);
  })()}
</div>
    );
  })()}
</div>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <Stat label="Total Sectionals" value="—" />
            <Stat label="Total Attempts" value="—" />
          </div>
        </div>

        {/* -------- Average Performance -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Average Performance</h3>
          <p style={cardSub}>Overall accuracy across sectionals</p>

          <div
  style={{
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {(() => {
    const accuracy = getOverallAccuracy();

    if (!accuracy) {
      return <span style={{ color: "#64748b" }}>No data yet</span>;
    }

    return (
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `conic-gradient(
            #3b82f6 ${accuracy * 3.6}deg,
            #e5e7eb 0deg
          )`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {accuracy}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Accuracy
          </div>
        </div>
      </div>
    );
  })()}
</div>
        </div>
      </div>

      {/* ================= SECOND ROW ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
        }}
      >
       {/* -------- Skill Breakdown -------- */}
<div style={card}>
  <h3 style={cardTitle}>RC Skill Profile</h3>
  <p style={cardSub}>Strengths & weaknesses across RC dimensions</p>

  {(() => {
    const metrics = getRCSkillMetrics();
    if (!metrics)
      return <div style={{ color: "#64748b" }}>No data yet</div>;

    const skills = [
      { label: "Accuracy", value: metrics.accuracy, color: "#22c55e", note: "Correct answers %" },
      { label: "Speed", value: metrics.speed, color: "#f59e0b", note: "Time per question" },
      { label: "Selection", value: metrics.selection, color: "#eab308", note: "Passage choice" },
      { label: "Elimination", value: metrics.elimination, color: "#ef4444", note: "Option elimination" },
      { label: "Endurance", value: metrics.endurance, color: "#f97316", note: "Accuracy over time" },
    ];

    return skills.map(skill => (
      <div key={skill.label} style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            marginBottom: 4,
            color: "#334155",
          }}
        >
          <span style={{ fontWeight: 600 }}>{skill.label}</span>
          <span>{skill.value}%</span>
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 6,
            background: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${skill.value}%`,
              height: "100%",
              background: skill.color,
              borderRadius: 6,
            }}
          />
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
          {skill.note}
        </div>
      </div>
    ));
  })()}
</div>

        {/* -------- Time Analysis -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Time Analysis</h3>
          <p style={cardSub}>Average time per question</p>

         <div
  style={{
    height: 160,
    borderRadius: 12,
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {(() => {
    const avg = getAverageTimePerQuestion();

    if (!avg) {
      return <span style={{ color: "#64748b" }}>No data yet</span>;
    }

    const min = Math.floor(avg / 60);
    const sec = avg % 60;

    return (
      <>
        <div style={{ fontSize: 26, fontWeight: 700 }}>
          {min}m {sec}s
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Avg time per question
        </div>
      </>
    );
  })()}
</div>
        </div>

        {/* -------- Plan of Action -------- */}
        <div style={card}>
          <h3 style={cardTitle}>Plan of Action</h3>
          <p style={cardSub}>What you should focus on next</p>

          <ul style={{ paddingLeft: 18, color: "#334155" }}>
            <li>Improve passage selection</li>
            <li>Reduce time spent on low ROI passages</li>
            <li>Increase accuracy above threshold</li>
          </ul>
        </div>
      </div>
      {/* ================= INSIGHT ROW ================= */}
<div
  style={{
    marginTop: 24,
    padding: "16px 20px",
    borderRadius: 14,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#1e3a8a",
    fontSize: 14,
    lineHeight: 1.6,
  }}
>
  <div style={{ fontWeight: 700, marginBottom: 6 }}>
    📌 Performance Insight
  </div>
  <div>
    Your accuracy is stable, but time pressure is reducing elimination
    efficiency. Focus on skipping low-ROI passages earlier to preserve mental
    bandwidth.
  </div>
</div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  background: "#ffffff",
  borderRadius: 14,
  padding: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 4,
};

const cardSub = {
  fontSize: 13,
  color: "#64748b",
  marginBottom: 16,
};

const placeholderBox = {
  height: 160,
  borderRadius: 12,
  background: "#f1f5f9",
  border: "1px dashed #cbd5e1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: 14,
};
