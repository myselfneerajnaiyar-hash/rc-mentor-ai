import { useEffect, useState } from "react";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [count, setCount] = useState({ words: 0, mastered: 0 });

  const totalWords = 34;
  const masteredWords = 0;
  const masteryPercent = 0;

  // COUNT-UP ANIMATION
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

  const strengthData = [
    { label: "Very Weak", value: 34, color: "#ef4444" },
    { label: "Weak", value: 0, color: "#f97316" },
    { label: "Moderate", value: 0, color: "#eab308" },
    { label: "Strong", value: 0, color: "#22c55e" }
  ];

  const revisionQueue = [
    "Obscure","Pragmatic","Ambiguous","Conundrum",
    "Nuance","Conduit","Belies","Interplay"
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Vocab Profile</h1>
      <p style={styles.subtitle}>Your vocabulary intelligence dashboard</p>

      {/* TABS */}
      <div style={styles.tabs}>
        {["overview","strength","discipline","revision"].map(tab => (
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

      {/* CONTENT */}
      <div style={styles.fadeIn} key={activeTab}>
        {activeTab === "overview" && (
          <div style={styles.grid}>
            <StatCard title="Total Words Seen" value={count.words} />
            <StatCard title="Mastered Words" value={count.mastered} />
            <StatCard title="Overall Mastery" value={`${masteryPercent}%`} />

            <MasteryRing percent={masteryPercent} />
          </div>
        )}

      {/* ================= OVERVIEW ================= */}
{activeTab === "overview" && (
  <div style={styles.overviewWrap}>

    {/* HERO CARD */}
    <div style={styles.heroCard}>
      <div>
        <h2 style={styles.heroTitle}>Your Vocabulary Reality Check</h2>
        <p style={styles.heroSub}>
          You’ve encountered <b>{totalWords}</b> words so far.
        </p>

        <div style={styles.heroInsight}>
          {masteredWords === 0 ? (
            <span>⚠️ All {totalWords} words still need reinforcement</span>
          ) : (
            <span>🔥 You’ve mastered {masteredWords} words — keep going</span>
          )}
        </div>
      </div>

      {/* RING */}
      <div style={styles.ringWrap}>
        <div style={styles.ring}>
         <span style={styles.ringText}>{masteryPercent}%</span>
        </div>
        <p style={styles.ringLabel}>Overall Mastery</p>
      </div>
    </div>

    {/* SECONDARY STATS */}
    <div style={styles.statGrid}>
      <div style={styles.statCard}>
        <p className="label">Words Seen</p>
        <h2>{totalWords}</h2>
      </div>
      <div style={styles.statCard}>
        <p className="label">Mastered</p>
        <h2>{masteredWords}</h2>
      </div>
      <div style={styles.statCard}>
        <p className="label">Needs Revision</p>
        <h2>{totalWords - masteredWords}</h2>
      </div>
    </div>

  </div>
)}
        {activeTab === "discipline" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Practice Discipline</h3>
            <p style={styles.empty}>No practice yet — consistency unlocks mastery 🔥</p>
          </div>
        )}

        {activeTab === "revision" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Revision Queue</h3>
            <div style={styles.chips}>
              {revisionQueue.map(w => (
                <div key={w} style={styles.chip}>{w}</div>
              ))}
            </div>
          </div>
        )}
      </div>
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

function MasteryRing({ percent }) {
  return (
    <div style={{ ...styles.card, alignItems: "center" }}>
      <h3 style={styles.cardTitle}>Vocabulary Mastery</h3>
      <div style={styles.ringOuter}>
        <div style={{
          ...styles.ringInner,
          background: `conic-gradient(#22c55e ${percent * 3.6}deg, #e5e7eb 0deg)`
        }}>
          <span style={styles.ringText}>{percent}%</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  page: {
    padding: 32,
    background: "#f8fafc",
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
    fontWeight: 600,
    letterSpacing: 0.5
  },
  tabActive: {
    background: "#f97316",
    color: "#fff",
    borderColor: "#f97316",
    boxShadow: "0 8px 20px rgba(249,115,22,.45)"
  },
  fadeIn: {
    animation: "fade .3s ease"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
    gap: 22
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 22,
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
    height: 140,
    marginTop: 10
  },
  ringInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all .6s ease"
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
