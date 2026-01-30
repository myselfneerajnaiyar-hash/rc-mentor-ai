import { useEffect, useState } from "react";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [vocabStats, setVocabStats] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("vocabStats");
    if (stored) {
      setVocabStats(JSON.parse(stored));
    }
  }, []);

  const words = Object.values(vocabStats);

  const totalSeen = words.length;
  const masteredCount = words.filter(w => w.mastered).length;
  const masteryPercent = totalSeen
    ? Math.round((masteredCount / totalSeen) * 100)
    : 0;

  /* ---------------- STRENGTH BUCKETS ---------------- */

  const buckets = {
    veryWeak: 0,
    weak: 0,
    moderate: 0,
    strong: 0,
  };

  words.forEach(w => {
    const accuracy = w.seen ? (w.correct / w.seen) * 100 : 0;

    if (accuracy < 40) buckets.veryWeak++;
    else if (accuracy < 60) buckets.weak++;
    else if (accuracy < 80) buckets.moderate++;
    else buckets.strong++;
  });

  /* ---------------- DISCIPLINE ---------------- */

  const dailyLog = JSON.parse(
    localStorage.getItem("dailyVocabLog") || "{}"
  );

  const last7Days = Object.entries(dailyLog).slice(-7);

  /* ---------------- REVISION PRIORITY ---------------- */

  const today = new Date();

  const revisionList = words
    .map(w => {
      if (!w.lastSeen) return null;

      const last = new Date(w.lastSeen);
      const daysGap = (today - last) / (1000 * 60 * 60 * 24);
      const accuracy = w.seen ? w.correct / w.seen : 0;

      return {
        word: w.word,
        risk: Math.round(daysGap * (1 - accuracy) * 10),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 10);

  return (
    <div style={{ padding: 20 }}>
      <h2>Vocab Profile</h2>

      {/* ---------------- TABS ---------------- */}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("overview")}>Overview</button>
        <button onClick={() => setActiveTab("strength")}>Strength</button>
        <button onClick={() => setActiveTab("discipline")}>Discipline</button>
        <button onClick={() => setActiveTab("revision")}>Revision</button>
      </div>

      {/* ---------------- OVERVIEW ---------------- */}

      {activeTab === "overview" && (
        <div>
          <p>Total Words Seen: <b>{totalSeen}</b></p>
          <p>Mastered Words: <b>{masteredCount}</b></p>
          <p>Overall Mastery: <b>{masteryPercent}%</b></p>
        </div>
      )}

      {/* ---------------- STRENGTH ---------------- */}

      {activeTab === "strength" && (
        <div>
          <p>Very Weak (0–40%): {buckets.veryWeak}</p>
          <p>Weak (40–60%): {buckets.weak}</p>
          <p>Moderate (60–80%): {buckets.moderate}</p>
          <p>Strong (80–100%): {buckets.strong}</p>
        </div>
      )}

      {/* ---------------- DISCIPLINE ---------------- */}

      {activeTab === "discipline" && (
        <div>
          {last7Days.length === 0 && <p>No recent practice data</p>}
          {last7Days.map(([date, count]) => (
            <p key={date}>
              {date}: <b>{count}</b> words practiced
            </p>
          ))}
        </div>
      )}

      {/* ---------------- REVISION ---------------- */}

      {activeTab === "revision" && (
        <div>
          {revisionList.length === 0 && <p>No revision backlog 🎉</p>}
          {revisionList.map(w => (
            <p key={w.word}>
              {w.word} — Risk Score: <b>{w.risk}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
