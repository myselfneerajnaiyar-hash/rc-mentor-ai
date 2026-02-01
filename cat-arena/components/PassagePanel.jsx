"use client";

export default function PassagePanel({
  passages,
  currentQuestionIndex,
}) {
  if (!passages || passages.length === 0) return null;

  // ✅ CAT RULE: 4 questions per passage
  const passageIndex = Math.floor(currentQuestionIndex / 4);
  const passage = passages[passageIndex];

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
      {/* ===== PASSAGE TITLE ===== */}
      <div
        style={{
          fontWeight: 700,
          marginBottom: 12,
          color: "#111827",
        }}
      >
        {passage.title}
      </div>

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
