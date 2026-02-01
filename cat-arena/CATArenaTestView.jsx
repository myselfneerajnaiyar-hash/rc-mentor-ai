"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";
import { sampleRCTest } from "./data/sampleRCTest";

export default function CATArenaTestView() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalQuestions = sampleRCTest.passages.length * 4;

  const [answers, setAnswers] = useState(
    Array(totalQuestions).fill(null)
  );

  // 0 = not visited, 1 = answered, 2 = marked, 3 = answered + marked
  const [questionStates, setQuestionStates] = useState(
    Array(totalQuestions).fill(0)
  );

  // CAT logic: 4 questions per passage
  const passageIndex = Math.floor(currentQuestionIndex / 4);
  const currentPassage = sampleRCTest.passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[currentQuestionIndex % 4];

  function handleAnswer(optionIndex) {
    setAnswers(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] = optionIndex;
      return copy;
    });

    setQuestionStates(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] =
        copy[currentQuestionIndex] === 2 ? 3 : 1;
      return copy;
    });
  }

  function handleMark() {
    setQuestionStates(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] =
        copy[currentQuestionIndex] === 1 ? 3 : 2;
      return copy;
    });
  }

  function handleClear() {
    setAnswers(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] = null;
      return copy;
    });

    setQuestionStates(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] =
        copy[currentQuestionIndex] === 3 ? 2 : 0;
      return copy;
    });
  }

  function handleSubmitTest() {
    setSubmitted(true);
    setShowSubmit(false);
    alert("Test submitted successfully!");
  }

  return (
    <>
      {/* ===== FIXED HEADER ===== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 1000,
        }}
      >
        <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>

        <CATTimer
          durationMinutes={30}
          onTimeUp={() => setShowSubmit(true)}
        />

        <button
          style={{
            border: "1px solid #dc2626",
            color: "#dc2626",
            padding: "6px 12px",
            borderRadius: 4,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Exit Test
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "32% 38% 30%",
          paddingTop: 56,
          paddingBottom: 64,
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT */}
        <PassagePanel
          passages={sampleRCTest.passages}
          currentQuestionIndex={currentQuestionIndex}
        />

        {/* CENTER */}
        <QuestionPanel
          question={currentQuestion}
          qNumber={currentQuestionIndex + 1}
          selectedOption={answers[currentQuestionIndex]}
          onAnswer={handleAnswer}
          onMark={handleMark}
          onClear={handleClear}
          onPrev={() =>
            setCurrentQuestionIndex(i => Math.max(i - 1, 0))
          }
          onNext={() =>
            setCurrentQuestionIndex(i =>
              Math.min(i + 1, totalQuestions - 1)
            )
          }
        />

        {/* RIGHT */}
        <QuestionPalette
          totalQuestions={totalQuestions}
          currentQuestion={currentQuestionIndex}
          questionStates={questionStates}
          onJump={setCurrentQuestionIndex}
        />
      </div>

      {/* ===== FIXED FOOTER ===== */}
     <div
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    background: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
    zIndex: 10000,
    pointerEvents: "auto",
  }}
>
        <button
          onClick={handleMark}
          style={{ padding: "6px 12px" }}
        >
          Mark for Review
        </button>

        <button
          onClick={handleClear}
          style={{ padding: "6px 12px" }}
        >
          Clear Response
        </button>

        <button
          onClick={() => setShowSubmit(true)}
          style={{
            padding: "6px 14px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Submit Test
        </button>
      </div>

      {/* ===== SUBMIT MODAL ===== */}
      {showSubmit && (
        <SubmitModal
          onConfirm={handleSubmitTest}
          onCancel={() => setShowSubmit(false)}
        />
      )}
    </>
  );
}
