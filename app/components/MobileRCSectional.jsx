"use client";

import { useEffect, useState } from "react";

export default function MobileRCSectional({
  passage,
  question,
  options,
  timeLeft,
  currentQuestionIndex,
  totalQuestions,
  questionStates,
  onSelectOption,
  onNext,
  onMark,
  onClear,
  onJump,
  onSubmit
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // ⏱ Mobile timer
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
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="rc-mobile-root">

      {/* HEADER */}
      <div className="rc-header">
        <span>CAT RC Sectional</span>
        <span className="rc-timer">{mins}:{secs}</span>
      </div>

      {/* CONTENT */}
      <div className="rc-content">
        <section className="rc-passage">
          <h3>Passage</h3>
          <p>{passage}</p>
        </section>

        <section className="rc-question">
         <h4>{typeof question === "string" ? question : question?.text}</h4>

          <div className="rc-options">
            {options.map((opt, i) => (
              <button
                key={i}
                className="rc-option"
                onClick={() => onSelectOption(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
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
