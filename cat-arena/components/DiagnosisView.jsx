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
     if (
  answers[i] !== null &&
  answers[i] !== undefined &&
  Number(answers[i]) === Number(q.correctIndex)
) {
        correct++;
      }
    }
  });

  const accuracy = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  /* ===================== QUESTION TIME HEATMAP ===================== */
  const timeHeat = resolvedQuestions.map((q, i) => {
  const answer = answers[i];

  // 🚨 If not attempted → special state
  if (answer === null || answer === undefined) {
    return {
      t: 0,
      label: "Not Attempted",
      color: "#d1d5db", // neutral gray
    };
  }

  const t = questionTime[i] || 0;
  const isCorrect =
    Number(answer) === Number(q.correctIndex);

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

    if (
  answers[globalIndex] !== null &&
  answers[globalIndex] !== undefined &&
  Number(answers[globalIndex]) === Number(q.correctIndex)
) {
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
  answers[i] !== null &&
  answers[i] !== undefined &&
  q.correctIndex !== undefined &&
  Number(answers[i]) === Number(q.correctIndex)
) {
      typeMap[type].correct++;
    }
  });

  /* ===================== MENTOR SUMMARY ===================== */

let mentorMessage = "";
let mentorTone = "#16a34a";

if (accuracy >= 75 && attempted <= total * 0.6) {
  mentorMessage =
    "Strong selection discipline. You are choosing passages intelligently and protecting accuracy.";
} 
else if (accuracy >= 75 && attempted > total * 0.75) {
  mentorTone = "#f59e0b";
  mentorMessage =
    "Accuracy is strong, but you may be over-attempting. CAT rewards selective aggression, not volume.";
} 
else if (accuracy < 60 && slowWrong > 0) {
  mentorTone = "#dc2626";
  mentorMessage =
    "You are investing time without clarity. Depth reading without a question framework is costing you.";
} 
else if (fastWrong > 0) {
  mentorTone = "#f97316";
  mentorMessage =
    "You are eliminating options too quickly. Slow down your first reading pass.";
} 
else {
  mentorTone = "#38bdf8";
  mentorMessage =
    "Your performance shows mixed signals. Focus on improving passage selection before speed.";
}

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
        {/* ===== MENTOR SUMMARY ===== */}

<div
  style={{
    marginTop: 32,
    padding: 24,
    borderRadius: 18,
    background: "linear-gradient(135deg, #0f172a, #111827)",
    border: `1px solid ${mentorTone}`,
    boxShadow: `0 0 18px ${mentorTone}33`,
  }}
>
  <h3
  style={{
    marginBottom: 12,
    fontSize: 18,
    color: mentorTone,
    fontWeight: 600,
  }}
>
  🧠 Strategic Mentor Insight
</h3>
  <p style={{ color: "#cbd5e1" }}>{mentorMessage}</p>
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
      <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 36 }}>
      <h3 style={{ fontSize: 20, marginBottom: 12 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Explain({ children }) {
  return (
    <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 14 }}>
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
  background: "#0f172a",
  minHeight: "100vh",
  padding: "24px 16px",
};


const card = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "#1e293b",
  borderRadius: 20,
  padding: 28,
  border: "1px solid #334155",
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  color: "#e2e8f0",
};

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  marginTop: 20,
};

const stat = {
  background: "#0f172a",
  padding: 18,
  borderRadius: 14,
  border: "1px solid #334155",
};

const passageGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginTop: 12,
};

const passageCard = {
  borderRadius: 18,
  padding: 18,
  color: "#fff",
  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const heatGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
  gap: 12,
  marginTop: 12,
};

const heatCell = {
  borderRadius: 16,
  padding: 12,
  minHeight: 82,
  color: "#fff",
  textAlign: "center",
  boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const barBg = { height: 8, background: "#e5e7eb", borderRadius: 6, marginTop: 6 };
const barFill = { height: "100%", borderRadius: 6 };

const btn = {
  marginTop: 36,
  padding: "14px 20px",
  background: "linear-gradient(to right, #2563eb, #1d4ed8)",
  color: "#fff",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

const ghostBtn = {
  padding: "8px 14px",
  border: "1px solid #334155",
  background: "transparent",
  borderRadius: 10,
  color: "#cbd5e1",
  cursor: "pointer",
};
