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

  // ✅ SAFELY RESOLVE QUESTION TEXT
  const questionText =
    question.questionText ||
    question.stem ||
    question.question ||
    question.text ||
    "";

  return (
    <div style={{ padding: "8px 16px" }}>
      {/* ===== QUESTION NUMBER ===== */}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Question No. {qNumber}
      </div>

      {/* ===== QUESTION TEXT ===== */}
      <div
        style={{
          marginBottom: 16,
          lineHeight: 1.6,
          color: "#111827",
          fontSize: 15,
        }}
      >
        {questionText}
      </div>

      {/* ===== OPTIONS ===== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => (
          <label
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              cursor: "pointer",
              background: "#fff",
            }}
          >
            <input
              type="radio"
              name={`q-${qNumber}`}
              onChange={() => onAnswer(idx)}
            />
            <span>
              <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
            </span>
          </label>
        ))}
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onMark}>Mark for Review</button>
        <button onClick={onPrev}>Previous</button>
        <button onClick={onNext}>Save & Next</button>
      </div>
    </div>
  );
}
