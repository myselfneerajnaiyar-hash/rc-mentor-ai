"use client";

/**
 * DiagnosisView (LOCKED VERSION)
 * Assumptions:
 * - questions[] = flat array of all questions (with id, type, correctIndex)
 * - answers[]   = array indexed SAME as questions (can contain undefined)
 * - passages[]  = array of passages, each with questions[] containing ids
 */

export default function DiagnosisView({
  passages = [],
  questions = [],
  answers = [],
  onReview,
}) {
  /* ---------- BUILD SAFE LOOKUPS ---------- */

  const questionById = {};
  questions.forEach((q, i) => {
    questionById[q.id] = { ...q, index: i };
  });

  /* ---------- OVERALL METRICS ---------- */

  let attempted = 0;
  let correct = 0;

  questions.forEach((q, i) => {
    const ans = answers[i];
    if (ans !== undefined && ans !== null) {
      attempted++;
      if (ans === q.correctIndex) correct++;
    }
  });

  const totalQuestions = questions.length;
  const incorrect = attempted - correct;
  const accuracy =
    attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  /* ---------- PASSAGE-WISE DECISION QUALITY ---------- */

  const passageStats = passages.map((p) => {
    let total = 0;
    let correctCount = 0;
    let attemptedCount = 0;

    p.questions?.forEach((pq) => {
      const q = questionById[pq.id];
      if (!q) return;

      total++;
      const ans = answers[q.index];
      if (ans !== undefined && ans !== null) {
        attemptedCount++;
        if (ans === q.correctIndex) correctCount++;
      }
    });

    const acc =
      attemptedCount > 0 ? correctCount / attemptedCount : 0;

    let tag = "Avoid in CAT";
    if (attemptedCount >= 2 && acc >= 0.6) tag = "Selective Attempt";
    if (attemptedCount >= 3 && acc >= 0.8) tag = "Strength";

    return {
      genre: p.genre || "Unknown",
      attempted: attemptedCount,
      correct: correctCount,
      total,
      tag,
    };
  });

  /* ---------- QUESTION-TYPE SKILL MAP ---------- */

  const typeMap = {};

  questions.forEach((q, i) => {
    const type = q.type || "Unknown";
    if (!typeMap[type]) {
      typeMap[type] = { correct: 0, attempted: 0, total: 0 };
    }

    typeMap[type].total++;
    const ans = answers[i];
    if (ans !== undefined && ans !== null) {
      typeMap[type].attempted++;
      if (ans === q.correctIndex) typeMap[type].correct++;
    }
  });

  /* ---------- WEAK PRIORITIES ---------- */

  const weakTypes = Object.entries(typeMap)
    .map(([type, v]) => ({
      type,
      accuracy:
        v.attempted > 0 ? v.correct / v.attempted : 0,
      attempted: v.attempted,
    }))
    .filter(
      (t) => t.attempted >= 2 && t.accuracy < 0.5
    )
    .slice(0, 3);

  /* ---------- UI ---------- */

  return (
    <div
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 12,
          padding: 28,
        }}
      >
        <h1 style={{ marginBottom: 6 }}>RC Diagnosis Report</h1>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          CAT-style diagnosis focused on selection quality, not guesswork.
        </p>

        {/* SUMMARY */}
        <Grid4>
          <Stat label="Score" value={`${correct} / ${totalQuestions}`} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Incorrect" value={incorrect} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </Grid4>

        {/* PASSAGE STRATEGY */}
        <Section title="Passage Selection Intelligence">
          {passageStats.length === 0 && (
            <Muted>No passage data available.</Muted>
          )}
          {passageStats.map((p, i) => (
            <Row
              key={i}
              left={`${p.genre} (${p.correct}/${p.attempted || 0})`}
              right={p.tag}
              color={tagColor(p.tag)}
            />
          ))}
        </Section>

        {/* QUESTION TYPE */}
        <Section title="Question-Type Accuracy Map">
          {Object.entries(typeMap).map(([type, v]) => {
            const acc =
              v.attempted > 0 ? v.correct / v.attempted : 0;

            let label = "Avoid Guessing";
            if (acc >= 0.7) label = "Strength";
            else if (acc >= 0.5) label = "Needs Work";

            return (
              <Row
                key={type}
                left={`${type} (${v.correct}/${v.attempted || 0})`}
                right={label}
                color={tagColor(label)}
              />
            );
          })}
        </Section>

        {/* NEXT ACTIONS */}
        <Section title="Next 7-Day Fix Plan">
          {weakTypes.length === 0 ? (
            <Muted>✅ No critical weaknesses detected.</Muted>
          ) : (
            weakTypes.map((w) => (
              <p key={w.type}>
                • Fix <b>{w.type}</b> (accuracy{" "}
                {Math.round(w.accuracy * 100)}%)
              </p>
            ))
          )}
        </Section>

        {/* RULES */}
        <Section title="CAT RC Rules (Until Accuracy ≥ 60%)">
          <ul>
            <li>Attempt max 2 passages per sectional.</li>
            <li>Do not guess in weak question types.</li>
            <li>Review only incorrect attempted questions.</li>
            <li>Volume increases only after accuracy improves.</li>
          </ul>
        </Section>

        <button
          onClick={onReview}
          style={{
            marginTop: 20,
            padding: "10px 18px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Review Questions
        </button>
      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Grid4({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 32,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        padding: 16,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 13, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ left, right, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <span>{left}</span>
      <span style={{ color, fontWeight: 500 }}>{right}</span>
    </div>
  );
}

function Muted({ children }) {
  return <p style={{ color: "#6b7280" }}>{children}</p>;
}

function tagColor(tag) {
  if (tag === "Strength") return "#16a34a";
  if (tag === "Needs Work") return "#d97706";
  if (tag === "Selective Attempt") return "#2563eb";
  return "#dc2626";
}
