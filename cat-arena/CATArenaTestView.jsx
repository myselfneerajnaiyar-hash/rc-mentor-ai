"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import { sampleRCTest } from "./data/sampleRCTest";

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

  function handleAnswer() {
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32% 38% 30%",
        minHeight: "80vh",
      }}
    >
      {/* LEFT: Passage */}
      <PassagePanel
        passages={sampleRCTest.passages}
        currentQuestionIndex={currentQuestionIndex}
      />

      {/* CENTER: Question */}
      <QuestionPanel
        question={currentQuestion}
        qNumber={currentQuestionIndex + 1}
        onAnswer={handleAnswer}
        onMark={handleMark}
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
