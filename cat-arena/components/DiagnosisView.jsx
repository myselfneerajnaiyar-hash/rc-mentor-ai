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
  previousSnapshot, // OPTIONAL
  onReview,
}) {
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;
  const incorrect = attempted - score;
  const accuracy = attempted ? Math.round((score / attempted) * 100) : 0;

  const sortedQT = Object.entries(byQuestionType || {}).sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  return (
    <div style={page}>
      <h1 style={title}>RC Diagnosis Report</h1>
      <p style={subtitle}>
        Focuses on <b>decision patterns</b>, not isolated mistakes.
      </p>

      {/* ================= SNAPSHOT ================= */}
      <div style={grid4}>
        <Stat label="Score" value={`${score} / ${totalQuestions}`} />
        <Stat label="Incorrect Attempts" value={incorrect} tone="danger" />
        <Stat label="Smart Skips" value={unattempted} tone="neutral" />
        <Stat label="Accuracy" value={`${accuracy}%`} tone="info" />
      </div>

      {/* ================= COMPARISON ================= */}
      {previousSnapshot && (
        <Section title="Progress vs Last RC Sectional">
          <Compare
            label="Score"
            current={score}
            previous={previousSnapshot.score}
          />
          <Compare
            label="Accuracy"
            current={accuracy}
            previous={previousSnapshot.accuracy}
            suffix="%"
          />
          <Compare
            label="Attempts"
            current={attempted}
            previous={previousSnapshot.attempted}
          />
        </Section>
      )}

      {/* ================= PASSAGE STRATEGY ================= */}
      <Section title="Passage-wise CAT Strategy">
        {passageStats.map((p, i) => {
          const pct = p.correct / p.total;
          const tone =
            pct >= 0.6 ? "good" : pct >= 0.3 ? "warn" : "bad";
          const label =
            pct >= 0.6
              ? "Attempt Confidently"
              : pct >= 0.3
              ? "Selective Attempt"
              : "Avoid in CAT";

          return (
            <BarRow
              key={i}
              left={`${p.genre} (${p.correct}/${p.total})`}
              right={label}
              percent={pct * 100}
              tone={tone}
            />
          );
        })}
      </Section>

      {/* ================= QUESTION TYPE MAP ================= */}
      <Section title="Question-Type Skill Map">
        {sortedQT.map(([type, v]) => {
          const pct = v.correct / v.total;
          const tone =
            pct >= 0.6 ? "good" : pct >= 0.3 ? "warn" : "bad";
          const label =
            pct >= 0.6 ? "Strength" : pct >= 0.3 ? "Needs Work" : "Weak Area";

          return (
            <BarRow
              key={type}
              left={`${type} (${v.correct}/${v.total})`}
              right={label}
              percent={pct * 100}
              tone={tone}
            />
          );
        })}
      </Section>

      {/* ================= ACTION PLAN ================= */}
      <Section title="Actionable Next Steps">
        <ul style={list}>
          <li>Attempt only <b>2 passages</b> per RC sectional.</li>
          <li>Skip abstract / unfamiliar tone passages.</li>
          <li>Analyse only incorrect attempts.</li>
          <li>Increase volume only after accuracy ≥ 60%.</li>
        </ul>
      </Section>

      <button onClick={onReview} style={cta}>
        Review Questions
      </button>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Stat({ label, value, tone }) {
  return (
    <div style={{ ...stat, borderLeft: `4px solid ${toneColor(tone)}` }}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function Compare({ label, current, previous, suffix = "" }) {
  const diff = current - previous;
  const up = diff > 0;

  return (
    <div style={compareRow}>
      <span>{label}</span>
      <span style={{ color: up ? "#16a34a" : "#dc2626" }}>
        {current}{suffix} {diff !== 0 && `( ${up ? "▲" : "▼"} ${Math.abs(diff)} )`}
      </span>
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

function BarRow({ left, right, percent, tone }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={rowTop}>
        <span>{left}</span>
        <span style={{ fontWeight: 600, color: toneColor(tone) }}>
          {right}
        </span>
      </div>
      <div style={barBg}>
        <div
          style={{
            ...barFill,
            width: `${percent}%`,
            background: toneColor(tone),
          }}
        />
      </div>
    </div>
  );
}

/* ================= THEME ================= */

const page = {
  background: "#f1f5f9",
  minHeight: "100vh",
  padding: "40px 16px",
};

const title = { fontSize: 28, marginBottom: 4 };
const subtitle = { color: "#475569" };

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
  gap: 16,
  marginTop: 24,
};

const stat = {
  background: "#ffffff",
  padding: 16,
  borderRadius: 10,
};

const statLabel = { fontSize: 13, color: "#64748b" };
const statValue = { fontSize: 22, fontWeight: 600 };

const sectionTitle = { marginBottom: 12 };

const card = {
  background: "#ffffff",
  padding: 16,
  borderRadius: 10,
};

const rowTop = { display: "flex", justifyContent: "space-between" };

const barBg = {
  height: 6,
  background: "#e5e7eb",
  borderRadius: 4,
};

const barFill = { height: "100%", borderRadius: 4 };

const compareRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8,
};

const list = { paddingLeft: 18, lineHeight: 1.8 };

const cta = {
  marginTop: 32,
  padding: "12px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

function toneColor(tone) {
  if (tone === "good") return "#16a34a";
  if (tone === "warn") return "#f59e0b";
  if (tone === "danger" || tone === "bad") return "#dc2626";
  if (tone === "info") return "#2563eb";
  return "#64748b";
}
