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
  // test | result | review | diagnosis
  const [score, setScore] = useState(0);

  /* ===================== RESET ON LOAD ===================== */
  useEffect(() => {
    setAnswers(Array(totalQuestions).fill(null));
    setQuestionStates(Array(totalQuestions).fill(0));
    setCurrentQuestionIndex(0);
    sessionStorage.removeItem("cat-timer");
  }, [totalQuestions]);

  /* ===================== DERIVED ===================== */
  const passageIndex = Math.floor(currentQuestionIndex / QUESTIONS_PER_PASSAGE);
  const questionIndexInPassage = currentQuestionIndex % QUESTIONS_PER_PASSAGE;
  const currentPassage = passages[passageIndex];
  const currentQuestion = currentPassage.questions[questionIndexInPassage];

  /* ===================== PASSAGE STATS ===================== */
  const passageStats = passages.map((p, pIdx) => {
    let correct = 0;
    p.questions.forEach((q, qIdx) => {
      const gi = pIdx * QUESTIONS_PER_PASSAGE + qIdx;
      if (answers[gi] === q.correctIndex) correct++;
    });
    return { genre: p.genre, correct, total: p.questions.length };
  });

  /* ===================== DIAGNOSIS ===================== */
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

  /* ===================== HANDLERS ===================== */
  function handleAnswer(optionIndex) {
    if (mode !== "test") return;

    const a = [...answers];
    a[currentQuestionIndex] = optionIndex;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] = qs[currentQuestionIndex] === 2 ? 3 : 1;
    setQuestionStates(qs);
  }

  function handleMark() {
    const qs = [...questionStates];
    qs[currentQuestionIndex] = qs[currentQuestionIndex] === 1 ? 3 : 2;
    setQuestionStates(qs);
  }

  function handleClear() {
    if (mode !== "test") return;

    const a = [...answers];
    a[currentQuestionIndex] = null;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] = qs[currentQuestionIndex] === 3 ? 2 : 0;
    setQuestionStates(qs);
  }

  function handleSubmitTest() {
    let s = 0;

    passages.forEach((p, pIdx) => {
      p.questions.forEach((q, qIdx) => {
        const gi = pIdx * QUESTIONS_PER_PASSAGE + qIdx;
        if (answers[gi] === q.correctIndex) s++;
      });
    });

    setScore(s);
    setShowSubmit(false);
    setMode("result");
  }

  /* ===================== RENDER ===================== */
  return (
    <>
      {/* ================= RESULT ================= */}
      {mode === "result" && (
        <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
          <h2>Test Submitted Successfully</h2>

          <p style={{ marginTop: 12 }}>
            Your Score: <strong>{score} / {totalQuestions}</strong>
          </p>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button onClick={() => setMode("review")} style={primaryBtn}>
              Review Test
            </button>

            <button onClick={() => setMode("diagnosis")} style={greenBtn}>
              View Detailed Analysis
            </button>
          </div>
        </div>
      )}

      {/* ================= DIAGNOSIS ================= */}
      {mode === "diagnosis" && (
        <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
          <h2>Detailed Diagnosis</h2>

          <p style={{ marginTop: 16 }}>
            Attempted: {diagnosis.attempted}<br />
            Correct: {diagnosis.correct}<br />
            Unattempted: {diagnosis.unattempted}
          </p>

          <h3 style={{ marginTop: 24 }}>Passage-wise Performance</h3>
          {passageStats.map((p, i) => (
            <div key={i}>
              {p.genre}: {p.correct} / {p.total}
            </div>
          ))}

          <h3 style={{ marginTop: 24 }}>Question Type Performance</h3>
          {Object.entries(diagnosis.byQuestionType).map(([type, v]) => (
            <div key={type}>
              {type}: {v.correct} / {v.total}
            </div>
          ))}

          <button
            style={{ marginTop: 24, ...ghostBtn }}
            onClick={() => setMode("review")}
          >
            Review Questions
          </button>
        </div>
      )}

      {/* ================= TEST / REVIEW ================= */}
      {(mode === "test" || mode === "review") && (
        <>
          <div style={headerStyle}>
            <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>
            {mode === "test" && <CATTimer durationMinutes={30} onTimeUp={handleSubmitTest} />}
          </div>

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
              onPrev={() => setCurrentQuestionIndex(i => Math.max(i - 1, 0))}
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

          {mode === "test" && (
            <div style={footerStyle}>
              <button style={ghostBtn} onClick={handleMark}>Mark for Review</button>
              <button style={ghostBtn} onClick={handleClear}>Clear Response</button>
              <button style={submitBtn} onClick={() => setShowSubmit(true)}>
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

const primaryBtn = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

const greenBtn = {
  padding: "10px 16px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
