"use client";

export default function DiagnosisView({
  passages,
  answers,
  QUESTIONS_PER_PASSAGE,
  score,
  passageStats,
  byQuestionType,
  attempted,
  unattempted,
  onReview,
}) {
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;
  const accuracy = attempted ? Math.round((score / attempted) * 100) : 0;
  const marks = score * 3 - (attempted - score);

  function passageTag(acc) {
    if (acc >= 75) return ["Strength", "#dcfce7", "#166534"];
    if (acc >= 40) return ["Risk Zone", "#fef3c7", "#92400e"];
    return ["Weak Area", "#fee2e2", "#991b1b"];
  }

  function typeTag(correct, total) {
    const acc = total ? correct / total : 0;
    if (acc >= 0.75) return ["Strong", "#dcfce7", "#166534"];
    if (acc >= 0.45) return ["Needs Work", "#fef3c7", "#92400e"];
    return ["Weak", "#fee2e2", "#991b1b"];
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 16px" }}>
      <h1>RC Diagnosis Report</h1>
      <p style={{ color: "#475569", marginBottom: 24 }}>
        This analysis focuses on patterns, not isolated mistakes.
      </p>

      {/* OVERALL */}
      <Section title="Overall Snapshot">
        <Grid>
          <Stat label="Score" value={`${score} / ${totalQuestions}`} />
          <Stat label="CAT Marks" value={marks} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Unattempted" value={unattempted} />
        </Grid>
      </Section>

      {/* PASSAGE */}
      <Section title="Passage-wise Performance">
        {passageStats.map((p, i) => {
          const acc = Math.round((p.correct / p.total) * 100);
          const [text, bg, color] = passageTag(acc);

          return (
            <Row key={i}>
              <div>
                <strong>{p.genre}</strong>
                <div style={muted}>
                  {p.correct} / {p.total} correct
                </div>
              </div>

              <Tag text={text} bg={bg} color={color} />
            </Row>
          );
        })}
      </Section>

      {/* QUESTION TYPE */}
      <Section title="Question-Type Skill Map">
        {Object.entries(byQuestionType).map(([type, v]) => {
          const [text, bg, color] = typeTag(v.correct, v.total);
          const acc = Math.round((v.correct / v.total) * 100);

          return (
            <Row key={type}>
              <div>
                <strong>{type}</strong>
                <div style={muted}>
                  {v.correct} / {v.total} correct ({acc}%)
                </div>
              </div>

              <Tag text={text} bg={bg} color={color} />
            </Row>
          );
        })}
      </Section>

      {/* ACTION */}
      <Section title="Actionable Next Steps">
        <ul style={{ lineHeight: 1.8 }}>
          <li>Fix weak question types before increasing RC volume.</li>
          <li>Avoid low-accuracy passages during real CAT attempts.</li>
          <li>Focus on elimination logic rather than option spotting.</li>
          <li>Review explanations to correct thinking patterns.</li>
        </ul>
      </Section>

      <div style={{ marginTop: 32 }}>
        <button style={primaryBtn} onClick={onReview}>
          Review Questions
        </button>
      </div>
    </div>
  );
}

/* REUSABLE COMPONENTS */

function Section({ title, children }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 16,
        marginTop: 16,
      }}
    >
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px dashed #e5e7eb",
      }}
    >
      {children}
    </div>
  );
}

function Tag({ text, bg, color }) {
  return (
    <div
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {text}
    </div>
  );
}

/* STYLES */

const card = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 20,
  marginBottom: 24,
};

const muted = {
  fontSize: 13,
  color: "#64748b",
};

const primaryBtn = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
