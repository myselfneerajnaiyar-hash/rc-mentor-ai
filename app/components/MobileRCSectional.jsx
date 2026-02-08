"use client";

import { useEffect, useState } from "react";
import QuestionPanel from "../../cat-arena/components/QuestionPanel";

export default function MobileRCSectional({
  passage,
  question,
  selectedOption,

  durationSeconds,
  currentQuestionIndex,

  onSelectOption,
  onNext,
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
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="rc-mobile-root">

      {/* HEADER */}
      <div className="rc-header">
        <span>CAT RC Sectional</span>
        <span className="rc-timer">{mins}:{secs}</span>
      </div>

      {/* SCROLL AREA */}
      <div style={{ padding: 16, overflowY: "auto" }}>

        {/* PASSAGE — SIMPLE & SAFE */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
            {passage}
          </p>
        </section>

        {/* QUESTION — REUSE DESKTOP LOGIC */}
        <section className="rc-question" style={{ marginTop: 24 }}>
          <QuestionPanel
            question={question}
            qNumber={currentQuestionIndex + 1}
            selectedOption={selectedOption}
            mode="test"
            onAnswer={onSelectOption}
            onNext={onNext}
            onPrev={() => {}}
          />
        </section>

      </div>

      {/* ACTION BAR */}
      <div className="rc-palette">
        <button className="primary" onClick={onNext}>Next</button>
        <button className="danger" onClick={onSubmit}>Submit</button>
      </div>
    </div>
  );
}
