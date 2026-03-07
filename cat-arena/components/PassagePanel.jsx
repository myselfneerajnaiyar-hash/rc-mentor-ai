"use client";

export default function PassagePanel({
  passages,
  currentQuestionIndex,
  passageStats,
  mode,
}) {
  if (!passages || passages.length === 0) return null;

  // CAT rule: 4 questions per passage
  const QUESTIONS_PER_PASSAGE = 4;
  const passageIndex = Math.floor(currentQuestionIndex / QUESTIONS_PER_PASSAGE);
  const passage = passages[passageIndex];
  const stats = passageStats?.[passageIndex];

  if (!passage) return null;

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        overflowY: "auto",
        padding: "16px 18px",
       background: "#111827",
borderRight: "1px solid #1f2937",
color: "#e5e7eb",
      }}
    >
      {/* ===== REVIEW MODE: PASSAGE PERFORMANCE ===== */}
      {mode === "review" && stats && (
        <div
          style={{
            marginBottom: 12,
            fontSize: 13,
            background: "#1f2937",
            color: "#e5e7eb",
            border: "1px solid #334155",
            padding: "8px 10px",
            borderRadius: 4,
          }}
        >
          <strong>Passage Performance:</strong>{" "}
          {stats.correct} / {stats.total}
        </div>
      )}

      {/* ===== PASSAGE TEXT ===== */}
      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.65,
          fontSize: 15,
          color: "#e5e7eb",
        }}
      >
        {passage.text}
      </div>
    </div>
  );
}
