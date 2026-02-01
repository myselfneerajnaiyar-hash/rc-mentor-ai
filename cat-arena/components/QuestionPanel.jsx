"use client";

export default function QuestionPanel({
  question,
  qNumber,
  onAnswer,
  onMark,
  onNext,
  onPrev,
}) {
  if (!question) return null;

  return (
    <div>
      <h4 style={{ marginBottom: 12 }}>
        Q{qNumber}. {question.stem}
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(idx)}   {/* ✅ FIX */}
            style={{
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button onClick={onMark}>Mark for Review</button>
        <button onClick={onPrev}>Previous</button>
        <button onClick={onNext}>Save & Next</button>
      </div>
    </div>
  );
}
