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
        borderRight: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      {/* ===== REVIEW MODE: PASSAGE PERFORMANCE ===== */}
      {mode === "review" && stats && (
        <div
          style={{
            marginBottom: 12,
            fontSize: 13,
            color: "#374151",
            background: "#f9fafb",
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
          color: "#374151",
        }}
      >
        {passage.text}
      </div>
    </div>
  );
}
