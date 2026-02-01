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
      <div style={{ marginBottom: 12 }}>
        <strong>Question No. {qNumber}</strong>
      </div>

      <div style={{ marginBottom: 16 }}>
        {question.stem}
      </div>

      {question.options.map((opt, idx) => (
        <label
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name={`q-${qNumber}`}
            onChange={() => onAnswer(idx)}
            style={{ marginRight: 8 }}
          />
          {opt}
        </label>
      ))}

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={onMark}>Mark for Review</button>
        <button onClick={onPrev}>Previous</button>
        <button onClick={onNext}>Save & Next</button>
      </div>
    </div>
  );
}
