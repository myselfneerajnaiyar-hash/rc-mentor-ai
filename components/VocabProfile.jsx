import { useState } from "react";
import RadialProgress from "./analytics/RadialProgress";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showWeakWords, setShowWeakWords] = useState(false);

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
            <StatCard title="Words Seen" value={totalWords} accent="#3b82f6" />
            <StatCard title="Mastered Words" value={masteredWords} accent="#22c55e" />
            <StatCard
            title="Needs Revision"
            value={totalWords - masteredWords}
            accent="#ef4444"
            />
          </div>
          <p style={{ marginTop: 12, color: "#475569", fontWeight: 500 }}>
  👉 Focus on revising{" "}
  <b style={{ color: "#ef4444" }}>
    {totalWords - masteredWords}
  </b>{" "}
  weak words to improve retention.
</p>

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
 <div style={{ ...styles.card, borderLeft: `6px solid ${accent}` }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{row.label}</span>

          {row.label.startsWith("Weak") && row.value > 0 && (
            <button
              onClick={() => setShowWeakWords(v => !v)}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 6,
                border: "1px solid #ef4444",
                background: "#fff",
                color: "#ef4444",
                cursor: "pointer",
              }}
            >
              {showWeakWords ? "Hide" : "View"}
            </button>
          )}

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

    {showWeakWords && (
      <div style={{ marginTop: 16 }}>
        {bank.filter(
          w => w.attempts && (w.correctCount / w.attempts) < 0.4
        ).length === 0 ? (
          <p style={{ color: "#16a34a" }}>
            🎉 No weak words right now. Great job!
          </p>
        ) : (
          <div>
            <h4 style={{ marginBottom: 8 }}>
              Weak Words (Revise First)
            </h4>

            {bank
              .filter(w => w.attempts && (w.correctCount / w.attempts) < 0.4)
              .map(w => (
                <div
                  key={w.word}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #fee2e2",
                    background: "#fff7f7",
                    marginBottom: 6,
                    cursor: "pointer",
                  }}
                >
                  <b>{w.word}</b>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginLeft: 8,
                    }}
                  >
                    {w.correctCount}/{w.attempts} correct
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    )}
  </div>
)}
     {activeTab === "discipline" && (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Practice Discipline</h3>

    <p style={styles.helperText}>
      This shows how regularly you revise vocabulary words.
    </p>

    <div style={{ marginTop: 16 }}>
      <p>
        🟢 <b>Active</b> (revised in last 2 days): <b>{active}</b>
      </p>
      <p style={styles.helperText}>
        These words are fresh in your memory.
      </p>
    </div>

    <div style={{ marginTop: 16 }}>
      <p>
        🟡 <b>Slipping</b> (3–6 days gap): <b>{slipping}</b>
      </p>
      <p style={styles.helperText}>
        These words are starting to fade — revise soon.
      </p>
    </div>

    <div style={{ marginTop: 16 }}>
      <p>
        🔴 <b>Cold</b> (not revised for 7+ days): <b>{cold}</b>
      </p>
      <p style={styles.helperText}>
        High risk of forgetting. Prioritise these.
      </p>
    </div>

    <p style={{ ...styles.helperText, marginTop: 20 }}>
      🎯 Goal: keep most words in <b>Active</b>, minimise <b>Cold</b>.
    </p>
  </div>
)}
     {activeTab === "revision" && (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>Revision Queue</h3>

    <p style={styles.helperText}>
      These words need immediate revision due to low accuracy or long gaps.
    </p>

    {revisionWords.length === 0 ? (
      <p style={{ color: "#16a34a", marginTop: 12 }}>
        🎉 You’re all caught up! No urgent revisions.
      </p>
    ) : (
      <div style={{ marginTop: 16 }}>
        {revisionWords.map(w => {
          const accuracy = Math.round(
            (w.correctCount / w.attempts) * 100
          );

          return (
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
              <b>{w.word}</b>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Accuracy: {accuracy}% · Attempts: {w.attempts}
              </div>
            </div>
          );
        })}
      </div>
    )}

    <p style={{ ...styles.helperText, marginTop: 16 }}>
      🔁 Revise these words to move them into <b>Strong</b> and <b>Active</b>.
    </p>
  </div>
)}
    </div>
    );
}
      
/* ================= COMPONENTS ================= */

function StatCard({ title, value,accent }) {
  return (
    <div style={styles.card}>
      <p style={styles.statLabel}>{title}</p>
     <h2 style={{ ...styles.statValue, color: accent }}>{value}</h2>
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
    background: "linear-gradient(135deg, #fff7ed, #ffffff)",
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
  fontWeight: 900,

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
