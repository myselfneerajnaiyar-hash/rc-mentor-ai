"use client";

import { useEffect, useMemo, useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";
import MobileRCSectional from "../app/components/MobileRCSectional";
/*
PROPS
- testData
- mode            : "test" | "review"
- initialState    : { answers, questionTime, questionStates }
- onSubmit
*/

export default function CATArenaTestView({
  testData,
  mode = "test",
  initialState = null,
  onSubmit,
  onBackToDiagnosis,
  onExit,
}) {
  // 🔍 Mobile detection
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth <= 768);
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
}, []);


  
  /* ===================== SAFETY ===================== */
  if (!testData || !testData.passages) {
    return (
      <div style={{ padding: 40 }}>
        <h3>No test loaded</h3>
        <p>Please start a CAT RC test again.</p>
      </div>
    );
  }

  const isReview = mode === "review";

  /* ===================== CONSTANTS ===================== */
  const passages = testData.passages;
  const QUESTIONS_PER_PASSAGE = 4;
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;

  const flatQuestions = useMemo(
    () => passages.flatMap(p => p.questions),
    [passages]
  );

  /* ===================== STATE ===================== */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState(
    Array(totalQuestions).fill(null)
  );

  const [questionStates, setQuestionStates] = useState(
    Array(totalQuestions).fill(0)
  );

  const [questionTime, setQuestionTime] = useState(
    Array(totalQuestions).fill(0)
  );

  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);

  /* ===================== DERIVED ===================== */
const passageIndex = Math.floor(currentQuestionIndex / QUESTIONS_PER_PASSAGE);
const questionIndexInPassage =
  currentQuestionIndex % QUESTIONS_PER_PASSAGE;

const currentPassage = passages[passageIndex];
const currentQuestion =
  currentPassage.questions[questionIndexInPassage];



  /* ===================== 🔑 CRITICAL FIX ===================== */
  // Rehydrate state EVERY TIME we enter review mode
  useEffect(() => {
    if (isReview && initialState) {
  setAnswers([...(initialState.answers || [])]);

  setQuestionStates(
    initialState.questionStates
      ? [...initialState.questionStates]
      : Array(initialState.answers?.length || 0).fill(0)
  );

  setQuestionTime(
    initialState.questionTime
      ? [...initialState.questionTime]
      : Array(initialState.answers?.length || 0).fill(0)
  );

  setCurrentQuestionIndex(0);
}
  }, [isReview, initialState]);

  /* ===================== TIME TRACKING ===================== */
  useEffect(() => {
    if (!isReview) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, isReview]);

  function saveTime() {
    if (isReview) return;

    const spent = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionTime(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] += spent;
      return updated;
    });
  }

  

  /* ===================== HANDLERS ===================== */
  function handleAnswer(optionIndex) {
    if (isReview) return;

    const a = [...answers];
    a[currentQuestionIndex] = optionIndex;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 2 ? 3 : 1;
    setQuestionStates(qs);
  }

  function handleMark() {
    if (isReview) return;

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 1 ? 3 : 2;
    setQuestionStates(qs);
  }

  function handleClear() {
    if (isReview) return;

    const a = [...answers];
    a[currentQuestionIndex] = null;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentQuestionIndex] =
      qs[currentQuestionIndex] === 3 ? 2 : 0;
    setQuestionStates(qs);
  }

  function goNext() {
    saveTime();
    setCurrentQuestionIndex(i =>
      Math.min(i + 1, totalQuestions - 1)
    );
  }

  function goPrev() {
    saveTime();
    setCurrentQuestionIndex(i => Math.max(i - 1, 0));
  }

function submitPayload() {
  saveTime();

  const total = flatQuestions.length;

  let correct = 0;
  answers.forEach((ans, i) => {
    if (ans === flatQuestions[i]?.correctIndex) {
      correct++;
    }
  });

  const timeTaken = questionTime.reduce((a, b) => a + (b || 0), 0);

  onSubmit?.({
    passages,
    questions: flatQuestions,
    answers,
    questionTime,
    questionStates,

    // 🔒 REQUIRED FOR ANALYTICS
    timestamp: Date.now(),   // number
    total,                   // number
    correct,                 // number
    attempted: answers.filter(a => a !== null && a !== undefined).length,
    timeTaken,               // seconds
  });
  return true;
}

/* ===================== RENDER ===================== */

if (isMobile) {
  return (
    <MobileRCSectional
      mode={mode}                         // ✅ ADD THIS
      passage={currentPassage.text || currentPassage.passage}
      question={currentQuestion}
      selectedOption={answers[currentQuestionIndex]}
      correctIndex={currentQuestion.correctIndex}
explanation={currentQuestion.explanation}
      durationSeconds={30 * 60}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={totalQuestions}
      questionStates={questionStates}
      onSelectOption={handleAnswer}
      onNext={goNext}
      onMark={handleMark}
      onClear={handleClear}
      onJump={setCurrentQuestionIndex}
     onSubmit={() => submitPayload()}
onBackToDiagnosis={onBackToDiagnosis}
    />
  );
}

  return (
  <>
    {/* HEADER */}
    <div style={headerStyle}>
      <div style={{ fontWeight: 600 }}>CAT RC Sectional</div>

      {isReview && (
  <button onClick={onBackToDiagnosis} style={backBtn}>
    ← Back to Diagnosis
  </button>
)}

      {!isReview && (
        <CATTimer durationMinutes={30} onTimeUp={submitPayload} />
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
        onPrev={goPrev}
        onNext={goNext}
      />

      <QuestionPalette
        totalQuestions={totalQuestions}
        currentQuestion={currentQuestionIndex}
        questionStates={questionStates}
        onJump={setCurrentQuestionIndex}
      />
    </div>

    {!isReview && (
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
      onConfirm={submitPayload}
    />
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
  justifyContent: "space-between",
  alignItems: "center",
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

const backBtn = {
  padding: "6px 12px",
  border: "1px solid #2563eb",
  background: "#eef2ff",
  borderRadius: 6,
  cursor: "pointer",
};
