"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "catRCResults";

/* ---------- LOAD ALL ATTEMPTS ---------- */
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
  onReviewTest,
}) {
  const [loadingId, setLoadingId] = useState(null);
  const [allAttempts, setAllAttempts] = useState({});

  useEffect(() => {
    setAllAttempts(loadAll());
  }, []);

  const sectionals = [
    { id: "sectional-01", title: "CAT RC Sectional 01" },
    { id: "sectional-02", title: "CAT RC Sectional 02" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>🔥 CAT Arena</h1>

      {sectionals.map(s => {
        const attempts = allAttempts[s.id] || [];
        const attempted = attempts.length > 0;

        return (
         <div key={s.id} style={card(attempted)}>
            <h3 style={{ marginBottom: 6 }}>{s.title}</h3>

            <p style={{ fontSize: 14, color: "#64748b" }}>
              ⏱ 30 min · 📊 16 Q · 📘 4 passages
            </p>

            {/* ---------- TAKE TEST / ATTEMPTED ---------- */}
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
              }}
            >
              {attempted ? "Attempted" : "Take Test"}
            </button>

            {/* ---------- DIAGNOSIS DROPDOWN ---------- */}
            {attempted && (
              <details style={{ marginBottom: 6 }}>
                <summary style={summaryBtn}>
                  Diagnosis Report ({attempts.length})
                </summary>

                <div style={{ marginTop: 6 }}>
                  {attempts.map((a, i) => (
                    <button
                      key={a.attemptId}
                      style={attemptBtn}
                      onClick={() =>
                        onViewDiagnosis(s.id, a.attemptId)
                      }
                    >
                      Attempt {i + 1} ·{" "}
                      {new Date(a.timestamp).toLocaleString()}
                    </button>
                  ))}
                </div>
              </details>
            )}

            {/* ---------- REVIEW LATEST ATTEMPT ---------- */}
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

const card = attempted => ({
  borderRadius: 14,
  padding: 18,
  marginBottom: 20,
  maxWidth: 460,
  background: attempted
    ? "linear-gradient(135deg, #e0f2fe, #f0f9ff)" // light blue
    : "linear-gradient(135deg, #f8fafc, #ffffff)",
  border: attempted
    ? "1px solid #93c5fd"
    : "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  transition: "all 0.2s ease",
});

const primaryBtn = {
  width: "100%",
  padding: 10,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  marginBottom: 8,
  fontWeight: 600,
};

const summaryBtn = {
  width: "100%",
  padding: 8,
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
};

const attemptBtn = {
  width: "100%",
  padding: 7,
  marginBottom: 4,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  textAlign: "left",
};

const secondaryBtn = enabled => ({
  width: "100%",
  padding: 8,
  background: enabled ? "#f8fafc" : "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: enabled ? "pointer" : "not-allowed",
});
