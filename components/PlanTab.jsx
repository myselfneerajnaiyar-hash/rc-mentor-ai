"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PlanTab() {
  const [plan, setPlan] = useState(null);
  const [stats, setStats] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  async function init() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const weekStart = getWeekRange();

    const { data: sessions } = await supabase
      .from("rc_sessions")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    let avgAccuracy = 0;
    let avgTimePerQ = 0;

    if (sessions && sessions.length > 0) {
      avgAccuracy =
        sessions.reduce(
          (sum, d) =>
            sum + (d.correct_answers / d.total_questions) * 100,
          0
        ) / sessions.length;

      avgTimePerQ =
        sessions.reduce(
          (sum, d) => sum + d.time_taken_sec / d.total_questions,
          0
        ) / sessions.length;
    }

    setStats({
      accuracy: Math.round(avgAccuracy),
      time: Math.round(avgTimePerQ),
      sessions: sessions?.length || 0,
    });

    // WEEKLY COMPLETION
    const { data: weekSessions } = await supabase
      .from("rc_sessions")
      .select("created_at")
      .eq("user_id", authData.user.id)
      .gte("created_at", weekStart.toISOString());

    const dayCounts = {};
    weekSessions?.forEach((s) => {
      const d = new Date(s.created_at).toISOString().slice(0, 10);
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });

    const completedDays = Object.values(dayCounts).filter(
      (count) => count >= 3
    ).length;

    setWeeklyProgress(completedDays);

    setPlan(generatePlan(avgAccuracy));
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
  if (!plan) return null;

  const progressPercent = Math.min(100, (weeklyProgress / 6) * 100);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      {/* PHASE HERO */}
      <div
        style={{
          padding: 28,
          borderRadius: 20,
          background: plan.gradient,
          color: "#fff",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Weekly Training Phase
        </div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{plan.zone}</div>
        <div style={{ marginTop: 8 }}>{plan.objective}</div>
      </div>

      {/* PERFORMANCE SNAPSHOT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Metric label="Accuracy" value={stats.accuracy + "%"} />
        <Metric label="Avg Time/Q" value={stats.time + "s"} />
        <Metric label="Sessions" value={stats.sessions} />
      </div>

      {/* WEEKLY PROGRESS */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          Weekly Completion: {weeklyProgress} / 6 Days
        </div>

        <div
          style={{
            height: 14,
            background: "#e5e7eb",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: progressPercent + "%",
              height: "100%",
              background: plan.primary,
            }}
          />
        </div>
      </div>

      {/* DAILY PLAN */}
      {plan.days.map((day, i) => (
        <div
          key={i}
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: 20,
            marginBottom: 18,
            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            borderLeft: `5px solid ${plan.primary}`,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12 }}>
            Day {i + 1}
          </div>

          {day.type === "practice" &&
            day.passages.map((p, idx) => (
              <div key={idx} style={{ fontSize: 14, marginBottom: 6 }}>
                • {p.genre} – {p.difficulty} – {p.words}
              </div>
            ))}

          {day.type === "practice" && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              🎯 Focus: {day.focus}
            </div>
          )}

          {day.type === "simulation" && (
            <div>🔥 Full Sectional Simulation</div>
          )}

          {day.type === "review" && (
            <div>📊 Review mistakes & update error log</div>
          )}
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "#fff",
        textAlign: "center",
        boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
    </div>
  );
}

function generatePlan(avgAccuracy) {
  let zone, difficulty, words, primary, gradient, objective;

  if (avgAccuracy < 60) {
    zone = "Structural Phase";
    difficulty = "Moderate";
    words = "400–500";
    primary = "#dc2626";
    gradient = "linear-gradient(135deg,#dc2626,#7f1d1d)";
    objective = "Rebuild core comprehension accuracy.";
  } else if (avgAccuracy < 75) {
    zone = "Precision Phase";
    difficulty = "Advanced";
    words = "400–500";
    primary = "#f59e0b";
    gradient = "linear-gradient(135deg,#f59e0b,#b45309)";
    objective = "Stabilise inference & tone control.";
  } else if (avgAccuracy < 85) {
    zone = "Control Phase";
    difficulty = "Advanced";
    words = "500–600";
    primary = "#2563eb";
    gradient = "linear-gradient(135deg,#2563eb,#1e3a8a)";
    objective = "Strengthen logical reasoning.";
  } else {
    zone = "Simulation Phase";
    difficulty = "Pro";
    words = "600–700";
    primary = "#16a34a";
    gradient = "linear-gradient(135deg,#16a34a,#14532d)";
    objective = "Elite CAT simulation readiness.";
  }

  const genres = [
  "Philosophy",
  "Psychology",
  "Economics",
  "Sociology",
  "History",
  "Political Theory",
  "Environmental Studies",
  "Technology & Society",
  "Ethics",
  "Literary Criticism",
  "Education",
  "Anthropology",
  "Behavioral Science",
  "Neuroscience",
  "Public Policy",
  "Culture Studies",
  "Media Studies",
  "Gender Studies",
  "Urban Studies",
  "Globalization",
  "Mixed (CAT-style)"
];
  const practiceDays = Array.from({ length: 5 }).map((_, i) => ({
    type: "practice",
    focus:
      zone === "Structural Phase"
        ? "Main Idea + Paragraph Function"
        : zone === "Precision Phase"
        ? "Inference + Tone"
        : zone === "Control Phase"
        ? "Assumption + Strengthen/Weaken"
        : "Mixed CAT-style Control",
    passages: [
      { genre: genres[i], difficulty, words },
      { genre: genres[(i + 1) % genres.length], difficulty, words },
      { genre: genres[(i + 2) % genres.length], difficulty, words },
    ],
  }));

  return {
    zone,
    difficulty,
    words,
    primary,
    gradient,
    objective,
    days: [
      ...practiceDays,
      { type: "simulation" },
      { type: "review" },
    ],
  };
}