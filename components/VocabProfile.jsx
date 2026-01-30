"use client";
import { useEffect, useState } from "react";

// Analytics components
import StatCard from "./analytics/StatCard";
import RadialProgress from "./analytics/RadialProgress";
import StrengthBars from "./analytics/StrengthBars";

export default function VocabProfile() {
  const [tab, setTab] = useState("overview");
  const [bank, setBank] = useState([]);
  const [drillHistory, setDrillHistory] = useState([]);

  useEffect(() => {
    const savedBank = JSON.parse(localStorage.getItem("vocabBank") || "[]");
    setBank(savedBank);

    const history = JSON.parse(localStorage.getItem("vocabDrillHistory") || "[]");
    setDrillHistory(history);
  }, []);

  // ---------- METRICS ----------
  const totalWords = bank.length;
  const masteredWords = bank.filter(w => (w.correctCount || 0) >= 3).length;
  const masteryPct = totalWords
    ? Math.round((masteredWords / totalWords) * 100)
    : 0;

  // Strength buckets
  const buckets = {
    veryWeak: bank.filter(w => (w.correctCount || 0) === 0).length,
    weak: bank.filter(w => (w.correctCount || 0) === 1).length,
    moderate: bank.filter(w => (w.correctCount || 0) === 2).length,
    strong: bank.filter(w => (w.correctCount || 0) >= 3).length,
  };

  // Discipline
  const totalDrills = drillHistory.length;
  const avgAccuracy = totalDrills
    ? Math.round(
        drillHistory.reduce((a, b) => a + b.accuracy, 0) / totalDrills
      )
    : 0;

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24 }}>Vocab Profile</h2>
        <p style={{ color: "#6b7280" }}>
          Your vocabulary intelligence dashboard
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {["overview", "strength", "discipline", "revision"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: tab === t ? "#2563eb" : "#f8fafc",
              color: tab === t ? "#fff" : "#1f2937",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <StatCard
              title="Total Words Seen"
              value={totalWords}
              accent="#2563eb"
            />
            <StatCard
              title="Mastered Words"
              value={masteredWords}
              accent="#16a34a"
            />
            <StatCard
              title="Overall Mastery"
              value={`${masteryPct}%`}
              accent="#f97316"
            />
          </div>

          <div style={{ marginTop: 32, maxWidth: 360 }}>
            <RadialProgress
              value={masteryPct}
              label="Vocabulary Mastery"
            />
          </div>
        </>
      )}

      {/* STRENGTH */}
      {tab === "strength" && (
        <div style={{ maxWidth: 520 }}>
          <h3 style={{ marginBottom: 16 }}>Strength Distribution</h3>
          <StrengthBars
            data={[
              { label: "Very Weak (0%)", value: buckets.veryWeak, color: "#dc2626" },
              { label: "Weak (1 hit)", value: buckets.weak, color: "#f97316" },
              { label: "Moderate (2 hits)", value: buckets.moderate, color: "#eab308" },
              { label: "Strong (3+ hits)", value: buckets.strong, color: "#16a34a" },
            ]}
          />
        </div>
      )}

      {/* DISCIPLINE */}
      {tab === "discipline" && (
        <div style={{ maxWidth: 520 }}>
          <h3 style={{ marginBottom: 16 }}>Practice Discipline</h3>

          {totalDrills === 0 ? (
            <p style={{ color: "#6b7280" }}>
              No drill history yet. Start practicing 🚀
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
              }}
            >
              <StatCard
                title="Total Drills"
                value={totalDrills}
                accent="#2563eb"
              />
              <StatCard
                title="Avg Accuracy"
                value={`${avgAccuracy}%`}
                accent="#16a34a"
              />
            </div>
          )}
        </div>
      )}

      {/* REVISION */}
      {tab === "revision" && (
        <div style={{ maxWidth: 520 }}>
          <h3 style={{ marginBottom: 12 }}>Revision Queue</h3>

          {bank.filter(w => (w.correctCount || 0) <= 1).length === 0 ? (
            <p style={{ color: "#16a34a" }}>
              🎉 No revision backlog. You’re in control.
            </p>
          ) : (
            <ul>
              {bank
                .filter(w => (w.correctCount || 0) <= 1)
                .slice(0, 10)
                .map((w, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {w.word}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
