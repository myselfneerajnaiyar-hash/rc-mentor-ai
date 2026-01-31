"use client";

import { useState } from "react";
import PassagePanel from "./components/PassagePanel";
import QuestionPanel from "./components/QuestionPanel";
import QuestionPalette from "./components/QuestionPalette";
import { sampleRCTest } from "./data/sampleRCTest";

export default function CATArenaTestView() {
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // 🔑 CORE RULE (DO NOT TOUCH)
  const passageIndex = Math.floor(currentQIndex / 4);

  const currentPassage = sampleRCTest.passages[passageIndex];
  const currentQuestion =
    currentPassage.questions[currentQIndex % 4];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32% 38% 30%",
        gap: 16,
        minHeight: "80vh",
      }}
    >
      {/* LEFT — Passage */}
      <PassagePanel passage={currentPassage} />

      {/* CENTER — Question */}
      <QuestionPanel
        question={currentQuestion}
        qNumber={currentQIndex + 1}
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
        onJump={setCurrentQIndex}
      />
    </div>
  );
}
