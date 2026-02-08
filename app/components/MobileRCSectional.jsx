"use client";

import { useEffect, useState } from "react";

export default function MobileRCSectional({
  passage,
  question,
  options = [],
  durationSeconds = 1800,

  currentQuestionIndex = 0,
  totalQuestions = 0,
  questionStates = [],

  onSelectOption,
  onNext,
  onMark,
  onClear,
  onJump,
  onSubmit,
}) {
  /* ================= TIMER ================= */
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onSubmit?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  /* ================= COLOR HELPER ================= */
  function getColor(state) {
    if (state === 1) return "#22c55e"; // answered
    if (state === 2) return "#3b82f6"; // marked
    if (state === 3) return "#7c3aed"; // answered + marked
    return "#e5e7eb"; // not visited
  }

  return (
    <div className="rc-mobile-root">

      {/* ================= HEADER ================= */}
      <div className="rc-header">
        <span style={{ fontWeight: 600 }}>CAT RC Sectional</span>
        <span className="rc-timer">{mins}:{secs}</span>
      </div>

      {/* ================= SCROLLABLE CONTENT ================= */}
      <div className="rc-content">

        {/* PASSAGE */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p>{passage}</p>
        </section>

        {/* QUESTION */}
        <section className="rc-question">
          <h4>
            {typeof question === "string"
              ? question
              : question?.text}
          </h4>

          <div className="rc-options">
            {options.map((opt, i) => (
              <button
                key={i}
                className="rc-option"
                onClick={() => onSelectOption?.(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        {/* ================= QUESTION PALETTE ================= */}
        {totalQuestions > 0 && (
          <div style={{ marginTop: 16 }}>
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
              {Array.from({ length: totalQuestions }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onJump?.(idx)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 6,
                    background: getColor(questionStates[idx]),
                    border:
                      currentQuestionIndex === idx
                        ? "2px solid #111827"
                        : "none",
                    color:
                      questionStates[idx] === 0
                        ? "#111827"
                        : "#fff",
                    fontSize: 12,
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ================= FIXED ACTION BAR ================= */}
      <div className="rc-palette">
        <button className="secondary" onClick={onClear}>
          Clear
        </button>
        <button className="secondary" onClick={onMark}>
          Mark
        </button>
        <button className="primary" onClick={onNext}>
          Next
        </button>
        <button className="danger" onClick={onSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
