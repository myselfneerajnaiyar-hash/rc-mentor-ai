"use client";

import { useEffect, useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";

export default function CATArenaTestView({ testData }) {
  /* ===================== SAFETY ===================== */
  if (!testData || !testData.passages) {
    return (
      <div style={{ padding: 40 }}>
        <h3>No test loaded</h3>
        <p>Please start a CAT RC test again.</p>
      </div>
    );
  }

  /* ===================== CONSTANTS ===================== */
  const passages = testData.passages;
  const QUESTIONS_PER_PASSAGE = 4;
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;

  /* ===================== STATE ===================== */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [questionStates, setQuestionStates] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [mode, setMode] = useState("test"); // test | review

  /* ===================== RESET ON LOAD ===================== */
  useEffect(() => {
    if (!totalQuestions) return;

    setAnswers(Array(totalQuestions).fill(null));
    setQuestionStates(Array(totalQuestions).fill(0));
    setCurrentQuestionIndex(0);

    // hard reset timer
    sessionStorage.removeItem("cat-timer");
  }, [totalQuestions]);

  /* ===================== DERIVED ===================== */
  const passageIndex = Math.floor(
    currentQuestionIndex / QUESTIONS_PER_PASSAGE
  );

  const questionIndexInPassage =
    currentQuestionIndex % QUESTIONS_PER_PASSAGE;

  const currentPassage = passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[questionIndexInPassage];

  /* ===================== HANDLERS ===================== */
  function handleAnswer(optionIndex) {
    if (mode === "review") return;

    const a = [...answers];
    a[currentQuestionIndex] = optionIndex;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 2 ? 3 : 1;
    setQuestionStates(qs);
  }

  function handleMark() {
    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 1 ? 3 : 2;
    setQuestionStates(qs);
  }

  function handleClear() {
    if (mode === "review") return;

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
    setMode("review"); // 🔥 KEY SWITCH
  }

  /* ===================== RENDER ===================== */
  return (
    <>
      {/* ================= HEADER ================= */}
      <div style={headerStyle}>
        <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>

        {mode === "test" && <CATTimer durationMinutes={30} />}

        <button style={exitBtn}>Exit Test</button>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div style={gridStyle}>
        <PassagePanel
          passages={passages}
          currentQuestionIndex={currentQuestionIndex}
        />

        <QuestionPanel
          question={currentQuestion}
          qNumber={currentQuestionIndex + 1}
          selectedOption={answers[currentQuestionIndex]}
          correctIndex={currentQuestion.correctIndex}
          mode={mode}
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

      {/* ================= SUBMIT MODAL ================= */}
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
