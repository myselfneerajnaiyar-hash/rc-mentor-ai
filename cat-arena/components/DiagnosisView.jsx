"use client";

export default function DiagnosisView({
  passages = [],
  answers = [],
  questions = [],
  onReview,
}) {
  // ---------- SAFE COUNTS ----------
  const totalQuestions = questions.length || 0;

  let attempted = 0;
  let correct = 0;

  questions.forEach((q, i) => {
    if (answers[i] !== undefined && answers[i] !== null) {
      attempted++;
      if (answers[i] === q.correctIndex) correct++;
    }
  });

  const incorrect = attempted - correct;
  const accuracy =
    attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  // ---------- PASSAGE WISE ----------
  const passageStats = passages.map((p) => {
    let total = p.questions?.length || 0;
    let correctP = 0;

    p.questions?.forEach((q) => {
      const idx = questions.findIndex((x) => x.id === q.id);
      if (idx >= 0 && answers[idx] === q.correctIndex) correctP++;
    });

    let tag = "Avoid in CAT";
    if (total > 0 && correctP / total >= 0.6) tag = "Selective Attempt";
    if (total > 0 && correctP / total >= 0.8) tag = "Strength";

    return {
      genre: p.genre || "Unknown",
      correct: correctP,
      total,
      tag,
    };
  });

  // ---------- QUESTION TYPE ----------
  const typeMap = {};
  questions.forEach((q, i) => {
    const type = q.type || "Unknown";
    if (!typeMap[type]) typeMap[type] = { correct: 0, total: 0 };
    typeMap[type].total++;
    if (answers[i] === q.correctIndex) typeMap[type].correct++;
  });

  const weakTypes = Object.entries(typeMap)
    .filter(([_, v]) => v.total > 0 && v.correct / v.total < 0.5)
    .slice(0, 3);

  // ---------- UI ----------
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
          Focuses on decision patterns, not isolated mistakes.
        </p>

        {/* SUMMARY */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Stat label="Score" value={`${correct} / ${totalQuestions}`} />
          <Stat label="Incorrect Attempts" value={incorrect} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {/* COMPARISON PLACEHOLDER */}
        <div
          style={{
            background: "#eef2ff",
            padding: 14,
            borderRadius: 8,
            marginBottom: 28,
            fontSize: 14,
          }}
        >
          📊 Comparison with last RC sectional will unlock after your next test.
        </div>

        {/* PASSAGE STRATEGY */}
        <Section title="Passage-wise CAT Strategy">
          {passageStats.length === 0 && (
            <Muted>No passage data available.</Muted>
          )}
          {passageStats.map((p, i) => (
            <Row
              key={i}
              left={`${p.genre} (${p.correct}/${p.total})`}
              right={p.tag}
              color={tagColor(p.tag)}
            />
          ))}
        </Section>

        {/* QUESTION TYPE */}
        <Section title="Question-Type Skill Map">
          {Object.keys(typeMap).length === 0 && (
            <Muted>No question-type data available.</Muted>
          )}
          {Object.entries(typeMap).map(([type, v]) => {
            const ratio = v.total ? v.correct / v.total : 0;
            let label = "Weak Area";
            if (ratio >= 0.7) label = "Strength";
            else if (ratio >= 0.5) label = "Needs Work";

            return (
              <Row
                key={type}
                left={`${type} (${v.correct}/${v.total})`}
                right={label}
                color={tagColor(label)}
              />
            );
          })}
        </Section>

        {/* NEXT 7 DAYS */}
        <Section title="Top Priority Fixes (Next 7 Days)">
          {weakTypes.length === 0 ? (
            <Muted>✅ No critical weaknesses detected.</Muted>
          ) : (
            weakTypes.map(([t, v]) => (
              <p key={t}>
                • Fix <b>{t}</b> ({v.correct}/{v.total})
              </p>
            ))
          )}
        </Section>

        {/* ACTION RULES */}
        <Section title="Action Rules (Until Accuracy ≥ 60%)">
          <ul>
            <li>Attempt only 2 passages per RC sectional.</li>
            <li>Skip abstract / unfamiliar tone passages.</li>
            <li>Analyse incorrect attempts only.</li>
            <li>Increase volume only after accuracy ≥ 60%.</li>
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
  return "#dc2626";
}
