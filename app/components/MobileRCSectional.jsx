"use client";

import { useEffect, useState } from "react";
import QuestionPanel from "../cat-arena/components/QuestionPanel"; 
// ⬆️ adjust path ONLY if needed

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

  /* ⏱ TIMER */
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
  const secs = String(secondsLeft % 60)).padStart(2, "0");

  function getPaletteColor(state) {
    if (state === 1) return "#22c55e"; // answered
    if (state === 2) return "#3b82f6"; // marked
    if (state === 3) return "#7c3aed"; // answered + marked
    return "#e5e7eb";
  }

  return (
    <div className="rc-mobile-root">

      {/* HEADER */}
      <div className="rc-header">
        <span>CAT RC Sectional</span>
        <span className="rc-timer">
          {mins}:{secs}
        </span>
      </div>

      {/* CONTENT */}
      <div className="rc-content">

        {/* PASSAGE */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p>{passage}</p>
        </section>

        {/* QUESTION — DESKTOP COMPONENT REUSED */}
        <section className="rc-question">
          <QuestionPanel
            question={question}
            qNumber={currentQuestionIndex + 1}
            selectedOption={selectedOption}
            correctIndex={null}
            mode="test"
            onAnswer={onSelectOption}
            onPrev={() => {}}
            onNext={onNext}
          />
        </section>

        {/* QUESTION PALETTE */}
        <div style={{ marginTop: 20 }}>
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
                        : "none",
                    color: state === 0 ? "#111827" : "#fff",
                    fontSize: 12,
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
        <button className="secondary" onClick={onClear}>Clear</button>
        <button className="secondary" onClick={onMark}>Mark</button>
        <button className="primary" onClick={onNext}>Next</button>
        <button className="danger" onClick={onSubmit}>Submit</button>
      </div>
    </div>
  );
}
