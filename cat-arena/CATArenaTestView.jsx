"use client";

import { useState } from "react";
import MobileRCSectional from "../app/components/MobileRCSectional";

/* CAT RC rules */
const QUESTIONS_PER_PASSAGE = 4;
const TOTAL_TIME_SECONDS = 30 * 60;

export default function CATArenaTestView({
  testData,
  mode = "test",
  initialState = null,
  onSubmit,
}) {
  const passages = testData?.passages || [];
  const totalQuestions = passages.length * QUESTIONS_PER_PASSAGE;

  /* ---------------- STATE ---------------- */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(
    initialState?.answers || Array(totalQuestions).fill(null)
  );
  const [questionStates, setQuestionStates] = useState(
    initialState?.questionStates || Array(totalQuestions).fill(0)
  );

  /* ---------------- DERIVED ---------------- */
  const passageIndex = Math.floor(currentIndex / QUESTIONS_PER_PASSAGE);
  const questionIndex = currentIndex % QUESTIONS_PER_PASSAGE;

  const currentPassage = passages[passageIndex];
  const currentQuestion = currentPassage?.questions?.[questionIndex];

  /* ---------------- HARD GUARD ---------------- */
  if (!currentPassage || !currentQuestion) {
    return (
      <div style={{ padding: 40 }}>
        <h3>Loading question…</h3>
      </div>
    );
  }

  /* ---------------- ACTIONS ---------------- */
  function selectOption(i) {
    if (mode === "review") return;

    const a = [...answers];
    a[currentIndex] = i;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentIndex] = qs[currentIndex] === 2 ? 3 : 1;
    setQuestionStates(qs);
  }

  function mark() {
    if (mode === "review") return;

    const qs = [...questionStates];
    qs[currentIndex] = qs[currentIndex] === 1 ? 3 : 2;
    setQuestionStates(qs);
  }

  function clear() {
    if (mode === "review") return;

    const a = [...answers];
    a[currentIndex] = null;
    setAnswers(a);

    const qs = [...questionStates];
    qs[currentIndex] = qs[currentIndex] === 3 ? 2 : 0;
    setQuestionStates(qs);
  }

  function next() {
    setCurrentIndex(i => Math.min(i + 1, totalQuestions - 1));
  }

  function jump(i) {
    setCurrentIndex(i);
  }

  function submit() {
    onSubmit?.({
      passages,
      answers,
      questionStates,
      timestamp: Date.now(),
    });
  }

  /* ---------------- MOBILE (FORCED) ---------------- */
  return (
    <MobileRCSectional
      passage={currentPassage.text}
      question={currentQuestion}
      selectedOption={answers[currentIndex]}
      durationSeconds={TOTAL_TIME_SECONDS}
      currentQuestionIndex={currentIndex}
      totalQuestions={totalQuestions}
      questionStates={questionStates}
      onSelectOption={selectOption}
      onNext={next}
      onMark={mark}
      onClear={clear}
      onJump={jump}
      onSubmit={submit}
    />
  );
}
