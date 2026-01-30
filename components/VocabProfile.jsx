"use client";
import { useEffect, useState } from "react";

export default function VocabProfile() {
  const [tab, setTab] = useState("overview");
  const [bank, setBank] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vocabBank") || "[]");

    const normalized = saved.map(w => ({
      word: w.word,
      correctCount: w.correctCount || 0,
      attemptCount: w.attemptCount || 0,
      lastAttempted: w.lastAttempted || null,
    }));

    setBank(normalized);
  }, []);

  /* ---------------- METRICS ---------------- */

  const totalWords = bank.length;

  const masteredWords = bank.filter(
    w => w.attemptCount >= 3 && w.correctCount / w.attemptCount >= 0.8
  ).length;

  const overallMastery =
    totalWords === 0 ? 0 : Math.round((masteredWords / totalWords) * 100);

  const buckets = {
    veryWeak: 0,
    weak: 0,
    moderate: 0,
    strong: 0,
  };

  bank.forEach(w => {
    if (w.attemptCount === 0) {
      buckets.veryWeak++;
      return;
    }
    const acc = w.correctCount / w.attemptCount;
    if (acc < 0.4) buckets.veryWeak++;
    else if (acc < 0.6) buckets.weak++;
    else if (acc < 0.8) buckets.moderate++;
    else buckets.strong++;
  });

  const now = Date.now();
  const revisionBacklog = bank.filter(w => {
    if (!w.lastAttempted) return false;
    const daysGap = (now - w.lastAttempted) / (1000 * 60 * 60 * 24);
    const acc = w.correctCount / Math.max(1, w.attemptCount);
    return daysGap >= 3 && acc < 0.8;
  });

  /* ---------------- UI ---------------- */

  return (
    <div>
      <h2>Vocab Profile</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["overview", "strength", "discipline", "revision"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: tab === t ? "#2563eb" : "#f9fafb",
              color: tab === t ? "#fff" : "#111827",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <>
          <Stat label="Total Words Seen" value={totalWords} />
          <Stat label="Mastered Words" value={masteredWords} />
          <Stat label="Overall Mastery" value={`${overallMastery}%`} />

          <h4 style={{ marginTop: 16 }}>Mastery Progress</h4>
          <ProgressBar value={overallMastery} />
        </>
      )}

      {/* STRENGTH */}
      {tab === "strength" && (
        <>
          <h4>Strength Distribution</h4>
          <Bar label="Very Weak (0–40%)" value={buckets.veryWeak} color="#ef4444" />
          <Bar label="Weak (40–60%)" value={buckets.weak} color="#f97316" />
          <Bar label="Moderate (60–80%)" value={buckets.moderate} color="#eab308" />
          <Bar label="Strong (80–100%)" value={buckets.strong} color="#22c55e" />
        </>
      )}

      {/* DISCIPLINE */}
      {tab === "discipline" && (
        <>
          <h4>Practice Discipline</h4>
          {bank.some(w => w.attemptCount > 0) ? (
            <p>Practice activity detected ✅</p>
          ) : (
            <p>No recent practice data</p>
          )}
        </>
      )}

      {/* REVISION */}
      {tab === "revision" && (
        <>
          <h4>Revision Queue</h4>
          {revisionBacklog.length === 0 ? (
            <p>No revision backlog 🎉</p>
          ) : (
            <ul>
              {revisionBacklog.map((w, i) => (
                <li key={i}>{w.word}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Stat({ label, value }) {
  return (
    <p>
      {label}: <b>{value}</b>
    </p>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ height: 10, background: "#e5e7eb", borderRadius: 6 }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: value >= 80 ? "#22c55e" : "#f97316",
          borderRadius: 6,
        }}
      />
    </div>
  );
}

function Bar({ label, value, color }) {
  const width = Math.min(100, value * 10); // visual scaling
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13 }}>{label}: {value}</div>
      <div style={{ height: 8, background: "#e5e7eb", borderRadius: 6 }}>
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: color,
            borderRadius: 6,
          }}
        />
      </div>
    </div>
  );
}
