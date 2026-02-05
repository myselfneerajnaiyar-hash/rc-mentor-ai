"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "catRCResults";

function loadCounts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const counts = {};
    Object.keys(data).forEach(k => {
      counts[k] = Array.isArray(data[k]) ? data[k].length : 0;
    });
    return counts;
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
  const [counts, setCounts] = useState({});

  useEffect(() => {
    setCounts(loadCounts());
  }, []);

  const sectionals = [
    { id: "sectional-01", title: "CAT RC Sectional 01" },
    { id: "sectional-02", title: "CAT RC Sectional 02" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>🔥 CAT Arena</h1>

      {sectionals.map(s => {
        const attempts = counts[s.id] || 0;
        const attempted = attempts > 0;

        return (
          <div key={s.id} style={card}>
            <h4>{s.title}</h4>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              ⏱ 30 min · 📊 16 Q · 📘 4 passages
            </p>

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

            <button
              onClick={() => onViewDiagnosis(s.id)}
              disabled={!attempted}
              style={secondaryBtn(attempted)}
            >
              Diagnosis Report ({attempts})
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

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#fff",
  maxWidth: 420,
};

const primaryBtn = {
  width: "100%",
  padding: 10,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  marginBottom: 8,
  fontWeight: 600,
};

const secondaryBtn = enabled => ({
  width: "100%",
  padding: 8,
  background: enabled ? "#f8fafc" : "#f1f5f9",
  border: "1px solid #cbd5f5",
  borderRadius: 8,
  marginBottom: 6,
  cursor: enabled ? "pointer" : "not-allowed",
});
