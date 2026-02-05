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
      <h1 style={{ marginBottom: 24 }}>🔥 CAT Arena</h1>

      {sectionals.map(s => {
        const attempts = allAttempts[s.id] || [];
        const attempted = attempts.length > 0;

        return (
          <div key={s.id} style={card(attempted)}>
            <h3 style={{ marginBottom: 6 }}>{s.title}</h3>

            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
              ⏱ 30 min · 📊 16 Q · 📘 4 passages
            </p>

            {/* ---------- STATUS / TAKE TEST ---------- */}
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
                opacity: attempted ? 0.9 : 1,
              }}
            >
              {attempted ? "✓ Completed" : "Take Test"}
            </button>

            {/* ---------- DIAGNOSIS DROPDOWN ---------- */}
            {attempted && (
              <details style={{ marginBottom: 10 }}>
                <summary style={summaryBtn}>
                  📊 Diagnosis Report ({attempts.length})
                </summary>

                <div style={{ marginTop: 8 }}>
                  {attempts.map((a, i) => (
                    <button
                      key={a.attemptId}
                      style={attemptBtn}
                      onClick={() =>
                        onViewDiagnosis(s.id, a.attemptId)
                      }
                    >
                      {s.title} ·{" "}
                     a.timestamp
  ? new Date(a.timestamp).toLocaleString()
  : "—"
                    </button>
                  ))}
                </div>
              </details>
            )}

            {/* ---------- REVIEW ---------- */}
            <div style={{ marginTop: 6 }}>
              <button
                onClick={() => onReviewTest(s.id)}
                disabled={!attempted}
                style={secondaryBtn(attempted)}
              >
                Analyse / Review Test
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================= STYLES ================= */

const card = attempted => ({
  borderRadius: 16,
  padding: 20,
  marginBottom: 22,
  maxWidth: 480,
  background: attempted
    ? "linear-gradient(135deg, #e0f2fe, #f0f9ff)"
    : "linear-gradient(135deg, #f8fafc, #ffffff)",
  border: attempted ? "1px solid #93c5fd" : "1px solid #e5e7eb",
  borderLeft: attempted
    ? "6px solid #3b82f6"
    : "6px solid #cbd5e1",
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  transition: "all 0.2s ease",
});

const primaryBtn = {
  width: "100%",
  padding: 10,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  marginBottom: 10,
  fontWeight: 700,
  fontSize: 15,
};

const summaryBtn = {
  width: "100%",
  padding: 9,
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
};

const attemptBtn = {
  width: "100%",
  padding: "8px 10px",
  marginBottom: 6,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  textAlign: "left",
};

const secondaryBtn = enabled => ({
  width: "100%",
  padding: 9,
  background: enabled ? "#ffffff" : "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  cursor: enabled ? "pointer" : "not-allowed",
  fontWeight: 600,
});
