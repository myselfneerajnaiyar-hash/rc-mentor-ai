"use client";

import { useEffect, useState } from "react";

export default function MobileRCSectional({
  passage,
  question,
  options,
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
          onSubmit();
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
        <span className="rc-timer">{mins}:{secs}</span>
      </div>

      {/* CONTENT */}
      <div className="rc-content">

        {/* PASSAGE */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p>{passage}</p>
        </section>

        {/* QUESTION */}
        <section className="rc-question">
          <h4>{question?.question}</h4>

          <div className="rc-options">
            {options.map((opt, i) => {
              const isSelected = selectedOption === i;

              return (
                <button
                  key={i}
                  className="rc-option"
                  onClick={() => onSelectOption(i)}
                  style={{
                    background: isSelected ? "#2563eb" : "#f9fafb",
                    color: isSelected ? "#fff" : "#111827",
                    border: isSelected
                      ? "2px solid #1e40af"
                      : "1px solid #e5e7eb",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
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
