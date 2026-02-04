"use client";

export default function DiagnosisView({
  passages = [],
  answers = [],
  questions = [],
  questionTime = [],
  onReview,
}) {
  /* ---------- GLOBAL STATS ---------- */
  const total = questions.length;
  let attempted = 0;
  let correct = 0;

  questions.forEach((q, i) => {
    if (answers[i] !== null && answers[i] !== undefined) {
      attempted++;
      if (answers[i] === q.correctIndex) correct++;
    }
  });

  const accuracy = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  /* ---------- QUESTION TIME HEATMAP ---------- */
  const timeHeat = questions.map((q, i) => {
    const t = questionTime[i] || 0;
    const isCorrect = answers[i] === q.correctIndex;

    let label = "Slow & Wrong";
    let color = "#dc2626";

    if (t <= 45 && isCorrect) {
      label = "Fast & Correct";
      color = "#16a34a";
    } else if (t <= 45 && !isCorrect) {
      label = "Fast & Wrong";
      color = "#f97316";
    } else if (t <= 90 && isCorrect) {
      label = "Optimal";
      color = "#22c55e";
    } else if (t > 90 && isCorrect) {
      label = "Slow & Correct";
      color = "#eab308";
    }

    return { t, label, color };
  });

  /* ---------- TIME INTELLIGENCE ---------- */
  const slowWrong = timeHeat.filter(q => q.label === "Slow & Wrong").length;
  const fastWrong = timeHeat.filter(q => q.label === "Fast & Wrong").length;
  const slowCorrect = timeHeat.filter(q => q.label === "Slow & Correct").length;

  /* ---------- PASSAGE LEVEL HEAT MAP ---------- */
  const passageHeat = passages.map((p, pIdx) => {
    let correctQ = 0;
    let timeSpent = 0;

    p.questions.forEach((q) => {
      const idx = questions.findIndex(x => x.id === q.id);
      if (idx >= 0) {
        if (answers[idx] === q.correctIndex) correctQ++;
        timeSpent += questionTime[idx] || 0;
      }
    });

    const accuracyRatio = p.questions.length
      ? correctQ / p.questions.length
      : 0;

    let tag = "Time Trap";
    let color = "#dc2626";

    if (accuracyRatio >= 0.8 && timeSpent <= 300) {
      tag = "High ROI";
      color = "#16a34a";
    } else if (accuracyRatio >= 0.6) {
      tag = "Selective Attempt";
      color = "#f59e0b";
    }

    return {
      title: `Passage ${pIdx + 1}`,
      genre: p.genre,
      correct: correctQ,
      total: p.questions.length,
      timeMin: Math.round(timeSpent / 60),
      tag,
      color,
    };
  });

  /* ---------- QUESTION TYPE MAP ---------- */
  const typeMap = {};
  questions.forEach((q, i) => {
    const type = q.type || "Unknown";
    if (!typeMap[type]) typeMap[type] = { correct: 0, total: 0 };
    typeMap[type].total++;
    if (answers[i] === q.correctIndex) typeMap[type].correct++;
  });

  return (
    <div style={page}>
      <div style={card}>
        <h1>RC Diagnosis Report</h1>
        <p style={{ color: "#6b7280" }}>
          CAT-style diagnosis focused on passage selection, time, and decisions.
        </p>

        {/* ---------- SUMMARY ---------- */}
        <div style={grid4}>
          <Stat label="Score" value={`${correct} / ${total}`} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Incorrect" value={attempted - correct} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {/* ---------- PASSAGE HEAT MAP ---------- */}
        <Section title="🔥 Passage-Level Heat Map (MOST IMPORTANT)">
          <div style={passageGrid}>
            {passageHeat.map((p, i) => (
              <div key={i} style={{ ...passageCard, background: p.color }}>
                <h4>{p.title}</h4>
                <p style={{ fontSize: 13 }}>{p.genre}</p>
                <p>{p.correct}/{p.total} correct</p>
                <p>{p.timeMin} min</p>
                <b>{p.tag}</b>
              </div>
            ))}
          </div>
          <Legend />
        </Section>

        {/* ---------- QUESTION TIME HEATMAP ---------- */}
        <Section title="⏱ Question-wise Time Heatmap">
          <div style={heatGrid}>
            {timeHeat.map((q, i) => (
              <div key={i} style={{ ...heatCell, background: q.color }}>
                <div style={{ fontWeight: 600 }}>Q{i + 1}</div>
                <div style={{ fontSize: 12 }}>{q.t}s</div>
                <div style={{ fontSize: 11 }}>{q.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- TIME INSIGHTS ---------- */}
        <Section title="Time Intelligence Insights">
          <Insight>🔴 {slowWrong} Slow & Wrong → comprehension without direction</Insight>
          <Insight>🟠 {fastWrong} Fast & Wrong → impulsive elimination</Insight>
          <Insight>🟡 {slowCorrect} Slow but Correct → accuracy exists, speed missing</Insight>
        </Section>

        {/* ---------- QUESTION TYPE MAP ---------- */}
        <Section title="Question-Type Accuracy Map">
          {Object.entries(typeMap).map(([type, v]) => {
            const ratio = v.total ? v.correct / v.total : 0;
            let tag = ratio >= 0.7 ? "Strength" : ratio >= 0.5 ? "Needs Work" : "Avoid";

            return (
              <HeatRow
                key={type}
                label={`${type} (${v.correct}/${v.total})`}
                ratio={ratio}
                tag={tag}
              />
            );
          })}
        </Section>

        {/* ---------- ACTION RULES ---------- */}
        <Section title="CAT RC Rules (Next 7 Days)">
          <ul>
            <li>Attempt only <b>Green passages</b></li>
            <li>Never touch <b>Time Trap passages</b></li>
            <li>Kill questions crossing <b>90 seconds</b></li>
          </ul>
        </Section>

        <button onClick={onReview} style={btn}>
          Review Questions
        </button>
      </div>
    </div>
  );
}

/* ---------- UI HELPERS ---------- */

function Stat({ label, value }) {
  return (
    <div style={stat}>
      <div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 28 }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Insight({ children }) {
  return <p style={{ marginBottom: 6 }}>{children}</p>;
}

function Legend() {
  return (
    <p style={{ fontSize: 13, marginTop: 8 }}>
      🟢 High ROI &nbsp; 🟡 Selective Attempt &nbsp; 🔴 Time Trap
    </p>
  );
}

function HeatRow({ label, ratio, tag }) {
  const width = Math.round(ratio * 100);
  const color = tag === "Strength" ? "#16a34a" : tag === "Needs Work" ? "#f59e0b" : "#dc2626";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 500 }}>{tag}</span>
      </div>
      <div style={barBg}>
        <div style={{ ...barFill, width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const page = { background: "#f5f7fb", minHeight: "100vh", padding: "32px 20px" };
const card = { maxWidth: 1100, margin: "0 auto", background: "#fff", borderRadius: 14, padding: 28 };
const grid4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 };
const stat = { background: "#eef2ff", padding: 16, borderRadius: 12 };

const passageGrid = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 12 };
const passageCard = { borderRadius: 14, padding: 16, color: "#fff" };

const heatGrid = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 12 };
const heatCell = { borderRadius: 10, padding: 14, color: "#fff", textAlign: "center" };

const barBg = { height: 8, background: "#e5e7eb", borderRadius: 6, marginTop: 6 };
const barFill = { height: "100%", borderRadius: 6 };

const btn = { marginTop: 30, padding: "10px 18px", background: "#2563eb", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer" };
