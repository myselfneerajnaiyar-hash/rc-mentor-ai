"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import { sampleRCTest } from "./data/sampleRCTest";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";

export default function CATArenaTestView() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const totalQuestions = sampleRCTest.passages.length * 4;

  const [answers, setAnswers] = useState(Array(totalQuestions).fill(null));
  const [questionStates, setQuestionStates] = useState(
    Array(totalQuestions).fill(0)
  );

  const [showSubmit, setShowSubmit] = useState(false);

  const passageIndex = Math.floor(currentQuestionIndex / 4);
  const currentPassage = sampleRCTest.passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[currentQuestionIndex % 4];

  /* ---------- HANDLERS ---------- */

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
    setShowSubmit(false);
    alert("Test submitted successfully!");
  }

  /* ---------- UI ---------- */

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
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 1000,
        }}
      >
        <strong>CAT RC Sectional</strong>

        <CATTimer
          durationMinutes={30}
          onTimeUp={() => setShowSubmit(true)}
        />

        <button
          style={{
            border: "1px solid #dc2626",
            color: "#dc2626",
            padding: "6px 12px",
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
          paddingTop: 56,
          paddingBottom: 64,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32% 38% 30%",
            minHeight: "80vh",
          }}
        >
          <PassagePanel
            passages={sampleRCTest.passages}
            currentQuestionIndex={currentQuestionIndex}
          />

          <QuestionPanel
            question={currentQuestion}
            qNumber={currentQuestionIndex + 1}
            selectedOption={answers[currentQuestionIndex]}
            onAnswer={handleAnswer}
          />

          <QuestionPalette
            totalQuestions={totalQuestions}
            currentQuestion={currentQuestionIndex}
            questionStates={questionStates}
            onJump={setCurrentQuestionIndex}
          />
        </div>
      </div>

      {/* ===== FIXED FOOTER (CAT STYLE) ===== */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          zIndex: 1000,
        }}
      >
        <button onClick={handleMark}>Mark for Review</button>
        <button onClick={handleClear}>Clear Response</button>
        <button
          onClick={() =>
            setCurrentQuestionIndex(i => Math.max(i - 1, 0))
          }
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentQuestionIndex(i =>
              Math.min(i + 1, totalQuestions - 1)
            )
          }
        >
          Save & Next
        </button>
        <button
          style={{ background: "#2563eb", color: "#fff" }}
          onClick={() => setShowSubmit(true)}
        >
          Submit Test
        </button>
      </div>

      {showSubmit && (
        <SubmitModal
          onConfirm={handleSubmitTest}
          onCancel={() => setShowSubmit(false)}
        />
      )}
    </>
  );
}
