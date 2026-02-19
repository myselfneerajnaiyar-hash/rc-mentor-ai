"use client";

export default function DiagnosisView({
  passages = [],
  answers = [],
  questions = [],
  questionTime = [],
  onReview,
  onBack,
}) {
  /* ===================== 🔒 BACKWARD COMPATIBILITY FIX ===================== */
 const resolvedQuestions = passages.flatMap(
  p => p.questions || []
);
  /* ===================== GLOBAL STATS ===================== */
  const total = resolvedQuestions.length;
  let attempted = 0;
  let correct = 0;

  resolvedQuestions.forEach((q, i) => {
    if (answers[i] !== null && answers[i] !== undefined) {
      attempted++;
      if (Number(answers[i]) === Number(q.correctIndex)) {
        correct++;
      }
    }
  });

  const accuracy = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  /* ===================== QUESTION TIME HEATMAP ===================== */
  const timeHeat = resolvedQuestions.map((q, i) => {
    const t = questionTime[i] || 0;
    const isCorrect = Number(answers[i]) === Number(q.correctIndex);

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

  /* ===================== TIME INSIGHT COUNTS ===================== */
  const slowWrong = timeHeat.filter(q => q.label === "Slow & Wrong").length;
  const fastWrong = timeHeat.filter(q => q.label === "Fast & Wrong").length;
  const slowCorrect = timeHeat.filter(q => q.label === "Slow & Correct").length;

  /* ===================== PASSAGE LEVEL HEAT MAP ===================== */
 let runningIndex = 0;

const passageHeat = passages.map((p, pIdx) => {
  let correctQ = 0;
  let timeSpent = 0;

  p.questions.forEach((q, qIdx) => {
    const globalIndex = runningIndex;

    if (Number(answers[globalIndex]) === Number(q.correctIndex)) {
      correctQ++;
    }

    timeSpent += questionTime[globalIndex] || 0;

    runningIndex++;
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

  /* ===================== QUESTION TYPE MAP ===================== */
  const typeMap = {};
  resolvedQuestions.forEach((q, i) => {
    const type = q.type || "Unknown";
    if (!typeMap[type]) typeMap[type] = { correct: 0, total: 0 };
    typeMap[type].total++;
   if (
  q.correctIndex !== undefined &&
  Number(answers[i]) === Number(q.correctIndex)
) {
      typeMap[type].correct++;
    }
  });

  /* ===================== RENDER ===================== */
  return (
    <div style={page}>
      <div style={card}>
        {/* ===== TOP NAV ===== */}
        <div style={{ marginBottom: 16 }}>
          {onBack && (
            <button onClick={onBack} style={ghostBtn}>
              ← Back to CAT Arena
            </button>
          )}
        </div>

        <h1>RC Diagnosis Report</h1>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>
          This report explains <b>what happened</b>, <b>why it happened</b>,
          and <b>what to do next</b>. CAT RC is a selection game, not a reading contest.
        </p>

        {/* ===== SUMMARY ===== */}
        <div style={grid4}>
          <Stat label="Score" value={`${correct} / ${total}`} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Incorrect" value={attempted - correct} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {/* ===== PASSAGE HEAT MAP ===== */}
        <Section title="🔥 Passage-Level Selection Intelligence (MOST IMPORTANT)">
          <Explain>
            Each passage is judged on <b>accuracy</b> and <b>time cost</b>.
            CAT rewards passages where clarity comes early and accuracy stays high.
          </Explain>

          <div style={passageGrid}>
            {passageHeat.map((p, i) => (
              <div key={i} style={{ ...passageCard, background: p.color }}>
                <h4>{p.title}</h4>
                <p style={{ fontSize: 13 }}>{p.genre}</p>
                <p>{p.correct}/{p.total} correct</p>
                <p>{p.timeMin} min spent</p>
                <b>{p.tag}</b>
              </div>
            ))}
          </div>

          <Legend />
        </Section>

        {/* ===== QUESTION TIME HEATMAP ===== */}
        <Section title="⏱ Question-wise Time & Accuracy Heatmap">
          <Explain>
            This shows how <b>time spent</b> interacted with <b>accuracy</b>.
            Beyond ~90 seconds, extra time usually stops adding clarity.
          </Explain>

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

        {/* ===== TIME INSIGHTS ===== */}
        <Section title="🧠 What Your Time Patterns Reveal">
          <Insight>
            🔴 <b>{slowWrong}</b> Slow & Wrong → You are rereading without a clear
            question framework. Depth ↑, clarity ✖.
          </Insight>
          <Insight>
            🟠 <b>{fastWrong}</b> Fast & Wrong → Premature option elimination
            before understanding the author’s stance.
          </Insight>
          <Insight>
            🟡 <b>{slowCorrect}</b> Slow but Correct → Understanding exists,
            but you must learn when to stop reading.
          </Insight>
        </Section>

        {/* ===== QUESTION TYPE MAP ===== */}
        <Section title="📌 Question-Type Skill Diagnosis">
          <Explain>
            This reveals whether errors are coming from comprehension gaps,
            logical misreads, or poor elimination.
          </Explain>

          {Object.entries(typeMap).map(([type, v]) => {
            const ratio = v.total ? v.correct / v.total : 0;
            let tag =
              ratio >= 0.7 ? "Strength" :
              ratio >= 0.5 ? "Needs Work" :
              "Avoid for Now";

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

        {/* ===== ACTION PLAN ===== */}
        <Section title="🎯 Action Plan for the Next 7 Days">
          <ul>
            <li>
              <b>Attempt High ROI passages first.</b> These match your natural
              comprehension and time control.
            </li>
            <li>
              <b>Selective passages:</b> Attempt only with a question-first mindset.
              Stop reading once the answer becomes clear.
            </li>
            <li>
              <b>Time Traps:</b> Skip completely. CAT rewards selection, not effort.
            </li>
            <li>
              If a question crosses <b>90 seconds</b>, force a decision or skip.
              Accuracy rarely improves beyond this point.
            </li>
          </ul>
        </Section>

       <button
  onClick={onReview}
  style={{
    ...btn,
    marginTop: 36,
    width: "100%",
    maxWidth: 320,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  }}
>
  Review Questions
</button>
      </div>
    </div>
  );
}

/* ===================== SMALL COMPONENTS ===================== */

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

function Explain({ children }) {
  return (
    <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 10 }}>
      {children}
    </p>
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
  const color =
    tag === "Strength"
      ? "#16a34a"
      : tag === "Needs Work"
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

/* ===================== STYLES ===================== */

const page = {
  background: "#f5f7fb",
  minHeight: "100vh",
  padding: "16px 12px",
};
const card = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 14,
  padding: 20,
};
const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  marginTop: 20,
};
const stat = { background: "#eef2ff", padding: 16, borderRadius: 12 };

const passageGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginTop: 12,
};
const passageCard = { borderRadius: 14, padding: 16, color: "#fff" };

const heatGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
  gap: 12,
  marginTop: 12,
};
const heatCell = {
  borderRadius: 12,
  padding: 10,
  minHeight: 70,
  color: "#fff",
  textAlign: "center",
};

const barBg = { height: 8, background: "#e5e7eb", borderRadius: 6, marginTop: 6 };
const barFill = { height: "100%", borderRadius: 6 };

const btn = {
  marginTop: 30,
  padding: "10px 18px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const ghostBtn = {
  padding: "6px 12px",
  border: "1px solid #9ca3af",
  background: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};
