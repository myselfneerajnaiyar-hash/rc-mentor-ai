"use client";

import { useState } from "react";

export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
  onReviewTest,
  hasAttemptedRC,
}) {
  const [mode, setMode] = useState("rc");
  const [loading, setLoading] = useState(false);

  const COLORS = {
    rc: "#2563eb",
    vocab: "#f97316",
  };

  
  function handleStartRC() {
    if (loading) return;
    setLoading(true);
    onStartRC();
  }

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

      {/* ================= RC SECTION ================= */}
      {mode === "rc" && (
        <div style={cardStyle}>
          <h4 style={{ marginBottom: 10 }}>CAT RC Sectional</h4>

          <p style={metaStyle}>⏱ 30 minutes</p>
          <p style={metaStyle}>📊 16 questions</p>
          <p style={metaStyle}>📘 4 passages</p>
          <p style={{ ...metaStyle, marginBottom: 16 }}>
            🎯 CAT Level (Mixed Difficulty)
          </p>

          {/* ACTIONS */}
          <button
            onClick={handleStartRC}
            disabled={loading}
            style={{
              ...primaryButton(COLORS.rc),
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Generating CAT RC..." : "Take RC Sectional Test"}
          </button>

          <button
            onClick={onViewDiagnosis}
            disabled={!hasAttemptedRC}
            style={secondaryButton(hasAttemptedRC)}
          >
            Diagnosis Report
          </button>

          <button
            onClick={onReviewTest}
            disabled={!hasAttemptedRC}
            style={secondaryButton(hasAttemptedRC)}
          >
            Analyse / Review Test
          </button>
        </div>
      )}

      {/* ================= VOCAB PLACEHOLDER ================= */}
      {mode === "vocab" && (
        <div style={cardStyle}>
          <h4>Vocabulary Sectionals</h4>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Coming next.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

function tabStyle(active, color) {
  return {
    padding: "10px 18px",
    borderRadius: 8,
    border: active ? `2px solid ${color}` : "1px solid #cbd5f5",
    background: active ? color : "#f8fafc",
    color: active ? "#fff" : "#1f2937",
    fontWeight: 600,
    cursor: "pointer",
  };
}

const cardStyle = {
  maxWidth: 360,
  background: "#ffffff",
  borderRadius: 12,
  padding: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const primaryButton = (color) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: color,
  color: "#fff",
  fontWeight: 600,
  marginBottom: 10,
  cursor: "pointer",
});

const secondaryButton = (enabled) => ({
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #cbd5f5",
  background: enabled ? "#f8fafc" : "#f1f5f9",
  color: "#1f2937",
  fontWeight: 500,
  marginBottom: 8,
  cursor: enabled ? "pointer" : "not-allowed",
});

const metaStyle = {
  fontSize: 14,
  color: "#475569",
};
