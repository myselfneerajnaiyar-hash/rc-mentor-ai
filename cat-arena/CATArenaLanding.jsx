"use client";
import { useEffect, useState } from "react";

const MASTER_KEY = "catRCResults";

export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
  onReviewTest,
}) {
  const [loadingId, setLoadingId] = useState(null);
  const [attemptedMap, setAttemptedMap] = useState({});

  const sectionals = [
    { id: "sectional-01", title: "CAT RC Sectional 01" },
    { id: "sectional-02", title: "CAT RC Sectional 02" },
  ];

  // ✅ READ FROM LOCAL STORAGE (SOURCE OF TRUTH)
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(MASTER_KEY) || "{}");
    setAttemptedMap(stored);
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>🔥 CAT Arena</h1>
      <p style={{ color: "#475569", marginBottom: 24 }}>
        This is your battleground. Learning here shapes exam performance.
      </p>

      {sectionals.map((s) => {
        const attempted = Boolean(attemptedMap[s.id]);

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
            }}
          >
            <h4>{s.title}</h4>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              ⏱ 30 min · 📊 16 Q · 📘 4 passages
            </p>

            <button
              onClick={() => {
                setLoadingId(s.id);
                onStartRC(s.id);
              }}
              disabled={loadingId === s.id}
              style={primaryBtn}
            >
              {loadingId === s.id ? "Loading…" : "Take Test"}
            </button>

            <button
              onClick={() => onViewDiagnosis(s.id)}
              disabled={!attempted}
              style={secondaryBtn(attempted)}
            >
              Diagnosis Report
            </button>

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

const primaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  marginBottom: 8,
  cursor: "pointer",
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
