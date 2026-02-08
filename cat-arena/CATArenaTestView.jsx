"use client";

import { useEffect, useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";
import MobileRCSectional from "../app/components/MobileRCSectional";

const QUESTIONS_PER_PASSAGE = 4;

export default function CATArenaTestView({
  testData,
  mode = "test",
  initialState = null,
  onSubmit,
}) {
  const isReview = mode === "review";
  const passages = testData.passages;
 const totalQuestions = QUESTIONS_PER_PASSAGE;
  /* ================= MOBILE DETECTION ================= */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ================= STATE ================= */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(totalQuestions).fill(null));
  const [questionStates, setQuestionStates] = useState(
    Array(totalQuestions).fill(0)
  );
  const [questionTime, setQuestionTime] = useState(
    Array(totalQuestions).fill(0)
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showSubmit, setShowSubmit] = useState(false);

  /* ================= DERIVED (🔥 SINGLE SOURCE) ================= */
  const passageIndex = Math.floor(currentQuestionIndex / QUESTIONS_PER_PASSAGE);
  const questionIndex = currentQuestionIndex % QUESTIONS_PER_PASSAGE;

  const currentPassage = passages[passageIndex];
  const currentQuestion = currentPassage?.questions?.[questionIndex];

  /* ================= HARD GUARD ================= */
  if (!currentPassage || !currentQuestion) {
    return (
      <div style={{ padding: 40 }}>
        <h3>Loading question…</h3>
      </div>
    );
  }

  /* ================= TIME ================= */
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

  /* ================= ACTIONS ================= */
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
    onSubmit?.({
      passages,
      answers,
      questionStates,
      questionTime,
      timestamp: Date.now(),
    });
  }

  /* ================= MOBILE ================= */
  
  if (isMobile) {
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

      <div style={{ display: "grid", gridTemplateColumns: "40% 35% 25%" }}>
        <PassagePanel passage={currentPassage} />

        <QuestionPanel
          question={currentQuestion}
          qNumber={currentQuestionIndex + 1}
          selectedOption={answers[currentQuestionIndex]}
          mode={mode}
          onAnswer={handleAnswer}
          onNext={goNext}
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
