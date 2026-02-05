"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "catRCResults";

function loadDiagnosisHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    return Object.entries(raw)
      .filter(([_, arr]) => Array.isArray(arr) && arr.length > 0)
      .map(([sectionalId, arr]) => {
        const attempt = arr[0]; // 🔒 ONLY ONE ATTEMPT PER SECTIONAL
        return {
          sectionalId,
          timestamp: attempt.timestamp,
          attemptId: attempt.attemptId,
        };
      });
  } catch {
    return [];
  }
}

export default function Navbar({ view, setView }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (open) {
      setHistory(loadDiagnosisHistory());
    }
  }, [open]);

  const tabs = [
    { key: "home", label: "Home" },
    { key: "rc", label: "Practice RC" },
    { key: "vocab", label: "VocabularyLab" },
    { key: "speed", label: "SpeedGym" },
    { key: "cat", label: "CAT Arena" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 100,
        alignItems: "center",
      }}
    >
      {/* LEFT TABS */}
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setView(t.key)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: view === t.key ? "#2563eb" : "#f9fafb",
            color: view === t.key ? "#fff" : "#111",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.label}
        </button>
      ))}

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* ===== DIAGNOSIS HISTORY DROPDOWN ===== */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: "#f97316", // orange
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          📊 Diagnosis History ▼
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "110%",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              width: 320,
              padding: 10,
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              zIndex: 1000,
            }}
          >
            {history.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                No diagnosis available
              </div>
            )}

            {history.map(h => (
              <button
                key={h.sectionalId}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("OPEN_DIAGNOSIS", {
                      detail: {
                        sectionalId: h.sectionalId,
                        attemptId: h.attemptId,
                      },
                    })
                  );
                  setOpen(false);
                  setView("cat");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {h.sectionalId.replace("-", " ").toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {new Date(h.timestamp).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
