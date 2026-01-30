import { useState } from "react";

export default function VocabProfile() {
  const [tab, setTab] = useState("overview");

  // TEMP DATA (replace later with real data)
  const totalWords = 34;
  const masteredWords = 0;
  const masteryPercent = 0;

  const strengthData = [
    { label: "Very Weak", value: 34, color: "#ef4444" },
    { label: "Weak", value: 0, color: "#f97316" },
    { label: "Moderate", value: 0, color: "#eab308" },
    { label: "Strong", value: 0, color: "#22c55e" }
  ];

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Vocab Profile</h2>
      <p style={styles.subtitle}>Your vocabulary intelligence dashboard</p>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "strength", "discipline", "revision"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {})
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === "overview" && (
        <div style={styles.grid}>
          <StatCard title="Total Words Seen" value={totalWords} />
          <StatCard title="Mastered Words" value={masteredWords} />
          <StatCard title="Overall Mastery" value={`${masteryPercent}%`} />

          <div style={styles.card}>
            <h4>Vocabulary Mastery</h4>
            <div style={styles.ring}>
              <span>{masteryPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {tab === "strength" && (
        <div style={styles.card}>
          <h4>Strength Distribution</h4>
          {strengthData.map(s => (
            <div key={s.label} style={{ marginBottom: 14 }}>
              <div style={styles.row}>
                <span>{s.label}</span>
                <span>{s.value}</span>
              </div>
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${(s.value / totalWords) * 100}%`,
                    background: s.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "discipline" && (
        <div style={styles.card}>
          <h4>Practice Discipline</h4>
          <p style={styles.muted}>
            No drill history yet. Start practicing 🚀
          </p>
        </div>
      )}

      {tab === "revision" && (
        <div style={styles.card}>
          <h4>Revision Queue</h4>
          <ul style={styles.list}>
            {[
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
            ].map(w => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
    padding: 32,
    background: "#f4f6fb",
    minHeight: "100vh"
  },
  title: {
    marginBottom: 4
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: 20
  },
  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 24
  },
  tab: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    cursor: "pointer"
    fontWeight: 500,
  color: "#374151"
  },
 tabActive: {
  background: "#f97316", // ORANGE
  color: "#fff",
  borderColor: "#f97316",
  boxShadow: "0 6px 16px rgba(249,115,22,0.45)"
},
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
  },
  cardTitle: {
    color: "#6b7280",
    fontSize: 14
  },
  ring: {
    marginTop: 16,
    width: 120,
    height: 120,
    borderRadius: "50%",
    border: "10px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#2563eb"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    marginBottom: 4
  },
  barBg: {
    height: 10,
    background: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 6
  },
  muted: {
    color: "#6b7280"
  },
  list: {
    marginTop: 10,
    paddingLeft: 18
  }
};
