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
  const [mode, setMode] = useState("test"); 
// test | result | review
  const [score, setScore] = useState(0);

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

  /* ===================== PASSAGE STATS (FOR REVIEW / DIAGNOSIS) ===================== */
const passageStats = passages.map((p, pIdx) => {
  let correct = 0;

  p.questions.forEach((q, qIdx) => {
    const gi = pIdx * QUESTIONS_PER_PASSAGE + qIdx;
    if (answers[gi] === q.correctIndex) correct++;
  });

  return {
    genre: p.genre,
    correct,
    total: p.questions.length,
  };
});

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
  let s = 0;

  passages.forEach((passage, pIdx) => {
    passage.questions.forEach((q, qIdx) => {
      const globalIndex = pIdx * QUESTIONS_PER_PASSAGE + qIdx;
      if (answers[globalIndex] === q.correctIndex) {
        s += 1;
      }
    });
  });

  setScore(s);
  setShowSubmit(false);
  setMode("result");
}

  const diagnosis = {
  attempted: answers.filter(a => a !== null).length,
  unattempted: answers.filter(a => a === null).length,
  correct: score,
  byQuestionType: {},
};

passages.forEach((p, pIdx) => {
  p.questions.forEach((q, qIdx) => {
    const gi = pIdx * QUESTIONS_PER_PASSAGE + qIdx;
    const qt = q.questionType;

    if (!diagnosis.byQuestionType[qt]) {
      diagnosis.byQuestionType[qt] = { correct: 0, total: 0 };
    }

    diagnosis.byQuestionType[qt].total++;

    if (answers[gi] === q.correctIndex) {
      diagnosis.byQuestionType[qt].correct++;
    }
  });
});
 
  /* ===================== RENDER ===================== */
 return (
  <>
    {/* ================= RESULT SCREEN ================= */}
    {mode === "result" && (
      <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
        <h2>Test Submitted Successfully</h2>

        <p style={{ marginTop: 12 }}>
          Your Score: <strong>{score} / {totalQuestions}</strong>
        </p>

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button
            style={{
              padding: "10px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setMode("review")}
          >
            Review Test
          </button>

          <button
            style={{
              padding: "10px 16px",
              border: "1px solid #9ca3af",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Back to CAT Arena
          </button>
        </div>
      </div>
    )}

    {/* ================= TEST / REVIEW UI ================= */}
    {mode !== "result" && (
      <>
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>
          {mode === "test" && <CATTimer durationMinutes={30} />}
          <button style={exitBtn}>Exit Test</button>
        </div>

        {/* MAIN GRID */}
        <div style={gridStyle}>
         <PassagePanel
  passages={passages}
  currentQuestionIndex={currentQuestionIndex}
  passageStats={passageStats}
  mode={mode}
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
