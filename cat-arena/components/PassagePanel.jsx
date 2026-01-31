"use client";

export default function PassagePanel({
  passages,
  currentQuestionIndex,
}) {
  if (!passages || passages.length === 0) return null;

  // CAT LOGIC: 4 questions per passage
  const passageIndex = Math.floor(currentQuestionIndex / 4);
  const passage = passages[passageIndex];

  if (!passage) return null;

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        overflowY: "auto",
        padding: 16,
        borderRight: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <h3
        style={{
          marginBottom: 12,
          fontWeight: 700,
          color: "#1f2937",
        }}
      >
        {passage.title}
      </h3>

      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
          fontSize: 15,
          color: "#374151",
        }}
      >
        {passage.text}
      </div>
    </div>
  );
}
