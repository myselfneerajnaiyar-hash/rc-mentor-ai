"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PlanTab from "./PlanTab";
import { AreaChart, Area } from "recharts";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";


export default function RCProfile() {
  const [tests, setTests] = useState([]);
  const [active, setActive] = useState("overview");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("rc_questions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      if (!data) return;

      const bySession = {};

      data.forEach(q => {
        if (!bySession[q.session_id]) {
          bySession[q.session_id] = [];
        }
        bySession[q.session_id].push(q);
      });

      const structured = Object.entries(bySession).map(
        ([sessionId, qs], index) => {
          const total = qs.length;
          const correct = qs.filter(q => q.is_correct).length;

          const avgTime =
            Math.round(
              qs.reduce((a, b) => a + (b.time_taken_sec || 0), 0) / total
            ) || 0;

           

          return {
            id: index + 1,
            sessionId,
            questions: qs,
            total,
            correct,
            avgTime,
            accuracy: Math.round((correct / total) * 100),
          };
        }
      );

      setTests(structured);
    }

    load();
  }, []);

  if (!tests.length) {
    return (
      <div style={{ padding: 40 }}>
        <h2>RC Profile</h2>
        <p>No RC data yet.</p>
      </div>
    );
  }

  const totalQ = tests.reduce((s, t) => s + t.total, 0);
  const totalCorrect = tests.reduce((s, t) => s + t.correct, 0);
  const accuracy = Math.round((totalCorrect / totalQ) * 100);
  const avgTime = Math.round(
    tests.reduce((s, t) => s + t.avgTime * t.total, 0) / totalQ
  );
   // PERFORMANCE SCORE (weighted)
const performanceScore = Math.round(
  accuracy * 0.7 + (avgTime < 30 ? 30 : avgTime < 45 ? 20 : 10)
);

// CONSISTENCY (variance of accuracy)
const accValues = tests.map(t => t.accuracy);
const mean =
  accValues.reduce((a, b) => a + b, 0) / accValues.length;

const variance =
  accValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
  accValues.length;

const consistencyIndex = Math.max(0, 100 - Math.round(variance));

// TREND DIRECTION
const improving =
  accValues.length > 1 &&
  accValues[accValues.length - 1] >
    accValues[0];

  const accuracyTimeline = tests.map(t => ({
    name: "Test " + t.id,
    value: t.accuracy,
  }));

  const timeTimeline = tests.map(t => ({
    name: "Test " + t.id,
    value: t.avgTime,
  }));

  const all = tests.flatMap(t => t.questions);
  const skillMap = {};

all.forEach(q => {
  const type = q.question_type || "Unknown";

  if (!skillMap[type]) {
    skillMap[type] = { total: 0, correct: 0 };
  }

  skillMap[type].total += 1;
  if (q.is_correct) skillMap[type].correct += 1;
});

const skillData = Object.entries(skillMap).map(([type, stats]) => ({
  type,
  accuracy: Math.round((stats.correct / stats.total) * 100),
  total: stats.total
}));

  const rushed = all.filter(q => q.time_taken_sec < 15).length;
  const slow = all.filter(q => q.time_taken_sec > 45).length;
  const wrong = totalQ - totalCorrect;

  const pieData = [
    { name: "Correct", value: totalCorrect },
    { name: "Wrong", value: wrong },
  ];

  return (
   <div
  style={{
    padding: "24px 16px",
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
  }}
>
      <h2 style={{ marginBottom: 20 }}>RC Performance Dashboard</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        {["overview", "skills", "speed", "plan"].map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: active === tab ? "#2563eb" : "#f3f4f6",
              color: active === tab ? "#fff" : "#111827",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

     {active === "overview" && (
  <div style={{ marginTop: 40 }}>

    {/* PERFORMANCE SCORE BLOCK */}
    <div style={{
      padding: 30,
      borderRadius: 24,
      background: "#111827",
      color: "#fff",
      marginBottom: 40
    }}>
      <div style={{ fontSize: 14, opacity: 0.7 }}>
        Overall Performance Score
      </div>

      <div style={{
        fontSize: 64,
        fontWeight: 900,
        marginTop: 10
      }}>
        {performanceScore}
      </div>

     <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 30 }}>

  {/* Circular Consistency Ring */}
  <div style={{ position: "relative", width: 120, height: 120 }}>

    <svg width="120" height="120">
      {/* Background Circle */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#374151"
        strokeWidth="12"
        fill="none"
      />

      {/* Progress Circle */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#22c55e"
        strokeWidth="12"
        fill="none"
        strokeDasharray={314}
        strokeDashoffset={314 - (314 * consistencyIndex) / 100}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
    </svg>

    {/* Center Text */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {consistencyIndex}
    </div>
  </div>

  {/* Interpretation */}
  <div>
    <div style={{ fontSize: 14, opacity: 0.7 }}>
      Consistency Index
    </div>

    <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>
      {consistencyIndex > 80
        ? "Highly Stable Performance"
        : consistencyIndex > 60
        ? "Moderate Stability"
        : "High Volatility Detected"}
    </div>
  </div>

</div>
    </div>

    {/* CHARTS */}
   <div style={{ marginBottom: 40 }}>
  <h3 style={{ marginBottom: 20 }}>Accuracy Trend</h3>

  <div style={{ width: "100%", height: 300 }}>
   <ResponsiveContainer width="100%" height={300}>
  <AreaChart data={accuracyTimeline}>
    <defs>
      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
      </linearGradient>
    </defs>

    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />

    <Area
      type="monotone"
      dataKey="value"
      stroke="#10b981"
      strokeWidth={3}
      fillOpacity={1}
      fill="url(#colorAcc)"
    />
  </AreaChart>
</ResponsiveContainer>
  </div>
</div>

   <div style={{ marginBottom: 40 }}>
  <h3 style={{ marginBottom: 20 }}>Time Trend</h3>

  <div style={{ width: "100%", height: 300 }}>
   <ResponsiveContainer width="100%" height={300}>
  <AreaChart data={timeTimeline}>
    <defs>
      <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
      </linearGradient>
    </defs>

    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />

    <Area
      type="monotone"
      dataKey="value"
      stroke="#3b82f6"
      strokeWidth={3}
      fillOpacity={1}
      fill="url(#colorTime)"
    />
  </AreaChart>
</ResponsiveContainer>
  </div>
</div>

    {/* PERFORMANCE BREAKDOWN */}
    <div style={{
      display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
      gap: 30,
      marginBottom: 40
    }}>
      <div style={{
        padding: 24,
        borderRadius: 18,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0"
      }}>
        <h4>Strength Signal</h4>
        <p>
          {accuracy > 60
            ? "Strong accuracy foundation."
            : "Accuracy requires structured revision."}
        </p>
      </div>

      <div style={{
        padding: 24,
        borderRadius: 18,
        background: improving
          ? "#ecfdf5"
          : "#fef2f2",
        border: improving
          ? "1px solid #86efac"
          : "1px solid #fecaca"
      }}>
        <h4>Trend Alert</h4>
        <p>
          {improving
            ? "Your performance trend is upward."
            : "Performance fluctuation detected. Stabilize practice."}
        </p>
      </div>
    </div>

    {/* ACCURACY PIE */}
    <div style={{ marginBottom: 40 }}>
  <h3 style={{ marginBottom: 20 }}>Accuracy Distribution</h3>

  <div style={{ width: "100%", height: 300 }}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
  data={pieData}
  dataKey="value"
  nameKey="name"
  outerRadius={110}
  label
>
          <Cell fill="#22c55e" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>

    {/* AI MENTOR SUMMARY */}
    <div style={{
      padding: 30,
      borderRadius: 20,
      background: "#f8fafc",
      border: "1px solid #e2e8f0"
    }}>
      <h3 style={{ marginBottom: 14 }}>
        AI Mentor Summary
      </h3>

      <p>
        You have attempted {tests.length} RC sets with an
        overall accuracy of {accuracy}%.
        {improving
          ? " Your trajectory shows improvement."
          : " However, inconsistency remains a concern."}
      </p>

      <p style={{ marginTop: 12 }}>
        Focus on maintaining timing discipline while
        improving question selection quality.
      </p>
    </div>

  </div>
)}
   {active === "skills" && (
  <div style={{ marginTop: 30 }}>

    <h3 style={{ marginBottom: 20 }}>Skill-wise Performance</h3>

    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={skillData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="type" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#7c3aed"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>

    {/* Skill Breakdown Table */}
    <div style={{ marginTop: 40 }}>
      <h4>Detailed Breakdown</h4>

      {skillData.map((s, i) => {
        const wrong = skillMap[s.type].total - skillMap[s.type].correct;

        return (
          <div key={i}
            style={{
              padding: 16,
              marginBottom: 10,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 6px 12px rgba(0,0,0,0.05)"
            }}
          >
            <strong>{s.type.toUpperCase()}</strong><br />
            Total: {skillMap[s.type].total} |
            Correct: {skillMap[s.type].correct} |
            Wrong: {wrong} |
            Accuracy: {s.accuracy}%
          </div>
        );
      })}
    </div>

    {/* Weakest Skill Insight */}
    {skillData.length > 0 && (
      <div style={{
        marginTop: 30,
        padding: 20,
        borderRadius: 16,
        background: "#fef2f2",
        border: "1px solid #fecaca"
      }}>
        <strong>Mentor Insight:</strong><br />
        Your weakest area is{" "}
        {
          skillData.sort((a,b)=>a.accuracy-b.accuracy)[0].type.toUpperCase()
        }.
        Prioritize focused drills here before attempting mixed RCs.
      </div>
    )}

  </div>
)}

     {active === "speed" && (
  <div style={{ marginTop: 40 }}>

    <h3 style={{ marginBottom: 20 }}>Speed Profile</h3>

    {/* SPEED CARDS */}
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 30,
      marginBottom: 40
    }}>

      {/* Rushed Card */}
      <div style={{
        padding: 24,
        borderRadius: 18,
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        boxShadow: "0 8px 18px rgba(0,0,0,0.06)"
      }}>
        <h4>⚡ Rushed (&lt;15s)</h4>
        <div style={{
          fontSize: 40,
          fontWeight: 800,
          color: "#dc2626"
        }}>
          {rushed}
        </div>

        <div style={{
          height: 10,
          background: "#ffe4e6",
          borderRadius: 999,
          marginTop: 12,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${(rushed / (rushed + slow || 1)) * 100}%`,
            height: "100%",
            background: "#ef4444"
          }} />
        </div>
      </div>

      {/* Overthinking Card */}
      <div style={{
        padding: 24,
        borderRadius: 18,
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        boxShadow: "0 8px 18px rgba(0,0,0,0.06)"
      }}>
        <h4>🧠 Overthinking (&gt;45s)</h4>
        <div style={{
          fontSize: 40,
          fontWeight: 800,
          color: "#2563eb"
        }}>
          {slow}
        </div>

        <div style={{
          height: 10,
          background: "#dbeafe",
          borderRadius: 999,
          marginTop: 12,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${(slow / (rushed + slow || 1)) * 100}%`,
            height: "100%",
            background: "#3b82f6"
          }} />
        </div>
      </div>
    </div>

    {/* BEHAVIOR BALANCE METER */}
    <div style={{
      padding: 28,
      borderRadius: 20,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      marginBottom: 40
    }}>
      <h4 style={{ marginBottom: 16 }}>Behavior Balance</h4>

      <div style={{
        height: 16,
        borderRadius: 999,
        background: "#e5e7eb",
        overflow: "hidden",
        display: "flex"
      }}>
        <div style={{
          width: `${(rushed / (rushed + slow || 1)) * 100}%`,
          background: "#ef4444"
        }} />
        <div style={{
          width: `${(slow / (rushed + slow || 1)) * 100}%`,
          background: "#3b82f6"
        }} />
      </div>

      <div style={{
        marginTop: 14,
        fontSize: 14,
        color: "#6b7280"
      }}>
        Red = Rushed | Blue = Overthinking
      </div>
    </div>

    {/* MENTOR INSIGHT */}
    <div style={{
      padding: 28,
      borderRadius: 20,
      background:
        rushed > slow
          ? "#fef2f2"
          : slow > rushed
          ? "#eff6ff"
          : "#ecfdf5",
      border:
        rushed > slow
          ? "1px solid #fecaca"
          : slow > rushed
          ? "1px solid #bfdbfe"
          : "1px solid #bbf7d0",
      boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
    }}>
      <h4 style={{ marginBottom: 12 }}>Mentor Insight</h4>

      {rushed > slow && (
        <p>
          You are rushing significantly more questions than overthinking.
          This usually indicates impulsive answer selection.
          Try pausing 3 seconds before final submission.
        </p>
      )}

      {slow > rushed && (
        <p>
          You are overanalyzing questions.
          This may indicate confidence gaps.
          Practice timed drills to improve decisiveness.
        </p>
      )}

      {rushed === slow && (
        <p>
          Your speed behavior is balanced.
          Focus on improving accuracy while maintaining timing discipline.
        </p>
      )}
    </div>

  </div>
)}

      {active === "plan" && <PlanTab />}
    </div>
  );
}