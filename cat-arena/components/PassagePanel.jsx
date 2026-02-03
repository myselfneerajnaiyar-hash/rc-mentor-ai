"use client";

export default function QuestionPanel({
  question,
  qNumber,
  selectedOption,
  correctIndex,
  onAnswer,
  onNext,
  onPrev,
  mode,
}) {
  if (!question) return null;

  return (
    <div style={{ padding: "8px 16px" }}>
      {/* Question Number */}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Question No. {qNumber}
      </div>

      {/* Question Text */}
      <div style={{ marginBottom: 16, lineHeight: 1.6 }}>
        {question.stem}
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt, idx) => {
          const isCorrect = idx === correctIndex;
          const isSelected = selectedOption === idx;

          return (
            <label
              key={idx}
              style={{
                display: "flex",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 4,
                cursor: mode === "review" ? "default" : "pointer",
                border:
                  mode === "review"
                    ? isCorrect
                      ? "2px solid #16a34a"
                      : isSelected
                      ? "2px solid #dc2626"
                      : "1px solid #d1d5db"
                    : "1px solid #d1d5db",
                background:
                  mode === "review"
                    ? isCorrect
                      ? "#dcfce7"
                      : isSelected
                      ? "#fee2e2"
                      : "#fff"
                    : "#fff",
              }}
            >
              <input
                type="radio"
                name={`question-${qNumber}`}
                checked={isSelected}
                disabled={mode === "review"}
                onChange={() => onAnswer(idx)}
              />

              <span>
                <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
              </span>
            </label>
          );
        })}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onPrev}
          style={{
            padding: "6px 12px",
            border: "1px solid #9ca3af",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Previous
        </button>

        <button
          onClick={onNext}
          style={{
            padding: "6px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
