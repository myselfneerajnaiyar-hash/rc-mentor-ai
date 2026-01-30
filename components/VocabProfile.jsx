import { useEffect, useState } from "react";
import RadialProgress from "./analytics/RadialProgress";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");

  // ---- DATA (HOOK THIS TO BACKEND LATER) ----
  const totalWords = 34;
  const masteredWords = 0;
  const masteryPercent = Math.round((masteredWords / totalWords) * 100);

  const masteryTimeline = [
    { day: "Day 1", value: 0 },
    { day: "Day 2", value: 0 },
    { day: "Day 3", value: 0 },
    { day: "Day 4", value: 0 }
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Vocab Profile</h1>
      <p style={styles.subtitle}>Your vocabulary intelligence dashboard</p>

      {/* TABS */}
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
    <p style={styles.heroLabel}>OVERALL MASTERY</p>
    <h1 style={styles.heroPercent}>{masteryPercent}%</h1>
    <p style={styles.heroInsight}>
      {masteredWords === 0
        ? `All ${totalWords} words currently need reinforcement`
        : `You have mastered ${masteredWords} words`}
    </p>
  </div>

  {/* SINGLE SOURCE OF TRUTH */}
  <RadialProgress
    value={masteryPercent}
    size={140}
    strokeWidth={10}
    color="#f97316"
  />
</div>

          {/* STATS */}
          <div style={styles.statGrid}>
            <StatCard title="Words Seen" value={totalWords} />
            <StatCard title="Mastered Words" value={masteredWords} />
            <StatCard title="Needs Revision" value={totalWords - masteredWords} />
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
          This section will activate as data grows.
        </div>
      )}
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

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
    <svg width="100%" height="120">
      {/* AXIS */}
      <line x1="40" y1="90" x2="95%" y2="90" stroke="#cbd5e1" />

      {/* LINE */}
      {data.map((point, i) => {
        if (i === 0) return null;
        const prev = data[i - 1];

        const x1 = 40 + (i - 1) * 120;
        const y1 = 90 - (prev.value / max) * 60;

        const x2 = 40 + i * 120;
        const y2 = 90 - (point.value / max) * 60;

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

      {/* DOTS */}
      {data.map((point, i) => {
        const x = 40 + i * 120;
        const y = 90 - (point.value / max) * 60;

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill="#f97316"
          />
        );
      })}
    </svg>
  );
}

/* ---------- STYLES ---------- */

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
    color: "#475569"
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

  ringOuter: {
    width: 140,
    height: 140
  },
  ringInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  ringText: {
    fontSize: 22,
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
