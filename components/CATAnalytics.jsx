"use client";
import { useState, useEffect } from "react";
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
  if (!Array.isArray(sectionAttempts) || sectionAttempts.length === 0) return;

  const attempt = sectionAttempts[0];
     if (!attempt.total || attempt.total === 0) return;

  // 🔒 HARD GUARD: ignore corrupted / empty attempts
  if (
    typeof attempt.total !== "number" ||
    attempt.total <= 0 ||
    typeof attempt.timeTaken !== "number" ||
    attempt.timeTaken <= 0
  ) {
    return;
  }

  totalQuestions += attempt.total;
  totalTime += attempt.timeTaken;
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

    let totalCorrect = 0;
    let totalAttempted = 0;

    Object.values(data).forEach(sectionAttempts => {
      if (!Array.isArray(sectionAttempts) || sectionAttempts.length === 0)
        return;

      const a = sectionAttempts[0];

      if (
        typeof a.correct !== "number" ||
        typeof a.attempted !== "number" ||
        a.attempted === 0
      ) {
        return;
      }

      totalCorrect += a.correct;
      totalAttempted += a.attempted;
    });

    if (totalAttempted === 0) return null;

    return Math.round((totalCorrect / totalAttempted) * 100);
  } catch {
    return null;
  }
}

function getSectionWiseMarks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    return Object.entries(data)
      .map(([sectionId, attempts]) => {
        if (!Array.isArray(attempts) || attempts.length === 0) return null;

        const a = attempts[0];

        // 🔒 HARD GUARDS
        if (!a.total || a.total === 0) return null;
        if (typeof a.correct !== "number") return null;

        const correct = a.correct;
        if (typeof a.attempted !== "number") return null;

        const attempted = a.attempted;
        const wrong = Math.max(attempted - correct, 0);

        const marks = correct * 3 - wrong * 1;

        return {
          label: sectionId.toUpperCase(),
          marks,
          correct,
          wrong,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
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

function getAttemptedSectionals() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return Object.keys(data).filter(
      k => Array.isArray(data[k]) && data[k].length > 0
    );
  } catch {
    return [];
  }
}

function extractMetrics(sectionId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const a = data[sectionId]?.[0];
    if (!a) return null;

    const attempted = a.attempted || a.total || 0;
    const correct = a.correct || 0;
    const wrong = a.wrong ?? Math.max(attempted - correct, 0);

    const accuracy = attempted
      ? Math.round((correct / attempted) * 100)
      : 0;

    const score = correct * 3 - wrong;

    const avgTime = attempted
      ? Math.round((a.timeTaken || 0) / attempted)
      : 0;

    return {
      accuracy,
      score,
      avgTime,
      correct,
      wrong,
      attempted,
    };
  } catch {
    return null;
  }
}

/* ================= PLAN TEMPLATES ================= */

const PLAN_TEMPLATES = {
  SELECTION_RESET: {
    title: "Passage Selection Reset (10 Days)",
    focus: ["Passage Selection", "Author Intent", "Attempt Discipline"],
    plan: [
      "Day 1–2: Solve 2 RC passages/day. Skip at least 1 passage consciously.",
      "Day 3–4: Solve 3 RC passages/day. Attempt max 3 questions per passage.",
      "Day 5–6: Mixed RC practice. Stop after 2 wrong in a passage.",
      "Day 7–8: Timed RC set (8–9 attempts max). No rereading passages.",
      "Day 9: Full RC sectional. Attempt cap = 9 questions.",
      "Day 10: Review all wrong + skipped passages. Write reasons."
    ]
  },

  ELIMINATION_FIX: {
    title: "Option Elimination Fix (10 Days)",
    focus: ["Option Elimination", "Trap Recognition"],
    plan: [
      "Day 1–2: Practice eliminating 2 options before reading fully.",
      "Day 3–4: RC drills focusing on extreme words (always, never).",
      "Day 5–6: Solve only inference questions.",
      "Day 7–8: Timed RC (10 questions) with elimination first.",
      "Day 9: Sectional RC focusing on accuracy.",
      "Day 10: Review wrong options and trap patterns."
    ]
  }
};

function getPersonalizedPlan(metrics) {
  if (!metrics) return null;

  // High wrong answers → elimination problem
  if (metrics.accuracy < 60) {
    return PLAN_TEMPLATES.ELIMINATION_FIX;
  }

  // Over-attempting → selection problem
  if (metrics.accuracy >= 60 && metrics.accuracy <= 70) {
    return PLAN_TEMPLATES.SELECTION_RESET;
  }

  // Default
  return PLAN_TEMPLATES.SELECTION_RESET;
}
export default function CATAnalytics() {
  const [compareA, setCompareA] = useState("");
const [compareB, setCompareB] = useState("");
  const metrics = getRCSkillMetrics();
 
 return (
  <div style={pageWrapper}>
    <div style={pageInner}>
      {/* ================= HEADER ================= */}
      <h1
  style={{
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 6,
    letterSpacing: "-0.3px",
  }}
>
        📊 CAT Sectional Analytics
      </h1>

    <p style={{
  fontSize: 14,
  color: "#64748b",
  lineHeight: 1.6,
  maxWidth: 600,
}}>
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

       {/* -------- Section-wise CAT Score -------- */}
<div style={card}>
  <h3 style={cardTitle}>Section-wise CAT Score</h3>
  <p style={cardSub}>Exact CAT scoring (+3 correct, −1 wrong)</p>

  {(() => {
    const data = getSectionWiseMarks();

    if (!data.length) {
      return <span style={{ color: "#64748b" }}>No data yet</span>;
    }

    const maxAbsMarks = Math.max(
      ...data.map(d => Math.abs(d.marks)),
      1
    );

    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          height: 180,
          marginTop: 12,
        }}
      >
        {data.map(d => (
          <div
            key={d.label}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12,
              color: "#334155",
            }}
          >
            <div
              title={`${d.marks} marks (${d.correct}C, ${d.wrong}W)`}
              style={{
                height: `${(Math.abs(d.marks) / maxAbsMarks) * 120}px`,
                background: d.marks >= 0 ? "#22c55e" : "#ef4444",
                borderRadius: 6,
                marginBottom: 6,
                transition: "height 0.3s",
              }}
            />
            <div style={{ fontWeight: 600 }}>{d.marks}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    );
  })()}
</div>
      </div>

{/* ================= COMPARISON ================= */}
<div style={card}>
  <h3 style={cardTitle}>📊 Sectional Comparison</h3>
  <p style={cardSub}>Compare performance between two sectionals</p>

  {(() => {
    const sectionals = getAttemptedSectionals();

    if (sectionals.length < 2) {
      return (
        <div style={{ color: "#64748b" }}>
          Attempt at least 2 sectionals to enable comparison
        </div>
      );
    }

    const A = extractMetrics(compareA);
    const B = extractMetrics(compareB);

    return (
      <>
        {/* Dropdowns */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <select
            value={compareA}
            onChange={e => setCompareA(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select Sectional</option>
            {sectionals.map(s => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={compareB}
            onChange={e => setCompareB(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select Sectional</option>
            {sectionals.map(s => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Table */}
       {A && B && (
  <>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[
        { label: "Accuracy (%)", a: A.accuracy, b: B.accuracy, higherBetter: true },
        { label: "Score", a: A.score, b: B.score, higherBetter: true },
        { label: "Avg Time / Q (s)", a: A.avgTime, b: B.avgTime, higherBetter: false },
        { label: "Correct", a: A.correct, b: B.correct, higherBetter: true },
        { label: "Wrong", a: A.wrong, b: B.wrong, higherBetter: false },
      ].map(({ label, a, b, higherBetter }) => {
        const diff = b - a;
        const improved = higherBetter ? diff > 0 : diff < 0;
        const worsened = higherBetter ? diff < 0 : diff > 0;

        const color = improved
          ? "#16a34a"
          : worsened
          ? "#dc2626"
          : "#64748b";

        const arrow = improved ? "⬆" : worsened ? "⬇" : "➜";

        return (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          >
            <strong>{label}</strong>
            <div>{a}</div>
            <div>{b}</div>
            <div style={{ color, fontWeight: 700 }}>
              {arrow} {diff > 0 ? "+" : ""}
              {diff}
            </div>
          </div>
        );
      })}
    </div>

    {/* Smart Insights */}
    <div style={insightBox}>
      <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>
        {B.score < A.score && (
          <li>📉 Score dropped despite similar accuracy. Review risk calibration.</li>
        )}
        {B.avgTime <= A.avgTime && B.accuracy < A.accuracy && (
          <li>⚠️ Speed improved but accuracy fell — possible rushing.</li>
        )}
        {B.wrong < A.wrong && (
          <li>✅ Fewer wrong answers — elimination skills improving.</li>
        )}
        {B.attempted > A.attempted && B.accuracy < A.accuracy && (
          <li>🧠 Over-attempting reduced accuracy. Be more selective.</li>
        )}
      </ul>
    </div>
  </>
)}
      </>
    );
  })()}
</div>

    {/* ================= PLAN OF ACTION ================= */}
<div style={card}>
  <h2 style={sectionTitle}>
  🎯 Personalized 10-Day Plan
</h2>
  <p style={cardSub}>
    What to focus on before your next CAT RC sectional
  </p>

  {(() => {
    const plan = getPersonalizedPlan(metrics);

    if (!plan) {
      return <div style={{ color: "#64748b" }}>No data yet</div>;
    }

    return (
      <>
        <h4 style={{ marginBottom: 6 }}>Focus Skills</h4>
        <ul>
          {plan.focus.map(f => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <h3 style={{ marginTop: 12 }}>📅 {plan.title}</h3>
        <ol>
          {plan.plan.map((step, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {step}
            </li>
          ))}
        </ol>
      </>
    );
  })()}
</div>

      
      {/* ================= INSIGHT ROW ================= */}
<div
  style={{
    marginTop: 24,
    padding: "16px 20px",
    borderRadius: 14,
    background: "#ffffff",
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
const selectStyle = {
  flex: 1,
  padding: 8,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const insightBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 10,
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  fontSize: 13,
};
const sectionTitle = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 6,
  color: "#0f172a",
};

const planTitle = {
  fontSize: 17,
  fontWeight: 700,
  marginTop: 14,
  marginBottom: 10,
  color: "#1e293b",
};
const pageWrapper = {
  minHeight: "100vh",
  background: "#f1f5fb", // light blue / grey-blue
};

const pageInner = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "20px 14px",
};
