"use client";

import { useEffect, useState } from "react";

export default function MobileRCSectional({
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

  /* ================= TIMER ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onSubmit();
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
                  onClick={() => onSelectOption(i)}
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
     <div className="rc-palette">
  <button className="secondary" onClick={onClear}>
    Clear
  </button>

  <button className="secondary" onClick={onMark}>
    Mark
  </button>

  <button
    className="secondary"
    onClick={() =>
      currentQuestionIndex > 0 && onJump(currentQuestionIndex - 1)
    }
  >
    Previous
  </button>

  <button className="primary" onClick={onNext}>
    Save & Next
  </button>

  <button className="danger" onClick={onSubmit}>
    Submit
  </button>
</div>
    </div>
  );
}
