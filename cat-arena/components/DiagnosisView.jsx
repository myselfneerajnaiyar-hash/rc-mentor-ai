"use client";

import React from "react";

export default function DiagnosisViewV2({
  passages,
  passageStats,
  byQuestionType,
  answers,
  score,
  attempted,
  unattempted,
  QUESTIONS_PER_PASSAGE,
  onReview,
}) {
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;
  const incorrect = attempted - score;

  /* ================= ATTEMPT QUALITY ================= */
  const smartSkips = unattempted;
  const badAttempts = incorrect;

  /* ================= PRIORITY QUESTION TYPES ================= */
  const sortedQT = Object.entries(byQuestionType).sort(
    (a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)
  );

  const topFix = sortedQT.slice(0, 2);

  return (
    <div style={container}>
      <h1 style={title}>RC Diagnosis Report — Coach View</h1>
      <p style={subtitle}>
        This report analyses *decision quality, thinking errors, and CAT strategy*.
      </p>

      {/* ================= SNAPSHOT ================= */}
      <div style={grid4}>
        <Stat label="Score" value={`${score}/${totalQuestions}`} />
        <Stat label="Incorrect Attempts" value={badAttempts} danger />
        <Stat label="Smart Skips" value={smartSkips} />
        <Stat label="Attempt Quality" value={attempted ? `${Math.round((score / attempted) * 100)}%` : "—"} />
      </div>

      {/* ================= DECISION QUALITY ================= */}
      <Section title="Decision Quality Breakdown">
        <Insight text={`You attempted ${attempted} questions. ${badAttempts} of them resulted in negative outcomes.`} />
        <Insight text={`Your skip strategy is ${smartSkips >= totalQuestions / 3 ? "reasonable" : "risky"} for CAT-level RC.`} />
      </Section>

      {/* ================= PASSAGE STRATEGY ================= */}
      <Section title="CAT Passage Strategy Recommendation">
        {passageStats.map((p, i) => {
          const pct = p.correct / p.total;
          const label =
            pct >= 0.6 ? "Attempt First" : pct >= 0.3 ? "Attempt Selectively" : "Avoid in CAT";
          const color =
            pct >= 0.6 ? "#16a34a" : pct >= 0.3 ? "#f59e0b" : "#dc2626";

          return (
            <Row
              key={i}
              left={p.genre}
              right={label}
              color={color}
              percent={pct * 100}
            />
          );
        })}
      </Section>

      {/* ================= THINKING SKILL PRIORITY ================= */}
      <Section title="Top Thinking Skills to Fix (Next 7 Days)">
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
      <Section title="7-Day RC Action Plan">
        <ul style={list}>
          <li>Attempt only <b>2 passages</b> in sectional RC practice.</li>
          <li>Skip passages with unfamiliar abstract tone.</li>
          <li>Revise explanations for incorrect attempts only.</li>
          <li>Do NOT increase volume until accuracy > 60%.</li>
        </ul>
      </Section>

      <button onClick={onReview} style={primaryBtn}>
        Review Mistakes with Explanations
      </button>
    </div>
  );
}

/* ================= UI BLOCKS ================= */

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

function Insight({ text }) {
  return <p style={{ marginBottom: 8, color: "#374151" }}>{text}</p>;
}

function PriorityCard({ title, stat, advice }) {
  return (
    <div style={priorityCard}>
      <strong>{title}</strong> ({stat})
      <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{advice}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const container = { maxWidth: 1100, margin: "40px auto", padding: "0 16px" };
const title = { fontSize: 28 };
const subtitle = { color: "#475569", marginBottom: 24 };

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const statCard = {
  border: "1px solid",
  borderRadius: 8,
  padding: 16,
  background: "#f8fafc",
};

const statLabel = { fontSize: 13, color: "#64748b" };
const statValue = { fontSize: 22, fontWeight: 600 };

const sectionTitle = { marginBottom: 12 };

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
};

const rowTop = { display: "flex", justifyContent: "space-between" };

const barBg = { height: 6, background: "#e5e7eb", borderRadius: 4 };
const barFill = { height: "100%", borderRadius: 4 };

const priorityCard = {
  padding: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  marginBottom: 10,
};

const list = { paddingLeft: 18, lineHeight: 1.7 };

const primaryBtn = {
  marginTop: 32,
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
