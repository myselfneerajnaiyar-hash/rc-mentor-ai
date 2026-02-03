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
  const passageIndex = Math.floor(
    currentQuestionIndex / QUESTIONS_PER_PASSAGE
  );

  const passage = passages[passageIndex];
  const stats =
    passageStats && passageStats[passageIndex]
      ? passageStats[passageIndex]
      : null;

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
      {/* ===== PASSAGE PERFORMANCE (REVIEW / DIAGNOSIS ONLY) ===== */}
      {(mode === "review" || mode === "diagnosis") && stats && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            fontSize: 13,
            color: "#374151",
          }}
        >
          <strong>Passage Performance:</strong>{" "}
          {stats.correct} / {stats.total}
          <span style={{ marginLeft: 8, color: "#6b7280" }}>
            ({stats.genre})
          </span>
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
