"use client";

import { useEffect, useState } from "react";
import SubmitModal from "../../cat-arena/components/SubmitModal";

export default function MobileRCSectional({
  mode = "test",
  passage,
  question,
  selectedOption,

  durationSeconds,
  currentQuestionIndex,
  totalQuestions,
  questionStates,

  onSelectOption,
  onNext,
  onMark,
  onClear,
  onJump,
  onSubmit,
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [showSubmit, setShowSubmit] = useState(false);
  const isReview = mode === "review";
  

  /* ================= TIMER ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSubmit]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  function getPaletteColor(state) {
    if (state === 1) return "#22c55e"; // answered
    if (state === 2) return "#3b82f6"; // marked
    if (state === 3) return "#7c3aed"; // answered + marked
    return "#e5e7eb"; // unvisited
  }

  /* ================= RENDER ================= */
  return (
    <div
  className="rc-mobile-root"
  style={{ position: "relative", zIndex: 0 }}
>
      {/* HEADER */}
      <div className="rc-header">
        <div
  style={{
    padding: "4px 12px",
    fontSize: 11,
    color: "#374151",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  }}
>
  <strong>Mark:</strong> Review later &nbsp;|&nbsp;
  <strong>Clear:</strong> Remove selected answer
</div>
        <span>CAT RC Sectional</span>
        <span className="rc-timer">{mins}:{secs}</span>
      </div>

      {/* SCROLL AREA */}
      <div className="rc-content">

        {/* PASSAGE */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p style={{ whiteSpace: "pre-line" }}>{passage}</p>
        </section>

        {/* QUESTION */}
        <section className="rc-question">
          <h4>Question No. {currentQuestionIndex + 1}</h4>
          <p
  style={{
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 1.5,
  }}
>
 {
  question?.questionText ||
  question?.stem ||
  question?.prompt ||
  question?.text ||
  question?.question
}
</p>

          <div className="rc-options">
            {question?.options?.map((opt, i) => {
              const selected = selectedOption === i;

              return (
               <button
  key={i}
  className="rc-option"
  disabled={isReview}
  onClick={() => !isReview && onSelectOption(i)}
                  style={{
                    background: selected ? "#eff6ff" : "#ffffff",
                    border: selected
                      ? "2px solid #2563eb"
                      : "1px solid #d1d5db",
                  }}
                >
                  <strong>{String.fromCharCode(65 + i)}.</strong>{" "}
                  {opt}
                </button>
              );
            })}
          </div>
        </section>

        {/* QUESTION PALETTE */}
        <div className="rc-question-palette">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Questions
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 8,
            }}
          >
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const state = questionStates[idx];

              return (
                <button
                  key={idx}
                  onClick={() => onJump(idx)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 6,
                    background: getPaletteColor(state),
                    border:
                      currentQuestionIndex === idx
                        ? "2px solid #111827"
                        : "1px solid #d1d5db",
                    color: state === 0 ? "#111827" : "#ffffff",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    {/* ACTION BAR */}
      <div
        className="rc-palette"
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 12px",
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <button
       
 onClick={() => !isReview && onClear()}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
          }}
        >
          Clear
        </button>

        <button
        
onClick={() => !isReview && onMark()}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
          }}
        >
          Mark
        </button>

        <button
          onClick={() =>
            currentQuestionIndex > 0 &&
            onJump(currentQuestionIndex - 1)
          }
          disabled={currentQuestionIndex === 0}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
          }}
        >
          Previous
        </button>

        <button
          onClick={onNext}
          style={{
            flex: 1.4,
            padding: "12px",
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 10,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
          }}
        >
          Save & Next
        </button>
      </div>

      {/* SUBMIT BAR (ALWAYS VISIBLE) */}
      {!isReview && (
      <div
        style={{
          padding: "10px 12px",
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
       <button
  onClick={() => setShowSubmit(true)}
  style={{
    width: "100%",
    padding: "14px",
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 10,
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
  }}
>
  Submit Test
</button>
      </div>
  }}
    <SubmitModal
        open={showSubmit}
        onCancel={() => setShowSubmit(false)}
        onConfirm={() => {
          setShowSubmit(false);
          onSubmit();
        }}
      />
    </div>
  );
}
