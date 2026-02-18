"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";


function getSectionalAccuracyTrend(data) {
  if (!data || !data.length) return [];

  return data
    .filter(d => d.sectional_tests?.sectional_id)
    .map(d => {
      const total = d.sectional_tests?.total_questions || 0;
      const correct = d.total_correct || 0;

      return {
        label: d.sectional_tests.sectional_id.toUpperCase(),
        accuracy: total
          ? Math.round((correct / total) * 100)
          : 0,
        time: new Date(d.sectional_tests.created_at).getTime(),
      };
    })
    .sort((a, b) => a.time - b.time);
}

function getAverageTimePerQuestion(data) {
  if (!data || !data.length) return null;

  let totalTime = 0;
  let totalQuestions = 0;

  data.forEach(d => {
    const total = d.sectional_tests?.total_questions || 0;
    totalTime += d.total_time_s || 0;
    totalQuestions += total;
  });

  if (!totalQuestions) return null;

  return Math.round(totalTime / totalQuestions);
}

function getOverallAccuracy(data) {
  if (!data || !data.length) return null;

  let totalCorrect = 0;
  let totalQuestions = 0;

  data.forEach(d => {
    const total = d.sectional_tests?.total_questions || 0;
    totalCorrect += d.total_correct || 0;
    totalQuestions += total;
  });

  if (!totalQuestions) return null;

  return Math.round((totalCorrect / totalQuestions) * 100);
}

function getSectionWiseMarks(data) {
  if (!data || !data.length) return [];

  const grouped = {};

  data.forEach(d => {
    const id = d.sectional_tests?.sectional_id;
    if (!id) return;

    if (!grouped[id]) {
      grouped[id] = {
        correct: 0,
        wrong: 0,
        score: 0,
      };
    }

    grouped[id].correct += d.total_correct || 0;
    grouped[id].wrong += d.total_wrong || 0;
    grouped[id].score += d.total_score || 0;
  });

  return Object.entries(grouped).map(([id, values]) => ({
    label: id.toUpperCase(),
    marks: values.score,
    correct: values.correct,
    wrong: values.wrong,
  }));
}

function getRCSkillMetrics(data) {
  if (!data || !data.length) return null;

  let totalCorrect = 0;
  let totalQuestions = 0;
  let totalTime = 0;

  data.forEach(d => {
    const total = d.sectional_tests?.total_questions || 0;
    totalCorrect += d.total_correct || 0;
    totalQuestions += total;
    totalTime += d.total_time_s || 0;
  });

  const accuracy = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const avgTime = totalQuestions
    ? Math.round(totalTime / totalQuestions)
    : 0;

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
    data.length >= 6 ? 70 :
    data.length >= 4 ? 60 :
    data.length >= 2 ? 50 : 40;

  return {
    accuracy,
    speed: speedScore,
    selection: selectionScore,
    elimination: eliminationScore,
    endurance: enduranceScore,
  };
}


function getAttemptedSectionals(data) {
  if (!data || !data.length) return [];

  const unique = new Set(
    data.map(d => d.sectional_tests?.sectional_id)
  );

  return Array.from(unique).filter(Boolean);
}

function extractMetrics(sectionId, data) {
  if (!data || !data.length) return null;

  const rows = data.filter(
    d => d.sectional_tests?.sectional_id === sectionId
  );

  if (!rows.length) return null;

  let totalCorrect = 0;
  let totalWrong = 0;
  let totalTime = 0;
  let totalQuestions = 0;

  rows.forEach(d => {
    totalCorrect += d.total_correct || 0;
    totalWrong += d.total_wrong || 0;
    totalTime += d.total_time_s || 0;
    totalQuestions += d.sectional_tests?.total_questions || 0;
  });

  const attempted = totalCorrect + totalWrong;

  const accuracy = attempted
    ? Math.round((totalCorrect / attempted) * 100)
    : 0;

  const avgTime = attempted
    ? Math.round(totalTime / attempted)
    : 0;

  const score = totalCorrect * 3 - totalWrong;

  return {
    accuracy,
    score,
    avgTime,
    correct: totalCorrect,
    wrong: totalWrong,
    attempted,
  };
}



function getLastNSectionals(data, n = 3) {
  if (!data?.length) return [];

  // Sort by test created_at
  const sorted = [...data].sort((a, b) => {
    const tA = new Date(a.sectional_tests?.created_at).getTime();
    const tB = new Date(b.sectional_tests?.created_at).getTime();
    return tA - tB;
  });

  return sorted.slice(-n);
}

/* ================= CONFIDENCE ENGINE ================= */

function calculateVolatility(trendData) {
  if (!trendData || trendData.length < 2) return 0;

  const mean =
    trendData.reduce((sum, d) => sum + d.accuracy, 0) /
    trendData.length;

  const variance =
    trendData.reduce((sum, d) => {
      return sum + Math.pow(d.accuracy - mean, 2);
    }, 0) / trendData.length;

  return Math.sqrt(variance);
}

function calculateConfidenceScore({ accuracy, avgTime, volatility }) {
  const stabilityScore = Math.max(0, 100 - volatility * 2);

  const optimalTime = 75;
  const timeDeviation = Math.abs(avgTime - optimalTime);
  const timeScore = Math.max(0, 100 - timeDeviation);

  const accuracyScore = accuracy;

  return Math.round(
    stabilityScore * 0.4 +
    timeScore * 0.3 +
    accuracyScore * 0.3
  );
}

function getConfidenceLabel(score) {
  if (score >= 75) return "Exam Ready Confidence";
  if (score >= 55) return "Developing Stability";
  if (score >= 35) return "Inconsistent Execution";
  return "Low Decision Confidence";
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


function getPersonalizedPlan(metrics, sectionalData) {
  if (!metrics || !sectionalData?.length) return null;

  const lastThree = getLastNSectionals(sectionalData, 3);

  if (!lastThree.length) return null;

  // ----- RECENT METRICS -----
  const recentAccuracy = lastThree.map(d => {
    const total = d.sectional_tests?.total_questions || 0;
    const correct = d.total_correct || 0;
    return total ? (correct / total) * 100 : 0;
  });

  const recentTime = lastThree.map(d => {
    const total = d.sectional_tests?.total_questions || 0;
    return total ? (d.total_time_s / total) : 0;
  });

  const trend =
    recentAccuracy.length >= 2
      ? recentAccuracy[recentAccuracy.length - 1] -
        recentAccuracy[recentAccuracy.length - 2]
      : 0;

  const latestAccuracy = recentAccuracy[recentAccuracy.length - 1];
  const latestTime = recentTime[recentTime.length - 1];

  // ----- DECISION LOGIC -----

  // 1️⃣ Declining accuracy → stability fix
  if (trend < -5) {
    return {
      title: "Stability Recovery Plan (10 Days)",
      focus: ["Mental Stability", "Error Control", "Attempt Discipline"],
      plan: [
        "Day 1–2: Solve 1 sectional per day. Cap attempts at 8.",
        "Day 3–4: Review only wrong answers deeply.",
        "Day 5–6: Practice medium-difficulty RC only.",
        "Day 7–8: Timed sectional but stop after 2 wrong.",
        "Day 9–10: Controlled simulation under exam timing."
      ]
    };
  }

  // 2️⃣ Speed increasing but accuracy falling → rushing problem
  if (trend < 0 && latestTime < 55) {
    return {
      title: "Anti-Rushing Calibration Plan",
      focus: ["Pacing Control", "Option Evaluation"],
      plan: [
        "Day 1–2: Minimum 60 sec per question rule.",
        "Day 3–4: Justify answer before marking.",
        "Day 5–6: Practice inference questions only.",
        "Day 7–8: Timed sectional with strict elimination method.",
        "Day 9–10: Review all traps missed."
      ]
    };
  }

  // 3️⃣ High accuracy but slow → speed enhancement
  if (latestAccuracy >= 70 && latestTime > 70) {
    return {
      title: "Speed Upgrade Protocol",
      focus: ["Reading Speed", "Decision Speed"],
      plan: [
        "Day 1–2: 6 min per passage cap.",
        "Day 3–4: 50 sec per question drills.",
        "Day 5–6: Summary mapping under 2 minutes.",
        "Day 7–8: Full sectional speed run.",
        "Day 9–10: Redo slowest sectional."
      ]
    };
  }

  // 4️⃣ Accuracy below 60 consistently → elimination fix
  if (latestAccuracy < 60) {
    return PLAN_TEMPLATES.ELIMINATION_FIX;
  }

  // 5️⃣ Default
  return PLAN_TEMPLATES.SELECTION_RESET;
}

export default function CATAnalytics() {

  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  const [sectionalData, setSectionalData] = useState([]);

  useEffect(() => {
    async function loadAnalytics() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data, error } = await supabase
       .from("sectional_test_attempts")
.select(`
  total_correct,
  total_wrong,
  total_score,
  total_time_s,
  test_id,
  sectional_tests:sectional_tests!inner (
    sectional_id,
    total_questions,
    created_at
  )
`)
        .eq("user_id", authData.user.id);

      if (!error && data) {
        setSectionalData(data);
      }
    }

    loadAnalytics();
  }, []);

  const metrics = getRCSkillMetrics(sectionalData);
  const trendData = getSectionalAccuracyTrend(sectionalData);
const volatility = calculateVolatility(trendData);

const overallAccuracy = getOverallAccuracy(sectionalData) || 0;
const avgTime = getAverageTimePerQuestion(sectionalData) || 0;

const confidenceScore = calculateConfidenceScore({
  accuracy: overallAccuracy,
  avgTime: avgTime,
  volatility: volatility,
});

const confidenceLabel = getConfidenceLabel(confidenceScore);
  
 
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
    gridTemplateColumns:
      window.innerWidth < 768 ? "1fr" : "2fr 1fr",
    gap: 16,
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
    const data = getSectionalAccuracyTrend(sectionalData);

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
    const data = getSectionalAccuracyTrend(sectionalData);

    if (!data.length) {
      return (
        <div style={{ color: "#64748b", textAlign: "center", marginTop: 60 }}>
          No data yet
        </div>
      );
    }

   const width = data.length * 140;
const height = 140;
const padding = 40;

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
  <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180">

  
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
           <Stat
  label="Total Sectionals"
  value={getAttemptedSectionals(sectionalData).length}
/>

<Stat
  label="Total Attempts"
  value={sectionalData.length}
/>
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
    const accuracy = getOverallAccuracy(sectionalData);

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
         gridTemplateColumns:
  window.innerWidth < 768 ? "1fr" : "1fr 1fr 1fr",
          gap: 20,
        }}
      >
       {/* -------- Skill Breakdown -------- */}
<div style={card}>
  <h3 style={cardTitle}>RC Skill Profile</h3>
  <p style={cardSub}>Strengths & weaknesses across RC dimensions</p>

  {(() => {
    const metrics = getRCSkillMetrics(sectionalData);
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
      <div key={skill.label} style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            marginBottom: 3,
            letterSpacing: "0.2px",
            color: "#334155",
          }}
        >
          <span style={{ fontWeight: 600 }}>{skill.label}</span>
         <span style={{ fontWeight: 600 }}>{skill.value}%</span>
        </div>

        <div
          style={{
            height: 8,
            borderRadius: 5,
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

        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
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
    const avg = getAverageTimePerQuestion(sectionalData);

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
    const data = getSectionWiseMarks(sectionalData);

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
    const sectionals = getAttemptedSectionals(sectionalData);

    if (sectionals.length < 2) {
      return (
        <div style={{ color: "#64748b" }}>
          Attempt at least 2 sectionals to enable comparison
        </div>
      );
    }

    const A = extractMetrics(compareA,sectionalData);
    const B = extractMetrics(compareB,sectionalData);

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
{/* ================= PLAN + CONFIDENCE ROW ================= */}
<div
  style={{
    display: "grid",
    gridTemplateColumns:
      window.innerWidth < 768 ? "1fr" : "2fr 1fr",
    gap: 20,
    marginTop: 20,
  }}
>
  {/* -------- Personalized Plan (65%) -------- */}
  <div style={card}>
    <h2 style={sectionTitle}>🎯 Personalized 10-Day Plan</h2>
    <p style={cardSub}>
      What to focus on before your next CAT RC sectional
    </p>

    {(() => {
      const plan = getPersonalizedPlan(metrics, sectionalData);

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

  {/* -------- Confidence Index (35%) -------- */}
  <div style={card}>
    <h3 style={cardTitle}>Confidence Index</h3>
    <p style={cardSub}>Decision stability under test pressure</p>

    <div
      style={{
        fontSize: 48,
        fontWeight: 800,
        marginTop: 10,
        marginBottom: 8,
        color:
          confidenceScore >= 75
            ? "#16a34a"
            : confidenceScore >= 55
            ? "#f59e0b"
            : "#dc2626",
      }}
    >
      {confidenceScore}
    </div>

    <div
      style={{
        fontSize: 14,
        color: "#64748b",
        marginBottom: 12,
      }}
    >
      {confidenceLabel}
    </div>

    <div
      style={{
        fontSize: 12,
        color: "#94a3b8",
        lineHeight: 1.5,
      }}
    >
      This score combines:
      <br />
      • Accuracy stability  
      <br />
      • Time consistency  
      <br />
      • Volatility trend
    </div>
  </div>
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
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease"
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
