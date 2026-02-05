"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "catRCResults";

function hasAttempt(id) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return (all[id] || []).length > 0;
  } catch {
    return false;
  }
}

export default function CATArenaLanding({
  onStartRC,
  onViewDiagnosis,
  onReviewTest,
}) {
  const [loadingId, setLoadingId] = useState(null);
  const [attempted, setAttempted] = useState({});

  const sectionals = [
    { id: "sectional-01", title: "CAT RC Sectional 01" },
    { id: "sectional-02", title: "CAT RC Sectional 02" },
  ];

  useEffect(() => {
    const map = {};
    sectionals.forEach(s => {
      map[s.id] = hasAttempt(s.id);
    });
    setAttempted(map);
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>🔥 CAT Arena</h1>

      {sectionals.map(s => (
        <div key={s.id} style={card}>
          <h4>{s.title}</h4>

          <button
            disabled={attempted[s.id]}
            onClick={() => {
              setLoadingId(s.id);
              onStartRC(s.id);
            }}
            style={primary(attempted[s.id])}
          >
            {attempted[s.id] ? "Attempted" : "Take Test"}
          </button>

          <button
            disabled={!attempted[s.id]}
            onClick={() => onViewDiagnosis(s.id)}
            style={secondary(attempted[s.id])}
          >
            Diagnosis Report
          </button>

          <button
            disabled={!attempted[s.id]}
            onClick={() => onReviewTest(s.id)}
            style={secondary(attempted[s.id])}
          >
            Analyse / Review Test
          </button>
        </div>
      ))}
    </div>
  );
}

/* styles */
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  maxWidth: 420,
};

const primary = locked => ({
  width: "100%",
  padding: 10,
  background: locked ? "#94a3b8" : "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  marginBottom: 8,
  cursor: locked ? "not-allowed" : "pointer",
});

const secondary = enabled => ({
  width: "100%",
  padding: 8,
  background: enabled ? "#f8fafc" : "#f1f5f9",
  border: "1px solid #cbd5f5",
  borderRadius: 8,
  marginBottom: 6,
});
