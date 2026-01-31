"use client";

import { useState } from "react";

export default function CATArenaLanding({ onStartRC, onStartVocab }) {
  // rc | vocab
  const [mode, setMode] = useState("rc");

  // TEMP: static test list (will be replaced by DB / JSON later)
  const rcTests = Array.from({ length: 20 }).map((_, i) => ({
    id: `RC-${i + 1}`,
    title: `CAT RC Sectional ${i + 1}`,
    passages: 4,
    questions: 16,
    time: "30 min",
    difficulty: "CAT Level",
  }));

  const vocabTests = Array.from({ length: 30 }).map((_, i) => ({
    id: `VOCAB-${i + 1}`,
    title: `Vocabulary Test ${i + 1}`,
    questions: 30,
    time: "15 min",
    difficulty: "Exam Focused",
  }));

  const COLORS = {
    rc: "#2563eb",      // Blue
    vocab: "#f97316",   // Orange
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 6 }}>🔥 CAT Arena</h1>
        <p style={{ color: "#475569" }}>
          This is your battleground. Learning here shapes exam performance.
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setMode("rc")}
          style={tabStyle(mode === "rc", COLORS.rc)}
        >
          CAT RC Sectionals
        </button>
        <button
          onClick={() => setMode("vocab")}
          style={tabStyle(mode === "vocab", COLORS.vocab)}
        >
          Vocabulary Sectionals
        </button>
      </div>

      {/* Test Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {(mode === "rc" ? rcTests : vocabTests).map(test => (
          <div
            key={test.id}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
            }}
          >
            <h4 style={{ marginBottom: 8 }}>{test.title}</h4>

            <p style={metaStyle}>⏱ {test.time}</p>
            <p style={metaStyle}>📊 {test.questions} questions</p>

            {mode === "rc" && (
              <p style={metaStyle}>📘 {test.passages} passages</p>
            )}

            <p style={{ ...metaStyle, marginBottom: 12 }}>
              🎯 {test.difficulty}
            </p>

            <button
              onClick={() =>
                mode === "rc"
                  ? onStartRC(test.id)
                  : onStartVocab(test.id)
              }
              style={primaryButton(COLORS[mode])}
            >
              Start Test
            </button>
          </div>
        ))}

        {/* Create New Test Card */}
        <div
          style={{
            border: "2px dashed #94a3b8",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          <h4 style={{ marginBottom: 10 }}>➕ Create New Test</h4>
          <button
            style={secondaryButton}
            onClick={() => alert("Test generator will be added later")}
          >
            Generate New
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */

function tabStyle(active, color) {
  return {
    padding: "10px 18px",
    borderRadius: 8,
    border: active ? 2px solid ${color} : "1px solid #cbd5f5",
    background: active ? color : "#f8fafc",
    color: active ? "#fff" : "#1f2937",
    fontWeight: 600,
    cursor: "pointer",
  };
}

const primaryButton = (color) => ({
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: color,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
});

const secondaryButton = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #2563eb",
  background: "#ffffff",
  color: "#2563eb",
  fontWeight: 600,
  cursor: "pointer",
};

const metaStyle = {
  fontSize: 14,
  color: "#475569",
};
