"use client";
import { useEffect, useState } from "react";

export default function VocabProfile() {
  const [tab, setTab] = useState("overview");
  const [bank, setBank] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vocabBank") || "[]");

    // Normalize data (VERY IMPORTANT)
    const normalized = saved.map(w => ({
      word: w.word,
      correctCount: w.correctCount || 0,
      attemptCount: w.attemptCount || 0,
      lastAttempted: w.lastAttempted || null,
    }));

    setBank(normalized);
  }, []);

  /* ---------------- DERIVED METRICS ---------------- */

  const totalWords = bank.length;

  const masteredWords = bank.filter(
    w => w.attemptCount >= 3 && w.correctCount / w.attemptCount >= 0.8
  ).length;

  const overallMastery =
    totalWords === 0
      ? 0
      : Math.round((masteredWords / totalWords) * 100);

  const strengthBuckets = {
    veryWeak: 0,
    weak: 0,
    moderate: 0,
    strong: 0,
  };

  bank.forEach(w => {
    if (w.attemptCount === 0) {
      strengthBuckets.veryWeak++;
      return;
    }
    const acc = w.correctCount / w.attemptCount;
    if (acc < 0.4) strengthBuckets.veryWeak++;
    else if (acc < 0.6) strengthBuckets.weak++;
    else if (acc < 0.8) strengthBuckets.moderate++;
    else strengthBuckets.strong++;
  });

  const now = Date.now();
  const revisionBacklog = bank.filter(w => {
    if (!w.lastAttempted) return false;
    const days = (now - w.lastAttempted) / (1000 * 60 * 60 * 24);
    return days >= 3 && w.correctCount / Math.max(1, w.attemptCount) < 0.8;
  });

  /* ---------------- UI ---------------- */

  return (
    <div>
      <h2>Vocab Profile</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "overview", label: "Overview" },
          { key: "strength", label: "Strength" },
          { key: "discipline", label: "Discipline" },
          { key: "revision", label: "Revision" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: tab === t.key ? "#2563eb" : "#f9fafb",
              color: tab === t.key ? "#fff" : "#111827",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- OVERVIEW ---------------- */}
      {tab === "overview" && (
        <div>
          <p>Total Words Seen: <b>{totalWords}</b></p>
          <p>Mastered Words: <b>{masteredWords}</b></p>
          <p>Overall Mastery: <b>{overallMastery}%</b></p>

          <div style={{ marginTop: 16 }}>
            <ProgressBar value={overallMastery} />
          </div>
        </div>
      )}

      {/* ---------------- STRENGTH ---------------- */}
      {tab === "strength" && (
        <div>
          <p>Very Weak (0–40%): {strengthBuckets.veryWeak}</p>
          <p>Weak (40–60%): {strengthBuckets.weak}</p>
          <p>Moderate (60–80%): {strengthBuckets.moderate}</p>
          <p>Strong (80–100%): {strengthBuckets.strong}</p>
        </div>
      )}

      {/* ---------------- DISCIPLINE ---------------- */}
      {tab === "discipline" && (
        <div>
          {bank.some(w => w.lastAttempted) ? (
            <p>Practice data detected ✅</p>
          ) : (
            <p>No recent practice data</p>
          )}
        </div>
      )}

      {/* ---------------- REVISION ---------------- */}
      {tab === "revision" && (
        <div>
          {revisionBacklog.length === 0 ? (
            <p>No revision backlog 🎉</p>
          ) : (
            <div>
              <p>Words due for revision:</p>
              <ul>
                {revisionBacklog.map((w, i) => (
                  <li key={i}>{w.word}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

function ProgressBar({ value }) {
  return (
    <div
      style={{
        height: 10,
        borderRadius: 6,
        background: "#e5e7eb",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: value >= 80 ? "#22c55e" : "#f97316",
        }}
      />
    </div>
  );
}
