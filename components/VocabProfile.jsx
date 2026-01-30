import { useEffect, useState } from "react";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [count, setCount] = useState({ words: 0, mastered: 0 });

  // ====== DATA (SAFE, DEFINED ONCE) ======
  const totalWords = 34;
  const masteredWords = 0;
  const masteryPercent = Math.round((masteredWords / totalWords) * 100);

  const strengthData = [
    { label: "Very Weak", value: 34, color: "#ef4444" },
    { label: "Weak", value: 0, color: "#f97316" },
    { label: "Moderate", value: 0, color: "#eab308" },
    { label: "Strong", value: 0, color: "#22c55e" }
  ];

  const revisionQueue = [
    "Obscure", "Pragmatic", "Ambiguous", "Conundrum",
    "Nuance", "Conduit", "Belies", "Interplay"
  ];
  // Mastery over time (mock for now – later replace with API)
const masteryTimeline = [
  { day: "Day 1", value: 0 },
  { day: "Day 2", value: 0 },
  { day: "Day 3", value: 0 },
  { day: "Day 4", value: masteryPercent }
]

  // ====== COUNT-UP ANIMATION ======
  useEffect(() => {
    let w = 0;
    let m = 0;
    const interval = setInterval(() => {
      if (w < totalWords) w++;
      if (m < masteredWords) m++;
      setCount({ words: w, mastered: m });
      if (w >= totalWords && m >= masteredWords) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Vocab Profile</h1>
      <p style={styles.subtitle}>Your vocabulary intelligence dashboard</p>

      {/* ====== TABS ====== */}
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

      {/* ====== OVERVIEW ====== */}
    {/* ====== OVERVIEW ====== */}
{activeTab === "overview" && (
  <>
    {/* TOP KPI GRID */}
    <div style={styles.grid}>
      <StatCard title="Words Seen" value={count.words} />
      <StatCard title="Mastered" value={count.mastered} />
      <StatCard title="Overall Mastery" value={`${masteryPercent}%`} />
    </div>

    {/* TREND GRAPH */}
    <div style={{ marginTop: 28 }}>
      <MasteryOverTime data={masteryTimeline} />
    </div>
  </>
)}

      {/* ====== STRENGTH ====== */}
      {activeTab === "strength" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Strength Distribution</h3>

          {strengthData.map(item => (
            <div key={item.label} style={{ marginBottom: 18 }}>
              <div style={styles.strengthRow}>
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>

              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${(item.value / totalWords) * 100}%`,
                    background: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== DISCIPLINE ====== */}
      {activeTab === "discipline" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Practice Discipline</h3>
          <p style={styles.empty}>
            No practice yet — consistency unlocks mastery 🔥
          </p>
        </div>
      )}

      {/* ====== REVISION ====== */}
      {activeTab === "revision" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Revision Queue</h3>
          <div style={styles.chips}>
            {revisionQueue.map(word => (
              <div key={word} style={styles.chip}>{word}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== COMPONENTS ====== */

function StatCard({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.statLabel}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

function MasteryRing({ percent }) {
  return (
    <div style={styles.ringOuter}>
      <div
        style={{
          ...styles.ringInner,
          background: `conic-gradient(#f97316 ${percent * 3.6}deg, #e5e7eb 0deg)`
        }}
      >
        <span style={styles.ringText}>{percent}%</span>
      </div>
    </div>
  );
}

function MasteryOverTime({ data }) {
  const maxY = 100;
  const width = 420;
  const height = 160;
  const padding = 30;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (d.value / maxY) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Mastery Over Time</h3>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* AXES */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />

        {/* LINE */}
        <polyline
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          points={points}
        />

        {/* DOTS */}
        {data.map((d, i) => {
          const x = padding + (i * (width - padding * 2)) / (data.length - 1);
          const y = height - padding - (d.value / maxY) * (height - padding * 2);
          return <circle key={i} cx={x} cy={y} r="4" fill="#f97316" />;
        })}
      </svg>

      <p style={{ color: "#64748b", fontSize: 13 }}>
        Tracks how your vocabulary mastery evolves with practice
      </p>
    </div>
  );
}
/* ====== STYLES ====== */

const styles = {
  page: {
    padding: 32,
    background: "#f8fafc",
    minHeight: "100vh"
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569",
    marginBottom: 28
  },
  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 32
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
    borderColor: "#f97316",
    boxShadow: "0 8px 20px rgba(249,115,22,.45)"
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #fff7ed, #ffffff)",
    padding: 32,
    borderRadius: 24,
    boxShadow: "0 20px 40px rgba(249,115,22,.15)",
    marginBottom: 32
  },
  heroLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: 700,
    color: "#f97316"
  },
  heroPercent: {
    fontSize: 64,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1
  },
  heroInsight: {
    marginTop: 8,
    color: "#475569",
    maxWidth: 300
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
    gap: 20,
    marginBottom: 32
  },

  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 12px 30px rgba(0,0,0,.08)"
  },
  cardTitle: {
    fontWeight: 700,
    marginBottom: 16
  },
  statLabel: {
    color: "#64748b"
  },
  statValue: {
    fontSize: 34,
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
    fontSize: 24,
    fontWeight: 800
  },

  strengthRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    marginBottom: 6
  },
  barBg: {
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb"
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width .6s ease"
  },

  empty: {
    color: "#64748b"
  },

  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10
  },
  chip: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#fff7ed",
    color: "#9a3412",
    fontWeight: 600,
    border: "1px solid #fed7aa"
  }
};
