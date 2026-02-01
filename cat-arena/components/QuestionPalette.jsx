"use client";

export default function QuestionPalette({
  totalQuestions,
  currentQuestion,
  questionStates,
  onJump,
}) {
  function getColor(state) {
    if (state === 1) return "#22c55e"; // answered
    if (state === 2) return "#3b82f6"; // marked
    if (state === 3) return "#7c3aed"; // answered + marked
    return "#e5e7eb"; // not visited
  }

  return (
    <div
      style={{
        padding: 16,
        borderLeft: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 13, marginBottom: 12 }}>
        <div>🟢 Answered</div>
        <div>🔵 Marked for Review</div>
        <div>⚪ Not Answered</div>
        <div>🟣 Answered & Marked</div>
      </div>

      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Choose a Question
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onJump(idx)}
            style={{
              padding: "8px 0",
              borderRadius: 6,
              background: getColor(questionStates[idx]),
              border:
                currentQuestion === idx
                  ? "2px solid #111827"
                  : "none",
              color:
                questionStates[idx] === 0 ? "#111827" : "white",
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
