import { useState } from "react";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");

  // MOCK DATA (later you’ll wire real data)
  const totalWords = 34;
  const masteredWords = 0;
  const masteryPercent = 0;

  const strengthData = [
    { label: "Very Weak (0%)", value: 34, color: "#ef4444" },
    { label: "Weak (1 hit)", value: 0, color: "#f97316" },
    { label: "Moderate (2 hits)", value: 0, color: "#eab308" },
    { label: "Strong (3+ hits)", value: 0, color: "#22c55e" }
  ];

  const revisionQueue = [
    "Obscure",
    "Pragmatic",
    "Ambiguous",
    "Conundrum",
    "Nuance",
    "Conduit",
    "Belies",
    "Interplay",
    "Pervasive",
    "Amplification"
  ];

  return (
    <div style={styles.page}>
      {/* HEADER */}
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={styles.grid}>
          <StatCard title="Total Words Seen" value={totalWords} />
          <StatCard title="Mastered Words" value={masteredWords} />
          <StatCard title="Overall Mastery" value={`${masteryPercent}%`} />

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Vocabulary Mastery</h3>
            <div style={styles.ringWrap}>
              <div style={styles.ring}>{masteryPercent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* STRENGTH */}
      {activeTab === "strength" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Strength Distribution</h3>
          {strengthData.map(item => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={styles.strengthLabel}>
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

      {/* DISCIPLINE */}
      {activeTab === "discipline" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Practice Discipline</h3>
          <p style={styles.emptyText}>
            No drill history yet. Start practicing 🚀
          </p>
        </div>
      )}

      {/* REVISION */}
      {activeTab === "revision" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Revision Queue</h3>
          <div style={styles.revisionGrid}>
            {revisionQueue.map(word => (
              <div key={word} style={styles.revisionChip}>
                {word}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.statLabel}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
    padding: 32,
    background: "#f8fafc",
    minHeight: "100vh"
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a"
  },

  subtitle: {
    marginTop: 4,
    marginBottom: 24,
    color: "#475569"
  },

  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 28
  },

  tab: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 500,
    color: "#334155"
  },

  tabActive: {
    background: "#f97316",
    color: "#ffffff",
    borderColor: "#f97316",
    boxShadow: "0 6px 16px rgba(249,115,22,0.35)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20
  },

  card: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
  },

  cardTitle: {
    fontWeight: 600,
    marginBottom: 16,
    color: "#0f172a"
  },

  statLabel: {
    color: "#64748b",
    marginBottom: 6
  },

  statValue: {
    fontSize: 32,
    fontWeight: 700,
    color: "#0f172a"
  },

  ringWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: 16
  },

  ring: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    border: "10px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 22,
    color: "#22c55e"
  },

  strengthLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    marginBottom: 6
  },

  barBg: {
    width: "100%",
    height: 10,
    background: "#e5e7eb",
    borderRadius: 999
  },

  barFill: {
    height: "100%",
    borderRadius: 999
  },

  emptyText: {
    color: "#64748b"
  },

  revisionGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10
  },

  revisionChip: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#fff7ed",
    color: "#9a3412",
    fontWeight: 500,
    border: "1px solid #fed7aa"
  }
};
