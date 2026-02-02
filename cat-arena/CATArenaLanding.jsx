"use client";

import { useState } from "react";

export default function CATArenaLanding({ onStartRC, onStartVocab }) {
  const [mode, setMode] = useState("rc");
  const [loading, setLoading] = useState(false);

  const COLORS = {
    rc: "#2563eb",    // Blue
    vocab: "#f97316", // Orange
  };

  function handleStart() {
    if (loading) return;
    setLoading(true);
    onStartRC(); // 🔥 NO IDs, NO FAKE TESTS
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

      {/* RC CARD */}
      {mode === "rc" && (
        <div
          style={{
            maxWidth: 360,
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e5e7eb",
            boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ marginBottom: 10 }}>CAT RC Sectional</h4>

          <p style={metaStyle}>⏱ 30 minutes</p>
          <p style={metaStyle}>📊 16 questions</p>
          <p style={metaStyle}>📘 4 passages</p>
          <p style={{ ...metaStyle, marginBottom: 16 }}>
            🎯 CAT Level (Mixed Difficulty)
          </p>

          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              ...primaryButton(COLORS.rc),
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating CAT RC..." : "Start Test"}
          </button>
        </div>
      )}

      {/* VOCAB PLACEHOLDER */}
      {mode === "vocab" && (
        <div
          style={{
            maxWidth: 360,
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e5e7eb",
          }}
        >
          <h4>Vocabulary Sectionals</h4>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Coming next.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- styles ---------- */

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

const primaryButton = (color) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: color,
  color: "#fff",
  fontWeight: 600,
});

const metaStyle = {
  fontSize: 14,
  color: "#475569",
};
