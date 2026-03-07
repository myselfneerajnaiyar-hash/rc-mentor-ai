"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";


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
  color: "#94a3b8",
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
  typeof window !== "undefined" && window.innerWidth < 768
    ? "1fr"
    : "2fr 1fr",
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
<div style={{ width: "100%", height: window.innerWidth < 768 ? 300 : 260 }}>
  {trendData.length === 0 ? (
    <div style={{ color: "#94a3b8" }}>No data yet</div>
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trendData}>
        <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
        <XAxis 
          dataKey="label" 
          stroke="#94a3b8"
        />
        <YAxis 
          domain={[0, 100]} 
          stroke="#94a3b8"
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #1f2937",
            color: "#e5e7eb"
          }}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )}
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

   const chartData = [{ name: "Accuracy", value: accuracy }];

return (
  <ResponsiveContainer width="100%" height={220}>
    <RadialBarChart
      innerRadius="70%"
      outerRadius="100%"
      data={chartData}
      startAngle={90}
      endAngle={-270}
    >
      <PolarAngleAxis
        type="number"
        domain={[0, 100]}
        tick={false}
      />
      <RadialBar
        background
        dataKey="value"
        fill="#3b82f6"
        cornerRadius={10}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#e5e7eb"
        style={{ fontSize: 26, fontWeight: 700 }}
      >
        {accuracy}%
      </text>
    </RadialBarChart>
  </ResponsiveContainer>
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
  typeof window !== "undefined" && window.innerWidth < 768
    ? "1fr"
    : "2fr 1fr",
    gap: 20,
    marginBottom: 28,
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
            color: "#e5e7eb",
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
    height: 180,
    borderRadius: 14,
    background: "#0f172a",
    border: "1px solid #1f2937",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {(() => {
    const avg = getAverageTimePerQuestion(sectionalData);

    if (!avg) {
      return <span style={{ color: "#94a3b8" }}>No data yet</span>;
    }

    const min = Math.floor(avg / 60);
    const sec = avg % 60;

    return (
      <>
        <div style={{ fontSize: 34, fontWeight: 800, color: "#e5e7eb" }}>
          {min}m {sec}s
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
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
      <div style={{ width: "100%", height: window.innerWidth < 768 ? 300 : 260, marginTop: 10 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
      <XAxis dataKey="label" stroke="#94a3b8" />
      <YAxis stroke="#94a3b8" />
      <Tooltip
        contentStyle={{
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          color: "#e5e7eb",
        }}
      />
      <Bar
        dataKey="marks"
        fill="#22c55e"
        radius={[6, 6, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
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
      <div
  style={{
    display: "flex",
    flexDirection:
      typeof window !== "undefined" && window.innerWidth < 768
        ? "column"
        : "row",
    gap: 12,
    marginBottom: 16,
  }}
>
          <select
            value={compareA}
            onChange={e => setCompareA(e.target.value)}
            style={selectStyle}
          >
          <option value="" style={{ fontSize: 13 }}>
  Select Sectional
</option>
            {sectionals.map(s => (
             <option key={s} value={s} style={{ fontSize: 13 }}>
  {s.toUpperCase()}
</option>
            ))}
          </select>

          <select
            value={compareB}
            onChange={e => setCompareB(e.target.value)}
            style={selectStyle}
          >
            <option value="" style={{ fontSize: 13 }}>
  Select Sectional
</option>
            {sectionals.map(s => (
              <option key={s} value={s} style={{ fontSize: 13 }}>
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
  ? "#22c55e"
  : worsened
  ? "#ef4444"
  : "#94a3b8";

        const arrow = improved ? "⬆" : worsened ? "⬇" : "➜";

        return (
          <div
            key={label}
            style={{
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr",
  alignItems: "center",
  padding: "12px 14px",
  borderRadius: 12,
  background: "#0f172a",
  border: "1px solid #1f2937",
  fontSize: 13,
  color: "#e5e7eb",
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
  window.innerWidth < 768 ? "1fr" : "4fr 1.2fr",
    gap: 20,
    marginTop: 20,
  }}
>
  {/* -------- Personalized Plan (65%) -------- */}
  <div style={card}>
    <h2 style={sectionTitle}>🎯 Personalized 10-Day Plan</h2>
   <p
  style={{
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 22,
    lineHeight: 1.6,
  }}
>
  What to focus on before your next CAT RC sectional
</p>

    {(() => {
      const plan = getPersonalizedPlan(metrics, sectionalData);

      if (!plan) {
        return <div style={{ color: "#64748b" }}>No data yet</div>;
      }

      return (
        <>
        <h4
  style={{
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 14,
  }}
>
  Focus Skills
</h4>
         <ul
  style={{
    marginBottom: 24,
    lineHeight: 1.9,
    paddingLeft: 18,
  }}
>
  {plan.focus.map(f => (
    <li
      key={f}
      style={{
        marginBottom: 8,
        color: "#cbd5e1",
        fontSize: 15,
      }}
    >
      {f}
    </li>
  ))}
</ul>

          <h3
  style={{
    fontSize: 24,
    fontWeight: 900,
    marginTop: 18,
    marginBottom: 20,
    color: "#f1f5f9",
    letterSpacing: "-0.3px",
  }}
>
  📅 {plan.title}
</h3>
        <div style={{ marginTop: 10 }}>
  {plan.plan.map((step, i) => {
    const parts = step.split(":");

  
    return (
      <div
        key={i}
        style={{
          marginBottom: 18,
          padding: "14px 16px",
          borderRadius: 12,
          background: "#0f172a",
          border: "1px solid #1f2937",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 6,
            color: "#22c55e",
fontSize: 13,
letterSpacing: "0.8px",
textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          {parts[0]}
        </div>

        <div
          style={{
            color: "#cbd5e1",
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.7,
          }}
        >
          {parts[1]}
        </div>
      </div>
    );
  })}
</div>
        </>
      );
    })()}
  </div>

  {/* -------- Confidence Index (35%) -------- */}
  <div style={card}>
   <h3
  style={{
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
    color: "#f8fafc",
    letterSpacing: "-0.3px",
  }}
>
  Confidence Index
</h3>
    <p
  style={{
    fontSize: 15,
    color: "#94a3b8",
    marginBottom: 28,
    lineHeight: 1.5,
  }}
>
  Decision stability under test pressure
</p>

   <div
  style={{
    fontSize: 64,
    fontWeight: 900,
    marginTop: 16,
    marginBottom: 10,
    background:
      confidenceScore >= 75
        ? "linear-gradient(90deg,#22c55e,#16a34a)"
        : confidenceScore >= 55
        ? "linear-gradient(90deg,#f59e0b,#d97706)"
        : "linear-gradient(90deg,#ef4444,#dc2626)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  {confidenceScore}
</div>

    <div
      style={{
        fontSize: 14,
        color: "#94a3b8",
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
    background: "#111827",
border: "1px solid #1f2937",
color: "#e5e7eb",
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
  background: "#111827",
  borderRadius: 16,
   padding: window.innerWidth < 768 ? 18 : 28,
  border: "1px solid #1f2937",
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 6,
  color: "#e5e7eb",
};

const cardSub = {
  fontSize: 13,
  color: "#94a3b8",
  marginBottom: 18,
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
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #1f2937",
  background: "#0f172a",
  color: "#e5e7eb",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "0.2px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const insightBox = {
  marginTop: 16,
  padding: 16,
  borderRadius: 14,
  background: "#111827",
  border: "1px solid #1f2937",
  fontSize: 13,
  color: "#e5e7eb",
};
const sectionTitle = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 6,
  color: "#e5e7eb",
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
  background: "#0f172a",
};

const pageInner = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "30px 18px",
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
};