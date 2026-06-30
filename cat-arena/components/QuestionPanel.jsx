"use client";

import { useState } from "react";

const optionLabel = idx => String.fromCharCode(65 + idx); // A, B, C, D

const keyStyle = {
  height: 52,
  border: "1px solid #334155",
  borderRadius: 8,
  background: "#1f2937",
  color: "#fff",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
};

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
  const [showExplanation, setShowExplanation] = useState(false);

  if (!question) return null;
  console.log("QUESTION", question);

  const type =
  question.questionType;

const options =
  question.options ||
  question.payload?.options ||
  [];

const sentences =
  question.sentences ||
  question.payload?.sentences ||
  [];

const paragraph =
  question.paragraph ||
  question.payload?.paragraph ||
  "";



  return (
    <div style={{ padding: "8px 16px", color: "#e5e7eb" }}>
      {/* ================= QUESTION HEADER ================= */}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Question No. {qNumber}
      </div>

      {/* ================= QUESTION TEXT ================= */}
      <div style={{ marginBottom: 16, lineHeight: 1.6 }}>
        {question.questionText || question.stem}
      </div>

      {sentences.length > 0 && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 20,
    }}
  >
    {sentences.map((sentence, idx) => (
      <div
        key={idx}
        style={{
          padding: 12,
          border: "1px solid #334155",
          borderRadius: 6,
          background: "#1f2937",
          lineHeight: 1.6,
        }}
      >
        <strong>{idx + 1}.</strong> {sentence}
      </div>
    ))}
  </div>
)}

      {/* ================= OPTIONS ================= */}
    
{/* ===== SENTENCE PLACEMENT ===== */}

{paragraph && (

  <div
    style={{
      marginBottom: 16,
      lineHeight: 1.7
    }}
  >
    {paragraph}
  </div>

)}


    

{options.length > 0 && (

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}
  >

    {options.map((opt, idx) => {

      const isCorrect =
        idx === correctIndex;

      const isSelected =
        selectedOption === idx;

      return (

        <label
          key={idx}
          style={{
            display: "flex",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 6,
            cursor:
              mode === "review"
                ? "default"
                : "pointer",
            border: "1px solid #334155",
            background: "#1f2937"
          }}
        >

        <input
  type="radio"
  name={`question-${qNumber}`}
  checked={selectedOption === idx}
  disabled={mode === "review"}
  onChange={() => onAnswer(idx)}
/>
          <span>
            <strong>
              {optionLabel(idx)}.
            </strong>{" "}
            {opt}
          </span>

        </label>

      );

    })}

  </div>

)}



 {options.length === 0 && (
  <div
    style={{
      marginTop: 12,
      maxWidth: 420,
    }}
  >
    <div
      style={{
        marginBottom: 8,
        color: "#94a3b8",
        fontSize: 13,
      }}
    >
      Type In The Answer (TITA)
    </div>

    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={mode === "review"}
      value={selectedOption ?? ""}
      onChange={(e) =>
        onAnswer(
          e.target.value.replace(/[^0-9-]/g, "")
        )
      }
      style={{
        width: "100%",
        height: 52,
        padding: "0 14px",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 2,
        textAlign: "center",
        background: "#ffffff",
        color: "#111827",
        border: "2px solid #2563eb",
        borderRadius: 8,
        outline: "none",
      }}
    />

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 8,
        marginTop: 14,
      }}
    >
      {[1,2,3,4,5,6,7,8,9].map((n)=>(
        <button
          key={n}
          disabled={mode==="review"}
          onClick={()=>
            onAnswer(
              `${selectedOption ?? ""}${n}`
            )
          }
          style={keyStyle}
        >
          {n}
        </button>
      ))}

      <button
        disabled={mode==="review"}
        onClick={()=>
          onAnswer(
            `${selectedOption ?? ""}0`
          )
        }
        style={keyStyle}
      >
        0
      </button>

      <button
        disabled={mode==="review"}
        onClick={()=>
          onAnswer(
            String(selectedOption ?? "").slice(0,-1)
          )
        }
        style={{
          ...keyStyle,
          background:"#dc2626",
          color:"#fff",
        }}
      >
        ⌫
      </button>

      <button
        disabled={mode==="review"}
        onClick={() => onAnswer("")}
        style={{
          ...keyStyle,
          background:"#334155",
          color:"#fff",
        }}
      >
        Clear
      </button>
    </div>
  </div>
)}
      {/* ================= REVIEW SUMMARY ================= */}
      {mode === "review" && (
        <div
          style={{
            marginTop: 16,
            padding: 10,
            background: "#1f2937",
            border: "1px solid #334155",
            borderRadius: 4,
            fontSize: 14,
            color: "#e5e7eb",
          }}
        >
         {options.length > 0 ? (
  <>
    <div>
      <strong>Your Answer:</strong>{" "}
      {selectedOption == null
        ? "Not Attempted"
        : optionLabel(selectedOption)}
    </div>

    <div>
      <strong>Correct Answer:</strong>{" "}
      {optionLabel(correctIndex)}
    </div>
  </>
) : (
  <>
    <div>
      <strong>Your Answer:</strong>{" "}
      {selectedOption || "Not Attempted"}
    </div>

    <div>
      <strong>Correct Answer:</strong>{" "}
      {question.correctAnswer}
    </div>
  </>
)}

          <div>
            <strong>Question Type:</strong>{" "}
            {question.type || "—"}
          </div>
        </div>
      )}

      {/* ================= EXPLANATION TOGGLE ================= */}
      {mode === "review" && (
        <div style={{ marginTop: 14 }}>
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

      {/* ================= EXPLANATION BOX ================= */}
      {mode === "review" && showExplanation && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 4,
            lineHeight: 1.65,
            color: "#e5e7eb",
          }}
        >
          <strong>Explanation:</strong>
          <div style={{ marginTop: 6 }}>
            {question.explanation
              ?.replace(/Option\s+0/g, "Option A")
              ?.replace(/Option\s+1/g, "Option B")
              ?.replace(/Option\s+2/g, "Option C")
              ?.replace(/Option\s+3/g, "Option D")}
          </div>
        </div>
      )}

      {/* ================= NAVIGATION ================= */}
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
            border: "1px solid #334155",
            background: "#1f2937",
            cursor: "pointer",
            color: "#e5e7eb",
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
          {mode === "review" ? "Next" : "Save & Next"}
        </button>
      </div>
    </div>
  );
}
