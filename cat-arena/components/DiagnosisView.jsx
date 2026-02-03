"use client";

import React from "react";

export default function DiagnosisView({
  passages,
  passageStats,
  byQuestionType,
  score,
  attempted,
  unattempted,
  QUESTIONS_PER_PASSAGE,
  onReview,
}) {
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;
  const incorrect = attempted - score;

  const sortedQT = Object.entries(byQuestionType || {}).sort(
    (a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)
  );

  const topFix = sortedQT.slice(0, 3);

  return (
    <div style={container}>
      <h1 style={title}>RC Diagnosis Report</h1>
      <p style={subtitle}>
        This analysis focuses on <b>decision quality</b>, not isolated mistakes.
      </p>

      {/* ================= SNAPSHOT ================= */}
      <div style={grid4}>
        <Stat label="Score" value={`${score} / ${totalQuestions}`} />
        <Stat label="Incorrect Attempts" value={incorrect} danger />
        <Stat label="Smart Skips" value={unattempted} />
        <Stat
          label="Attempt Accuracy"
          value={attempted ? `${Math.round((score / attempted) * 100)}%` : "—"}
        />
      </div>

      {/* ================= PASSAGE STRATEGY ================= */}
      <Section title="Passage-wise CAT Strategy">
        {passageStats.map((p, i) => {
          const pct = p.correct / p.total;
          const label =
            pct >= 0.6
              ? "Strength — Attempt First"
              : pct >= 0.3
              ? "Needs Work — Attempt Selectively"
              : "Weak Area — Avoid in CAT";
          const color =
            pct >= 0.6 ? "#16a34a" : pct >= 0.3 ? "#f59e0b" : "#dc2626";

          return (
            <Row
              key={i}
              left={`${p.genre} (${p.correct}/${p.total})`}
              right={label}
              color={color}
              percent={pct * 100}
            />
          );
        })}
      </Section>

      {/* ================= QUESTION TYPE SKILL MAP ================= */}
      <Section title="Question-Type Skill Map">
        {sortedQT.map(([type, v]) => {
          const pct = v.correct / v.total;
          const label =
            pct >= 0.6 ? "Strength" : pct >= 0.3 ? "Needs Work" : "Weak Area";
          const color =
            pct >= 0.6 ? "#16a34a" : pct >= 0.3 ? "#f59e0b" : "#dc2626";

          return (
            <Row
              key={type}
              left={`${type} (${v.correct}/${v.total})`}
              right={label}
              color={color}
              percent={pct * 100}
            />
          );
        })}
      </Section>

      {/* ================= PRIORITY FIX ================= */}
      <Section title="Top Priority Fixes (Next 7 Days)">
        {topFix.map(([type, v]) => (
          <PriorityCard
            key={type}
            title={type}
            stat={`${v.correct}/${v.total}`}
            advice={`Revise logic + explanation patterns for ${type}`}
          />
        ))}
      </Section>

      {/* ================= ACTION PLAN ================= */}
      <Section title="Actionable Next Steps">
        <ul style={list}>
          <li>Attempt only <b>2 passages</b> per RC sectional practice.</li>
          <li>Skip passages with unfamiliar abstract tone.</li>
          <li>Review explanations for incorrect attempts only.</li>
          <li>Do NOT increase volume until accuracy ≥ 60%.</li>
        </ul>
      </Section>

      <button onClick={onReview} style={primaryBtn}>
        Review Questions
      </button>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Stat({ label, value, danger }) {
  return (
    <div style={{ ...statCard, borderColor: danger ? "#dc2626" : "#e5e7eb" }}>
      <div style={statLabel}>{label}</div>
      <div style={{ ...statValue, color: danger ? "#dc2626" : "#111" }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 36 }}>
      <h3 style={sectionTitle}>{title}</h3>
      <div style={card}>{children}</div>
    </div>
  );
}

function Row({ left, right, color, percent }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={rowTop}>
        <span>{left}</span>
        <span style={{ color, fontWeight: 600 }}>{right}</span>
      </div>
      <div style={barBg}>
        <div style={{ ...barFill, width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function PriorityCard({ title, stat, advice }) {
  return (
    <div style={priorityCard}>
      <strong>{title}</strong> ({stat})
      <div style={priorityText}>{advice}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const container = { maxWidth: 1100, margin: "40px auto", padding: "0 16px" };
const title = { fontSize: 28, marginBottom: 6 };
const subtitle = { color: "#475569", marginBottom: 24 };

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
};

const statCard = {
  border: "1px solid",
  borderRadius: 10,
  padding: 16,
  background: "#f8fafc",
};

const statLabel = { fontSize: 13, color: "#64748b" };
const statValue = { fontSize: 22, fontWeight: 600 };

const sectionTitle = { marginBottom: 12 };

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  background: "#ffffff",
};

const rowTop = { display: "flex", justifyContent: "space-between" };

const barBg = { height: 6, background: "#e5e7eb", borderRadius: 4 };
const barFill = { height: "100%", borderRadius: 4 };

const priorityCard = {
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  marginBottom: 12,
  background: "#f9fafb",
};

const priorityText = {
  fontSize: 13,
  color: "#475569",
  marginTop: 4,
};

const list = { paddingLeft: 18, lineHeight: 1.8 };

const primaryBtn = {
  marginTop: 32,
  padding: "12px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
