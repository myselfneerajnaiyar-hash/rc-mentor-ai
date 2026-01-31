"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import { sampleRCTest } from "./data/sampleRCTest";
import CATArenaHeader from "@/components/cat/CATArenaHeader";

export default function CATArenaTestView() {
 const [currentQIndex, setCurrentQIndex] = useState(0);

// questionStates: 0 = unattempted, 1 = answered, 2 = marked, 3 = answered+marked
const [questionStates, setQuestionStates] = useState(
  Array(16).fill(0)
);

  // 🔑 CORE RULE (DO NOT TOUCH)
  const passageIndex = Math.floor(currentQIndex / 4);

  const currentPassage = sampleRCTest.passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[currentQIndex % 4];

  return (
    <>
      {/* ===== TOP HEADER (CAT STYLE) ===== */}
      <CATArenaHeader
        title="CAT RC Sectional"
        timeLeft="30:00"
        onExit={() => {
          if (confirm("Exit test? Your progress will be lost.")) {
            window.location.reload(); // TEMP
          }
        }}
      />

      {/* ===== MAIN TEST GRID ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "32% 38% 30%",
          gap: 16,
          minHeight: "80vh",
          padding: "16px",
        }}
      >
        {/* LEFT — Passage */}
        <PassagePanel passage={currentPassage} />

        {/* CENTER — Question */}
        <QuestionPanel
  question={currentQuestion}
  qNumber={currentQIndex + 1}
  onAnswer={() => {
    setQuestionStates(prev => {
      const copy = [...prev];
      copy[currentQIndex] =
        copy[currentQIndex] === 2 ? 3 : 1;
      return copy;
    });
  }}
  onMark={() => {
    setQuestionStates(prev => {
      const copy = [...prev];
      copy[currentQIndex] =
        copy[currentQIndex] === 1 ? 3 : 2;
      return copy;
    });
  }}
  onNext={() =>
    setCurrentQIndex(i => Math.min(i + 1, 15))
  }
  onPrev={() =>
    setCurrentQIndex(i => Math.max(i - 1, 0))
  }
/>

        {/* RIGHT — Palette */}
        <QuestionPalette
  total={16}
  current={currentQIndex}
  states={questionStates}
  onJump={setCurrentQIndex}
/>
      </div>
    </>
  );
}
