"use client";

import { useState } from "react";

export default function QuestionPanel({
  question,
  qNumber,
  selectedOption,
  onAnswer,
  onNext,
  onPrev,
  mode,
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!question) return null;

  return (
    <div style={{ padding: "8px 16px" }}>
      {/* Question No */}
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
          const isCorrect = idx === question.correctIndex;
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
                name="option"
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

      {/* View Explanation Button */}
      {mode === "review" && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowExplanation(v => !v)}
            style={{
              padding: "6px 12px",
              border: "1px solid #2563eb",
              background: "#fff",
              color: "#2563eb",
              cursor: "pointer",
            }}
          >
            {showExplanation ? "Hide Explanation" : "View Explanation"}
          </button>
        </div>
      )}

      {/* Explanation Box */}
      {mode === "review" && showExplanation && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f8fafc",
            border: "1px solid #cbd5f5",
            borderRadius: 4,
            lineHeight: 1.6,
            color: "#1f2937",
          }}
        >
          <strong>Explanation:</strong>
          <div style={{ marginTop: 6 }}>
            {question.explanation}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 24,
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
            background: "#16a34a",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save & Next
        </button>
      </div>
    </div>
  );
}
