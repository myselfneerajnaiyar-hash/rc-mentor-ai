"use client";

import { useEffect, useState, useMemo } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATTimer from "./components/CATTimer";
import SubmitModal from "./components/SubmitModal";
import MobileRCSectional from "../app/components/MobileRCSectional";

/*
CAT RC RULES
- 4 passages
- 4 questions per passage
- total 16 questions
*/

const QUESTIONS_PER_PASSAGE = 4;
const TOTAL_TIME_SECONDS = 30 * 60;

export default function CATArenaTestView({
  testData,
  mode = "test",
  initialState = null,
  onSubmit,
}) {
  const isReview = mode === "review";

  /* ================= SAFETY ================= */
  if (!testData || !testData.passages) {
    return (
      <div style={{ padding: 40 }}>
        <h3>No test loaded</h3>
        <p>Please restart the test.</p>
      </div>
    );
  }

  /* ================= DATA ================= */
  const passages = testData.passages;
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;

  const flatQuestions = useMemo(
    () => passages.flatMap(p => p.questions),
    [passages]
  );

  /* ================= STATE ================= */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState(
    initialState?.answers || Array(totalQuestions).fill(null)
  );

  const [questionStates, setQuestionStates] = useState(
    initialState?.questionStates || Array(totalQuestions).fill(0)
  );

  const [questionTime, setQuestionTime] = useState(
    initialState?.questionTime || Array(totalQuestions).fill(0)
  );

  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showSubmit, setShowSubmit] = useState(false);

  /* ================= DERIVED ================= */
  const passageIndex = Math.floor(
    currentQuestionIndex / QUESTIONS_PER_PASSAGE
  );
  const questionIndex =
    currentQuestionIndex % QUESTIONS_PER_PASSAGE;

  const currentPassage = passages[passageIndex];
  const currentQuestion =
    currentPassage?.questions?.[questionIndex];

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
    if (!isReview) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, isReview]);

  function saveTime() {
    if (isReview) return;

    const spent = Math.round(
      (Date.now() - questionStartTime) / 1000
    );

    setQuestionTime(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] += spent;
      return copy;
    });
  }

  /* ================= ACTIONS ================= */
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
    qs[currentQuestionIndex] = 0;
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

    let correct = 0;
    answers.forEach((ans, i) => {
      if (ans === flatQuestions[i]?.correctIndex) {
        correct++;
      }
    });

    const timeTaken = questionTime.reduce(
      (a, b) => a + (b || 0),
      0
    );

    onSubmit?.({
      passages,
      questions: flatQuestions,
      answers,
      questionStates,
      questionTime,
      total: flatQuestions.length,
      correct,
      attempted: answers.filter(a => a !== null).length,
      timeTaken,
      timestamp: Date.now(),
    });
  }

  /* ================= MOBILE ================= */
  const isMobile =
    typeof window !== "undefined" && window.innerWidth <= 768;

  if (isMobile) {
    return (
      <MobileRCSectional
        passage={currentPassage.text}
        question={currentQuestion}
        selectedOption={answers[currentQuestionIndex]}
        durationSeconds={TOTAL_TIME_SECONDS}
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
      <CATTimer
        durationMinutes={30}
        onTimeUp={submitPayload}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40% 35% 25%",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <PassagePanel
          passage={currentPassage}
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
        <div
          style={{
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
          }}
        >
          <button onClick={handleClear}>Clear</button>
          <button onClick={handleMark}>Mark</button>
          <button onClick={goNext}>Save & Next</button>
          <button onClick={() => setShowSubmit(true)}>
            Submit
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
