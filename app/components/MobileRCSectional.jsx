"use client";

import { useEffect, useState } from "react";
import QuestionPanel from "../../cat-arena/components/QuestionPanel";

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

  function getPaletteColor(state) {
    if (state === 1) return "#22c55e"; // answered
    if (state === 2) return "#3b82f6"; // marked
    if (state === 3) return "#7c3aed"; // answered + marked
    return "#e5e7eb"; // unvisited
  }

  return (
    <div className="rc-mobile-root">

      {/* HEADER */}
      <div className="rc-header">
        <span>CAT RC Sectional</span>
        <span className="rc-timer">{mins}:{secs}</span>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ padding: 16, paddingBottom: 120 }}>

        {/* PASSAGE */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
            {passage}
          </p>
        </section>

        
       {/* QUESTION */}
<section style={{ marginTop: 24 }}>
  <h4 style={{ marginBottom: 12 }}>
    Question No. {currentQuestionIndex + 1}
  </h4>

  <div>
    {question?.options?.map((opt, i) => {
      const selected = selectedOption === i;

      return (
        <div
          key={i}
          onClick={() => onSelectOption(i)}
          style={{
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
            border: selected
              ? "2px solid #2563eb"
              : "1px solid #d1d5db",
            background: selected ? "#eff6ff" : "#fff",
            cursor: "pointer",
          }}
        >
          <strong>{String.fromCharCode(65 + i)}.</strong>{" "}
          {opt}
        </div>
      );
    })}
  </div>
</section>
        {/* QUESTION PALETTE */}
        <div style={{ marginTop: 24 }}>
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
      <div
        style={{
          position: "fixed",
          bottom: 56,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          gap: 8,
          padding: "0 8px",
          alignItems: "center",
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          zIndex: 9999,
        }}
      >
        <button onClick={onClear} style={btnGhost}>Clear</button>
        <button onClick={onMark} style={btnGhost}>Mark</button>
        <button onClick={onNext} style={btnPrimary}>Next</button>
        <button onClick={onSubmit} style={btnDanger}>Submit</button>
      </div>
    </div>
  );
}

/* ---------- BUTTON STYLES ---------- */

const btnPrimary = {
  flex: 1,
  height: 40,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};

const btnGhost = {
  flex: 1,
  height: 40,
  background: "#f9fafb",
  border: "1px solid #d1d5db",
  borderRadius: 6,
};

const btnDanger = {
  flex: 1,
  height: 40,
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 6,
};
