"use client";

import { useEffect, useMemo, useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";
import DiagnosisView from "./components/DiagnosisView";

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

  /* ✅ FLATTEN QUESTIONS (THIS WAS MISSING) */
  const flatQuestions = useMemo(
    () => passages.flatMap(p => p.questions),
    [passages]
  );

  /* ===================== STATE ===================== */
  const [mode, setMode] = useState("test"); // test | diagnosis | review
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [questionStates, setQuestionStates] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);

  /* ===================== RESET ON LOAD ===================== */
  useEffect(() => {
    setAnswers(Array(totalQuestions).fill(null));
    setQuestionStates(Array(totalQuestions).fill(0));
    setCurrentQuestionIndex(0);
    sessionStorage.removeItem("cat-timer");
  }, [totalQuestions]);

  /* ===================== DERIVED ===================== */
  const passageIndex = Math.floor(currentQuestionIndex / QUESTIONS_PER_PASSAGE);
  const questionIndexInPassage =
    currentQuestionIndex % QUESTIONS_PER_PASSAGE;

  const currentPassage = passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[questionIndexInPassage];
  const [questionTime, setQuestionTime] = useState(
  Array(totalQuestions).fill(0)
);

const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  /* ===================== HANDLERS ===================== */
  function handleAnswer(optionIndex) {
    if (mode !== "test") return;

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
    if (mode !== "test") return;

    const a = [...answers];
    a[currentQuestionIndex] = null;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 3 ? 2 : 0;
    setQuestionStates(qs);
  }

 function handleSubmitTest() {
  const now = Date.now();
  const timeSpent = Math.round((now - questionStartTime) / 1000);

  setQuestionTime(prev => {
    const updated = [...prev];
    updated[currentQuestionIndex] += timeSpent;
    return updated;
  });

  setScore(diagnosis.score);
  setShowSubmit(false);
  setMode("diagnosis");
}
  /* ===================== RENDER ===================== */
  return (
    <>
      {/* ===================== DIAGNOSIS ===================== */}
     {mode === "diagnosis" && (
  <DiagnosisView
    passages={passages}
    questions={flatQuestions}
    answers={answers}
    onReview={() => setMode("review")}
  />
)}

      {/* ===================== TEST / REVIEW ===================== */}
      {(mode === "test" || mode === "review") && (
        <>
          {/* HEADER */}
          <div style={headerStyle}>
            <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>
            {mode === "test" && (
              <CATTimer
                durationMinutes={30}
                onTimeUp={handleSubmitTest}
              />
            )}
          </div>

          {/* MAIN GRID */}
          <div style={gridStyle}>
            <PassagePanel
              passages={passages}
              currentQuestionIndex={currentQuestionIndex}
              mode={mode}
            />

            <QuestionPanel
              question={currentQuestion}
              qNumber={currentQuestionIndex + 1}
              selectedOption={answers[currentQuestionIndex]}
              correctIndex={currentQuestion.correctIndex}
              mode={mode}
              onAnswer={handleAnswer}
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

          {/* FOOTER */}
          {mode === "test" && (
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
          )}

          <SubmitModal
            open={showSubmit}
            onCancel={() => setShowSubmit(false)}
            onConfirm={handleSubmitTest}
          />
        </>
      )}
    </>
  );
}

/* ===================== STYLES ===================== */

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
  gridTemplateColumns: "40% 35% 25%",
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

const submitBtn = {
  padding: "6px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

const ghostBtn = {
  padding: "6px 12px",
  border: "1px solid #9ca3af",
  background: "#fff",
  cursor: "pointer",
};
