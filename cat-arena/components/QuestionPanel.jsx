"use client";

export default function QuestionPanel({
  question,
  qIndex,
  selectedOption,
  onSelectOption,
  onSaveNext,
  onMarkForReview,
}) {
  if (!question) return null;

  return (
    <div
      style={{
        padding: 20,
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Question */}
      <div>
        <p
          style={{
            fontWeight: 700,
            marginBottom: 14,
            fontSize: 16,
          }}
        >
          Q{qIndex + 1}. {question.prompt}
        </p>

        {/* Options */}
        {question.options.map((opt, i) => {
          const selected = selectedOption === i;

          return (
            <button
              key={i}
              onClick={() => onSelectOption(i)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                marginBottom: 10,
                borderRadius: 6,
                border: selected
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
                background: selected ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
                fontWeight: selected ? 600 : 500,
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
          borderTop: "1px solid #e5e7eb",
          paddingTop: 12,
        }}
      >
        <button
          onClick={onMarkForReview}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "1px solid #7c3aed",
            background: "#f5f3ff",
            color: "#5b21b6",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Mark for Review
        </button>

        <button
          onClick={onSaveNext}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save & Next
        </button>
      </div>
    </div>
  );
}
