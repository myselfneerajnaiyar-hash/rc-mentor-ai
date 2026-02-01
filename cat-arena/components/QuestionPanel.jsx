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
    <div style={{ padding: "12px 16px" }}>
      {/* QUESTION NUMBER */}
      <div
        style={{
          fontWeight: 600,
          marginBottom: 10,
          fontSize: 15,
        }}
      >
        Question No. {qNumber}
      </div>

      {/* QUESTION TEXT — CRITICAL FIX */}
      <div
        style={{
          border: "1px solid #d1d5db",
          padding: "12px",
          marginBottom: 16,
          borderRadius: 4,
          background: "#ffffff",
          lineHeight: 1.6,
          fontSize: 14,
          color: "#111827",
        }}
      >
        {question.stem || question.question || question.text}
      </div>

      {/* OPTIONS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => (
          <label
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              cursor: "pointer",
              background: "#fff",
            }}
          >
            <input
              type="radio"
              name={`q-${qNumber}`}
              onChange={() => onAnswer(idx)}
              style={{ marginTop: 4 }}
            />
            <span>
              <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
            </span>
          </label>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={onMark}>Mark for Review</button>
        <button onClick={onPrev}>Previous</button>
        <button onClick={onNext}>Save & Next</button>
      </div>
    </div>
  );
}
