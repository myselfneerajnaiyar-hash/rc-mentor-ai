"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import { sampleRCTest } from "./data/sampleRCTest";
import CATTimer from "./components/CATTimer";
const [answers, setAnswers] = useState(
  Array(totalQuestions).fill(null)
);

export default function CATArenaTestView() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const totalQuestions =
    sampleRCTest.passages.length * 4;

  // 0 = not visited
  // 1 = answered
  // 2 = marked
  // 3 = answered + marked
  const [questionStates, setQuestionStates] = useState(
    Array(totalQuestions).fill(0)
  );

  // CAT rule: 4 questions per passage
  const passageIndex = Math.floor(currentQuestionIndex / 4);
  const currentPassage =
    sampleRCTest.passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[currentQuestionIndex % 4];

  function handleAnswer(optionIndex) {
  setAnswers(prev => {
    const copy = [...prev];
    copy[currentQuestionIndex] = optionIndex;
    return copy;
  });

  setQuestionStates(prev => {
    const copy = [...prev];
    copy[currentQuestionIndex] =
      copy[currentQuestionIndex] === 2 ? 3 : 1;
    return copy;
  });
}

  function handleMark() {
    setQuestionStates(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] =
        copy[currentQuestionIndex] === 1 ? 3 : 2;
      return copy;
    });
  }
  function handleClear() {
  setAnswers(prev => {
    const copy = [...prev];
    copy[currentQuestionIndex] = null;
    return copy;
  });

  setQuestionStates(prev => {
    const copy = [...prev];
    // if marked → stay marked
    copy[currentQuestionIndex] =
      copy[currentQuestionIndex] === 3 ? 2 : 0;
    return copy;
  });
}
  

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32% 38% 30%",
        minHeight: "80vh",
      }}
    >

{/* ===== FIXED HEADER ===== */}
<div
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    zIndex: 100,
  }}
>
  <div style={{ fontWeight: 600 }}>
  CAT RC Sectional
</div>

<CATTimer
  durationMinutes={30}
  onTimeUp={() => {
    alert("Time up! Test will be submitted.");
  }}
/>

<button
  style={{
    border: "1px solid #dc2626",
    color: "#dc2626",
    padding: "6px 12px",
    borderRadius: 4,
    background: "transparent",
    cursor: "pointer",
  }}
>
  Exit Test
</button>
</div>
      
      {/* LEFT: Passage */}
      <PassagePanel
        passages={sampleRCTest.passages}
        currentQuestionIndex={currentQuestionIndex}
      />

      {/* CENTER: Question */}
     <QuestionPanel
  question={currentQuestion}
  qNumber={currentQuestionIndex + 1}
  selectedOption={answers[currentQuestionIndex]}
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

      {/* RIGHT: Palette */}
      <QuestionPalette
        totalQuestions={totalQuestions}
        currentQuestion={currentQuestionIndex}
        questionStates={questionStates}
        onJump={setCurrentQuestionIndex}
      />
    </div>
  );
}
