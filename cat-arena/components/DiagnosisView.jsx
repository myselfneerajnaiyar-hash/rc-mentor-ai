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
  const accuracy = attempted ? Math.round((score / attempted) * 100) : 0;

  function level(correct, total) {
    const pct = total ? correct / total : 0;
    if (pct >= 0.6) return { label: "Strength", color: "#16a34a" };
    if (pct >= 0.3) return { label: "Needs Work", color: "#f59e0b" };
    return { label: "Weak Area", color: "#dc2626" };
  }

  return (
    <div style={container}>
      <h1 style={title}>RC Diagnosis Report</h1>
      <p style={subtitle}>
        This analysis focuses on *decision patterns*, not isolated mistakes.
      </p>

      {/* ================= OVERALL SNAPSHOT ================= */}
      <div style={grid4}>
        <StatCard label="Score" value={`${score} / ${totalQuestions}`} />
        <StatCard label="Accuracy" value={`${accuracy}%`} />
        <StatCard label="Attempted" value={attempted} />
        <StatCard label="Unattempted" value={unattempted} />
      </div>

      {/* ================= PASSAGE PERFORMANCE ================= */}
      <Section title="Passage-wise Performance">
        {passageStats.map((p, i) => {
          const lvl = level(p.correct, p.total);
          return (
            <Row
              key={i}
              left={`${p.genre} (${p.correct}/${p.total})`}
              right={lvl.label}
              color={lvl.color}
              percent={(p.correct / p.total) * 100}
            />
          );
        })}
      </Section>

      {/* ================= QUESTION TYPE SKILL MAP ================= */}
      <Section title="Question-Type Skill Map">
        {Object.entries(byQuestionType).map(([type, v]) => {
          const lvl = level(v.correct, v.total);
          return (
            <Row
              key={type}
              left={`${type} (${v.correct}/${v.total})`}
              right={lvl.label}
              color={lvl.color}
              percent={(v.correct / v.total) * 100}
            />
          );
        })}
      </Section>

      {/* ================= COACHING INSIGHTS ================= */}
      <Section title="Actionable Next Steps">
        <ul style={list}>
          <li>Fix *Weak question types* before increasing RC volume.</li>
          <li>Avoid low-accuracy passages during real CAT attempts.</li>
          <li>Focus on *elimination logic*, not option spotting.</li>
          <li>Re-read explanations to correct thinking patterns.</li>
        </ul>
      </Section>

      <button onClick={onReview} style={primaryBtn}>
        Review Questions
      </button>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value }) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
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

/* ================= STYLES ================= */

const container = {
  maxWidth: 1100,
  margin: "40px auto",
  padding: "0 16px",
  fontFamily: "system-ui, sans-serif",
};

const title = { fontSize: 28, marginBottom: 6 };
const subtitle = { color: "#475569", marginBottom: 24 };

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const statCard = {
  border: "1px solid #e5e7eb",
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
  background: "#fff",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 6,
};

const barBg = {
  height: 6,
  background: "#e5e7eb",
  borderRadius: 4,
};

const barFill = {
  height: "100%",
  borderRadius: 4,
};

const list = {
  paddingLeft: 18,
  lineHeight: 1.7,
};

const primaryBtn = {
  marginTop: 32,
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
