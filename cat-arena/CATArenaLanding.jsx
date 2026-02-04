"use client";

import { useState } from "react";

/* ===== AVAILABLE RC SECTIONALS ===== */
const RC_SECTIONALS = [
  {
    id: "sectional-01",
    title: "CAT RC Sectional 01",
  },
  {
    id: "sectional-02",
    title: "CAT RC Sectional 02",
  },
];

export default function CATArenaLanding({ onStartRC }) {
  const [mode, setMode] = useState("rc");
  const [loadingId, setLoadingId] = useState(null);

  const COLORS = {
    rc: "#2563eb",
    vocab: "#f97316",
  };

  function handleStart(sectionalId) {
    if (loadingId) return;
    setLoadingId(sectionalId);
    onStartRC(sectionalId);
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
          <h4 style={{ marginBottom: 12 }}>CAT RC Sectionals</h4>

          {RC_SECTIONALS.map(sec => (
            <button
              key={sec.id}
              onClick={() => handleStart(sec.id)}
              disabled={loadingId !== null}
              style={{
                ...primaryButton(COLORS.rc),
                opacity: loadingId ? 0.6 : 1,
              }}
            >
              {loadingId === sec.id
                ? "Loading…"
                : sec.title}
            </button>
          ))}
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
    border: active ? 2px solid ${color} : "1px solid #cbd5f5",
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

const primaryButton = color => ({
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
