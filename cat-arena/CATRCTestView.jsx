"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";

export default function CATRCTestView({ testData }) {
  const totalQuestions = 16;

  // ---------- STATE ----------
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [status, setStatus] = useState(
    Array(totalQuestions).fill("unvisited")
  );

  // ---------- DERIVED ----------
  const passageIndex = Math.floor(currentQ / 4);
  const questionIndex = currentQ % 4;

  const currentPassage = testData.passages[passageIndex];
  const currentQuestion = currentPassage.questions[questionIndex];

  // ---------- ACTIONS ----------
  function visitQuestion(i) {
    setStatus(s => {
      const copy = [...s];
      if (copy[i] === "unvisited") copy[i] = "visited";
      return copy;
    });
    setCurrentQ(i);
  }

  function saveAndNext() {
    setStatus(s => {
      const copy = [...s];
      copy[currentQ] = answers[currentQ] != null
        ? "answered"
        : "visited";
      return copy;
    });

    if (currentQ < totalQuestions - 1) {
      visitQuestion(currentQ + 1);
    }
  }

  function markForReview() {
    setMarked(m => ({ ...m, [currentQ]: true }));
    setStatus(s => {
      const copy = [...s];
      copy[currentQ] = "review";
      return copy;
    });

    if (currentQ < totalQuestions - 1) {
      visitQuestion(currentQ + 1);
    }
  }

  // ---------- UI ----------
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 0.7fr",
        height: "100vh",
      }}
    >
      {/* LEFT: PASSAGE */}
      <PassagePanel text={currentPassage.text} />

      {/* MIDDLE: QUESTION */}
      <QuestionPanel
        question={currentQuestion}
        qNumber={currentQ + 1}
        selected={answers[currentQ]}
        onSelect={opt =>
          setAnswers(a => ({ ...a, [currentQ]: opt }))
        }
        onSave={saveAndNext}
        onMark={markForReview}
      />

      {/* RIGHT: PALETTE */}
      <QuestionPalette
        totalQuestions={totalQuestions}
        currentIndex={currentQ}
        questionStatus={status}
        onJump={visitQuestion}
      />
    </div>
  );
}
