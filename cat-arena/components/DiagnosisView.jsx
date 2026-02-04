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

  /* ---------- TIME INTELLIGENCE ---------- */
  const timeStats = questions.map((q, i) => {
    const t = questionTime[i] || 0;
    const isCorrect = answers[i] === q.correctIndex;

    let bucket = "Slow";
    if (t <= 45) bucket = "Fast";
    else if (t <= 90) bucket = "Optimal";

    return { t, isCorrect, bucket };
  });

  const slowWrong = timeStats.filter(
    q => q.bucket === "Slow" && !q.isCorrect
  ).length;

  const fastWrong = timeStats.filter(
    q => q.bucket === "Fast" && !q.isCorrect
  ).length;

  const slowCorrect = timeStats.filter(
    q => q.bucket === "Slow" && q.isCorrect
  ).length;

  /* ---------- PASSAGE STATS ---------- */
  const passageStats = passages.map((p) => {
    let totalQ = p.questions.length;
    let correctQ = 0;
    let timeSpent = 0;

    p.questions.forEach((q) => {
      const idx = questions.findIndex(x => x.id === q.id);
      if (idx >= 0) {
        if (answers[idx] === q.correctIndex) correctQ++;
        timeSpent += questionTime[idx] || 0;
      }
    });

    const ratio = totalQ ? correctQ / totalQ : 0;

    let tag = "Avoid in CAT";
    if (ratio >= 0.8 && timeSpent <= 300) tag = "High ROI";
    else if (ratio >= 0.6) tag = "Selective Attempt";
    else if (timeSpent > 360) tag = "Time Trap";

    return {
      genre: p.genre,
      correct: correctQ,
      total: totalQ,
      ratio,
      tag,
      time: Math.round(timeSpent / 60),
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
          CAT-style diagnosis focused on selection, time, and decision quality.
        </p>

        {/* ---------- SUMMARY ---------- */}
        <div style={grid4}>
          <Stat label="Score" value={`${correct} / ${total}`} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Incorrect" value={attempted - correct} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {/* ---------- TIME DIAGNOSIS ---------- */}
        <Section title="⏱ Time Diagnosis">
          <Insight>• <b>{slowWrong}</b> questions were <b>Slow & Wrong</b> → over-reading without clarity</Insight>
          <Insight>• <b>{fastWrong}</b> questions were <b>Fast & Wrong</b> → impulsive elimination</Insight>
          <Insight>• <b>{slowCorrect}</b> questions were <b>Slow & Correct</b> → accuracy exists, speed pruning needed</Insight>
        </Section>

        {/* ---------- PASSAGE HEAT MAP ---------- */}
        <Section title="Passage Selection Intelligence">
          {passageStats.map((p) => (
            <HeatRow
              key={p.genre}
              label={`${p.genre} (${p.correct}/${p.total}) • ${p.time} min`}
              ratio={p.ratio}
              tag={p.tag}
            />
          ))}
        </Section>

        {/* ---------- QUESTION TYPE HEAT MAP ---------- */}
        <Section title="Question-Type Accuracy Map">
          {Object.entries(typeMap).map(([type, v]) => {
            const ratio = v.total ? v.correct / v.total : 0;
            let tag = "Avoid Guessing";
            if (ratio >= 0.7) tag = "Strength";
            else if (ratio >= 0.5) tag = "Needs Work";

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
            <li>Avoid Time Trap passages completely</li>
            <li>Attempt only High ROI / Selective passages</li>
            <li>Slow & Wrong → reduce reading depth</li>
            <li>Fast & Wrong → slow down option elimination</li>
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

function HeatRow({ label, ratio, tag }) {
  const width = Math.round(ratio * 100);
  const color =
    tag === "High ROI"
      ? "#16a34a"
      : tag === "Selective Attempt"
      ? "#f59e0b"
      : tag === "Time Trap"
      ? "#dc2626"
      : ratio >= 0.6
      ? "#f59e0b"
      : "#dc2626";

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

const page = {
  background: "#f5f7fb",
  minHeight: "100vh",
  padding: "32px 20px",
};

const card = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: 14,
  padding: 28,
};

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 16,
  marginTop: 24,
};

const stat = {
  background: "#eef2ff",
  padding: 16,
  borderRadius: 12,
};

const barBg = {
  height: 8,
  background: "#e5e7eb",
  borderRadius: 6,
  marginTop: 6,
};

const barFill = {
  height: "100%",
  borderRadius: 6,
};

const btn = {
  marginTop: 30,
  padding: "10px 18px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};
