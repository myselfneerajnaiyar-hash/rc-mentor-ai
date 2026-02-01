"use client";

import { useEffect, useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";

import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";

export default function CATArenaTestView({ testData }) {
 const passages = testData?.passages || [];
const QUESTIONS_PER_PASSAGE = 4;

const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(totalQuestions).fill(null));
  const [questionStates, setQuestionStates] = useState(
    Array(totalQuestions).fill(0)
  );

  const [showSubmit, setShowSubmit] = useState(false);

  // 🔁 RESET TIMER ON HARD REFRESH
  useEffect(() => {
    sessionStorage.removeItem("cat-timer");
  }, []);

  // CAT LOGIC
  const passageIndex = Math.floor(currentQuestionIndex / 4);
  const currentPassage = sampleRCTest.passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[currentQuestionIndex % 4];

  function handleAnswer(optionIndex) {
    const a = [...answers];
    a[currentQuestionIndex] = optionIndex;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 2 ? 3 : 1;
    setQuestionStates(qs);
  }
  const [mode, setMode] = useState("test"); 
// "test" | "review"

  function handleMark() {
    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 1 ? 3 : 2;
    setQuestionStates(qs);
  }

  function handleClear() {
    const a = [...answers];
    a[currentQuestionIndex] = null;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 3 ? 2 : 0;
    setQuestionStates(qs);
  }

  function handleSubmitTest() {
  setShowSubmit(false);
  setMode("review"); // 🔥 THIS IS THE KEY
}

  return (
    <>
      {/* ================= HEADER ================= */}
      <div style={headerStyle}>
        <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>

       {mode === "test" && (
  <CATTimer durationMinutes={30} />
)}

        <button style={exitBtn}>Exit Test</button>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div style={gridStyle}>
        <PassagePanel
          passages={sampleRCTest.passages}
          currentQuestionIndex={currentQuestionIndex}
        />

        <QuestionPanel
          question={currentQuestion}
          qNumber={currentQuestionIndex + 1}
          selectedOption={answers[currentQuestionIndex]}
          onAnswer={handleAnswer}
          onMark={handleMark}
          onClear={handleClear}
          mode={mode}
          onPrev={() =>
            setCurrentQuestionIndex(i => Math.max(i - 1, 0))
          }
          onNext={() =>
            setCurrentQuestionIndex(i =>
              Math.min(i + 1, totalQuestions - 1)
            )
          }
        />

        <QuestionPalette
          totalQuestions={totalQuestions}
          currentQuestion={currentQuestionIndex}
          questionStates={questionStates}
          onJump={setCurrentQuestionIndex}
        />
      </div>

      {/* ================= FOOTER ================= */}
      <div style={footerStyle}>
        <button style={ghostBtn} onClick={handleMark}>
          Mark for Review
        </button>

        <button style={ghostBtn} onClick={handleClear}>
          Clear Response
        </button>

        <button
          style={submitBtn}
          onClick={() => setShowSubmit(true)}
        >
          Submit Test
        </button>
      </div>

      {/* ================= MODAL (OUTSIDE GRID) ================= */}
      <SubmitModal
        open={showSubmit}
        onCancel={() => setShowSubmit(false)}
        onConfirm={handleSubmitTest}
      />
    </>
  );
}

/* ================= STYLES ================= */

const headerStyle = {
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
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "32% 38% 30%",
  paddingTop: 56,
  paddingBottom: 64,
  minHeight: "100vh",
};

const footerStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: 56,
  display: "flex",
  justifyContent: "center",
  gap: 12,
  alignItems: "center",
  background: "#fff",
  borderTop: "1px solid #e5e7eb",
  zIndex: 1000,
};

const exitBtn = {
  border: "1px solid #dc2626",
  color: "#dc2626",
  padding: "6px 12px",
  background: "transparent",
  cursor: "pointer",
};

const ghostBtn = {
  padding: "6px 12px",
  border: "1px solid #9ca3af",
  background: "#fff",
  cursor: "pointer",
};

const submitBtn = {
  padding: "6px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
