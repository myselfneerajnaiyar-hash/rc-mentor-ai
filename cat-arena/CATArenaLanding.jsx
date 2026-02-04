"use client";
import { useState } from "react";

export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
  onReviewTest,
  lastAttemptedSectional,
}) {
  const [loadingId, setLoadingId] = useState(null);

  const sectionals = [
    { id: "sectional-01", title: "CAT RC Sectional 01" },
    { id: "sectional-02", title: "CAT RC Sectional 02" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>🔥 CAT Arena</h1>
      <p style={{ color: "#475569", marginBottom: 24 }}>
        This is your battleground. Learning here shapes exam performance.
      </p>

      {sectionals.map((s) => {
        const attempted = lastAttemptedSectional === s.id;

        return (
          <div
            key={s.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              background: "#fff",
              maxWidth: 420,
              opacity: attempted ? 0.95 : 1,
            }}
          >
            <h4>{s.title}</h4>

            <p style={{ fontSize: 14, color: "#64748b" }}>
              ⏱ 30 min · 📊 16 Q · 📘 4 passages
            </p>

            {/* ================= TAKE TEST (LOCKED) ================= */}
            <button
              onClick={() => {
                if (attempted) return;
                setLoadingId(s.id);
                onStartRC(s.id);
              }}
              disabled={attempted || loadingId === s.id}
              style={{
                ...primaryBtn,
                background: attempted ? "#94a3b8" : "#2563eb",
                cursor: attempted ? "not-allowed" : "pointer",
              }}
            >
              {attempted
                ? "Attempted"
                : loadingId === s.id
                ? "Loading…"
                : "Take Test"}
            </button>

            {/* ================= DIAGNOSIS ================= */}
            <button
              onClick={() => onViewDiagnosis(s.id)}
              disabled={!attempted}
              style={secondaryBtn(attempted)}
            >
              Diagnosis Report
            </button>

            {/* ================= REVIEW ================= */}
            <button
              onClick={() => onReviewTest(s.id)}
              disabled={!attempted}
              style={secondaryBtn(attempted)}
            >
              Analyse / Review Test
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ================= STYLES ================= */

const primaryBtn = {
  width: "100%",
  padding: "10px",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  marginBottom: 8,
  fontWeight: 600,
};

const secondaryBtn = (enabled) => ({
  width: "100%",
  padding: "8px",
  background: enabled ? "#f8fafc" : "#f1f5f9",
  border: "1px solid #cbd5f5",
  borderRadius: 8,
  marginBottom: 6,
  cursor: enabled ? "pointer" : "not-allowed",
});
