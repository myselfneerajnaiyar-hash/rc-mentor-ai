import { useState } from "react";
import RadialProgress from "./analytics/RadialProgress";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");

  /* ================== DATA (DYNAMIC LATER) ================== */
 

  // Retention Health (behavioural metric)
  const retentionPercent = 0;

 const masteryTimeline =
  JSON.parse(localStorage.getItem("vocabTimeline") || "[]");
  
  const retentionColor =
    retentionPercent < 40
      ? "#ef4444"
      : retentionPercent < 70
      ? "#f97316"
      : "#22c55e";

  const bank =
  JSON.parse(localStorage.getItem("vocabBank") || "[]");

const totalWords = bank.length;

const masteredWords = bank.filter(
  w => (w.correctCount || 0) >= 2
).length;

const masteryPercent = totalWords
  ? Math.round((masteredWords / totalWords) * 100)
  : 0;
  // ===== DERIVED DATA FROM vocabBank =====

// -------- STRENGTH --------
const strength = { strong: 0, medium: 0, weak: 0 };

bank.forEach(w => {
  if (!w.attempts) return;

  const acc = w.correctCount / w.attempts;

  if (acc >= 0.8 && w.attempts >= 3) strength.strong++;
  else if (acc >= 0.4) strength.medium++;
  else strength.weak++;
});

// -------- DISCIPLINE --------
const now = Date.now();
let active = 0, slipping = 0, cold = 0;

bank.forEach(w => {
  if (!w.lastTested) {
    cold++;
    return;
  }

  const days = (now - w.lastTested) / 86400000;

  if (days <= 2) active++;
  else if (days <= 6) slipping++;
  else cold++;
});

// -------- REVISION --------
const revisionWords = bank.filter(w => {
  if (!w.attempts) return false;

  const acc = w.correctCount / w.attempts;
  const days = w.lastTested
    ? (Date.now() - w.lastTested) / 86400000
    : 999;

  return acc < 0.7 || days > 5;
});
  /* ================== UI ================== */
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Vocab Profile</h1>
      <p style={styles.subtitle}>Your vocabulary performance dashboard</p>

      {/* ---------- TABS ---------- */}
      <div style={styles.tabs}>
        {["overview", "strength", "discipline", "revision"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <>
          {/* HERO */}
          <div style={styles.hero}>
            <div>
              <p style={styles.heroLabel}>RETENTION HEALTH</p>
              <h1 style={styles.heroPercent}>{retentionPercent}%</h1>
              <p style={styles.heroInsight}>
                Based on your last 7 days of vocabulary practice
              </p>
            </div>

            {/* SINGLE RADIAL — SOURCE OF TRUTH */}
            <RadialProgress
              percent={retentionPercent}
              label="Retention"
              color={retentionColor}
            />
          </div>

          {/* STATS */}
          <div style={styles.statGrid}>
            <StatCard title="Words Seen" value={totalWords} />
            <StatCard title="Mastered Words" value={masteredWords} />
            <StatCard
              title="Needs Revision"
              value={totalWords - masteredWords}
            />
          </div>

          {/* LINE GRAPH */}
         <div style={styles.graphCard}>
  <h3 style={styles.cardTitle}>Mastery Over Time</h3>

 {masteryTimeline.length >= 2 ? (
  <MasteryOverTime data={masteryTimeline} />
) : (
  <p style={{ color: "#64748b" }}>
    Complete more drills to see progress over time
  </p>
)}
</div>
        </>
      )}

{activeTab === "strength" && (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Strength Distribution</h3>
    <p style={styles.helperText}>
This shows how well you remember words based on past test accuracy.
</p>

    {[
  {
    label: "Strong (Exam-ready words)",
    value: strength.strong,
    color: "#22c55e",
  },
  {
    label: "Medium (Need revision)",
    value: strength.medium,
    color: "#eab308",
  },
  {
    label: "Weak (High priority)",
    value: strength.weak,
    color: "#ef4444",
  },
].map(row => (
      <div key={row.label} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{row.label}</span>
          <span>{row.value}</span>
        </div>
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${bank.length ? (row.value / bank.length) * 100 : 0}%`,
              background: row.color,
            }}
          />
        </div>
      </div>
    ))}
    <p style={styles.helperText}>
Focus first on <b>Weak</b> words, then convert <b>Medium</b> into <b>Strong</b>.
</p>
  </div>
)}
      {activeTab === "discipline" && (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Practice Discipline</h3>

    <p>Active (last 2 days): <b>{active}</b></p>
    <p>Slipping (3–6 days): <b>{slipping}</b></p>
    <p>Cold (7+ days): <b>{cold}</b></p>
  </div>
)}
      {activeTab === "revision" && (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Revision Queue</h3>

    {revisionWords.length === 0 ? (
      <p style={{ color: "#64748b" }}>
        🎉 No urgent revisions right now.
      </p>
    ) : (
      revisionWords.map(w => (
        <div
          key={w.word}
          style={{
            padding: 10,
            marginBottom: 8,
            borderRadius: 8,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <b>{w.word}</b> — {w.correctCount}/{w.attempts} correct
        </div>
      ))
    )}
  </div>
)}
      
     
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.statLabel}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

function MasteryOverTime({ data }) {
  const max = Math.max(...data.map(d => d.accuracy), 1);

  return (
    <svg width="100%" height="130">
      <line x1="40" y1="100" x2="95%" y2="100" stroke="#cbd5e1" />

      {data.map((p, i) => {
        if (i === 0) return null;
        const prev = data[i - 1];

        const x1 = 40 + (i - 1) * 120;
        const y1 = 90 - (prev.accuracy / max) * 60;
        const x2 = 40 + i * 120;
        const y2 = 90 - (p.accuracy / max) * 60;

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#f97316"
            strokeWidth="3"
          />
        );
      })}

      {data.map((p, i) => {
        const x = 40 + i * 120;
        const y = 90 - (p.accuracy / max) * 60;

        return (
          <circle key={i} cx={x} cy={y} r="5" fill="#f97316" />
        );
      })}
    </svg>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 32,
    background: "#f1f5f9",
    minHeight: "100vh"
  },
  title: {
    fontSize: 30,
    fontWeight: 800,
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569",
    marginBottom: 24
  },
  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 28
  },
  tab: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600
  },
  tabActive: {
    background: "#f97316",
    color: "#fff",
    borderColor: "#f97316"
  },
  hero: {
    background: "#fff",
    borderRadius: 18,
    padding: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28
  },
  heroLabel: {
    color: "#f97316",
    fontWeight: 700,
    letterSpacing: 1
  },
  heroPercent: {
    fontSize: 56,
    fontWeight: 900
  },
  heroInsight: {
    color: "#475569",
    maxWidth: 300
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    marginBottom: 28
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 20
  },
  statLabel: {
    color: "#64748b"
  },
  statValue: {
    fontSize: 32,
    fontWeight: 800
  },
  graphCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 24
  },
  cardTitle: {
    fontWeight: 700,
    marginBottom: 12
  },
  placeholder: {
    padding: 40,
    color: "#64748b",
    background: "#fff",
    borderRadius: 16
  },
  barBg: {
  height: 10,
  background: "#e5e7eb",
  borderRadius: 999,
  marginTop: 6,
},
barFill: {
  height: "100%",
  borderRadius: 999,
},
};
