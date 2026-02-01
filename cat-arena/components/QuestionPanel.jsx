"use client";

export default function QuestionPanel({
  question,
  qNumber,
  selectedOption,
  onAnswer,
  onMark,
  onClear,
  onNext,
  onPrev,
}) {
  if (!question) return null;

  return (
    <div style={{ padding: "8px 16px" }}>
      {/* Question No */}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Question No. {qNumber}
      </div>

      {/* Question Text */}
      <div style={{ marginBottom: 16, lineHeight: 1.6 }}>
        {question.question}
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => (
          <label
            key={idx}
            style={{
              display: "flex",
              gap: 10,
              padding: "8px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name={`q-${qNumber}`}
              checked={selectedOption === idx}
              onChange={() => onAnswer(idx)}
            />
            <span>
              <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
            </span>
          </label>
        ))}
      </div>
   
    </div>
  );
}
