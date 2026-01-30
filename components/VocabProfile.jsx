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
            <MasteryOverTime data={masteryTimeline} />
          </div>
        </>
      )}

      {/* ================= PLACEHOLDERS ================= */}
      {activeTab !== "overview" && (
        <div style={styles.placeholder}>
          This section will unlock as your practice data grows.
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
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <svg width="100%" height="130">
      <line x1="40" y1="100" x2="95%" y2="100" stroke="#cbd5e1" />

      {data.map((p, i) => {
        if (i === 0) return null;
        const prev = data[i - 1];

        const x1 = 40 + (i - 1) * 120;
        const y1 = 100 - (prev.value / max) * 60;
        const x2 = 40 + i * 120;
        const y2 = 100 - (p.value / max) * 60;

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
        const y = 100 - (p.value / max) * 60;

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
  }
};
