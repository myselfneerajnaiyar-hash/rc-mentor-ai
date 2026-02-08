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
- initialState
- onSubmit
*/

export default function CATArenaTestView({
  testData,
  mode = "test",
  initialState = null,
  onSubmit,
}) {
  const isReview = mode === "review";

  /* ================= MOBILE DETECTION ================= */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ================= SAFETY ================= */
  if (!testData?.passages) {
    return <div style={{ padding: 40 }}>No test loaded</div>;
  }

  /* ================= CONSTANTS ================= */
  const passages = testData.passages;
  const QUESTIONS_PER_PASSAGE = 4;
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;

  const flatQuestions = useMemo(
    () => passages.flatMap(p => p.questions),
    [passages]
  );

  /* ================= STATE ================= */
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

  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showSubmit, setShowSubmit] = useState(false);

  /* ================= DERIVED ================= */
  const passageIndex = Math.floor(
    currentQuestionIndex / QUESTIONS_PER_PASSAGE
  );
  const questionIndexInPassage =
    currentQuestionIndex % QUESTIONS_PER_PASSAGE;

  const currentPassage = passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[questionIndexInPassage];

  /* ================= REVIEW REHYDRATE ================= */
  useEffect(() => {
    if (isReview && initialState) {
      setAnswers([...initialState.answers]);
      setQuestionStates([...initialState.questionStates]);
      setQuestionTime([...initialState.questionTime]);
      setCurrentQuestionIndex(0);
    }
  }, [isReview, initialState]);

  /* ================= TIME TRACKING ================= */
  useEffect(() => {
    if (!isReview) setQuestionStartTime(Date.now());
  }, [currentQuestionIndex, isReview]);

  function saveTime() {
    if (isReview) return;
    const spent = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionTime(t => {
      const copy = [...t];
      copy[currentQuestionIndex] += spent;
      return copy;
    });
  }

  /* ================= HANDLERS ================= */
  function handleAnswer(i) {
    if (isReview) return;

    const a = [...answers];
    a[currentQuestionIndex] = i;
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

    goNext();
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

  function submitPayload() {
    saveTime();

    let correct = 0;
    answers.forEach((a, i) => {
      if (a === flatQuestions[i]?.correctIndex) correct++;
    });

    onSubmit?.({
      passages,
      questions: flatQuestions,
      answers,
      questionTime,
      questionStates,
      timestamp: Date.now(),
      total: flatQuestions.length,
      correct,
      attempted: answers.filter(a => a !== null).length,
      timeTaken: questionTime.reduce((a, b) => a + b, 0),
    });
  }

  /* ================= MOBILE RENDER ================= */
  if (isMobile && !isReview) {
    return (
      <MobileRCSectional
        passage={currentPassage.text}
        question={currentQuestion}
        selectedOption={answers[currentQuestionIndex]}
        durationSeconds={30 * 60}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        questionStates={questionStates}
        onSelectOption={handleAnswer}
        onNext={goNext}
        onMark={handleMark}
        onClear={handleClear}
        onJump={setCurrentQuestionIndex}
        onSubmit={() => setShowSubmit(true)}
      />
    );
  }

  /* ================= DESKTOP ================= */
  return (
    <>
      <CATTimer durationMinutes={30} onTimeUp={submitPayload} />

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
        />

        <QuestionPalette
          totalQuestions={totalQuestions}
          currentQuestion={currentQuestionIndex}
          questionStates={questionStates}
          onJump={setCurrentQuestionIndex}
        />
      </div>

      <SubmitModal
        open={showSubmit}
        onCancel={() => setShowSubmit(false)}
        onConfirm={submitPayload}
      />
    </>
  );
}

/* ================= STYLES ================= */
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "40% 35% 25%",
  paddingTop: 56,
  minHeight: "100vh",
};
