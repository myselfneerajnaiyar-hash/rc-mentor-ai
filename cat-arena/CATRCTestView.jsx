"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import CATArenaHeader from "../components/cat/CATArenaHeader";

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
  <>
    <CATArenaHeader
      title="CAT RC Sectional"
      timeLeft="30:00"
      onExit={() => {
        if (confirm("Exit test?")) window.location.reload();
      }}
    />

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38% 37% 25%",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* LEFT — PASSAGE */}
      <div style={{ padding: 16, overflowY: "auto", borderRight: "1px solid #d1d5db" }}>
        <PassagePanel passage={currentPassage} />
      </div>

      {/* MIDDLE — QUESTION */}
      <div style={{ padding: 16 }}>
        <QuestionPanel
          question={currentQuestion}
          qNumber={currentQIndex + 1}
          onAnswer={handleAnswer}
          onMark={handleMark}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>

      {/* RIGHT — PALETTE */}
      <div style={{ padding: 12, borderLeft: "1px solid #d1d5db" }}>
        <QuestionPalette
          total={16}
          current={currentQIndex}
          states={questionStates}
          onJump={setCurrentQIndex}
        />
      </div>
    </div>
  </>
);
