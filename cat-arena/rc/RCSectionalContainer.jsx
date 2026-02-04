"use client";

import { useState, useRef } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/*
  RC Sectional Flow (LOCKED):
  instructions → test → diagnosis → review → diagnosis → exit
*/

export default function RCSectionalContainer({ testData, onExit }) {
  // ✅ use __startPhase ONLY ONCE
  const startPhaseUsed = useRef(false);

  const [phase, setPhase] = useState(() => {
    if (!startPhaseUsed.current && testData?.__startPhase) {
      startPhaseUsed.current = true;
      return testData.__startPhase;
    }
    return "instructions";
  });

  /**
   * resultPayload shape (LOCKED CONTRACT)
   * {
   *   passages,
   *   questions,
   *   answers,
   *   questionTime
   * }
   */
  const [result, setResult] = useState(null);

  /* -------------------- INSTRUCTIONS -------------------- */
  if (phase === "instructions") {
    return (
      <CATInstructions
        onStart={() => {
          setResult(null);
          setPhase("test");
        }}
      />
    );
  }

  /* -------------------- TEST / REVIEW -------------------- */
  if (phase === "test" || phase === "review") {
    return (
      <CATArenaTestView
        testData={testData}
        mode={phase}          // test | review
        initialState={result} // ONLY for review
        onSubmit={(payload) => {
          setResult(payload);
          setPhase("diagnosis");
        }}
        onExit={onExit}
      />
    );
  }

  /* -------------------- DIAGNOSIS -------------------- */
  if (phase === "diagnosis" && result) {
    return (
      <DiagnosisView
        passages={result.passages}
        questions={result.questions}
        answers={result.answers}
        questionTime={result.questionTime}
        onReview={() => setPhase("review")}
        onBack={onExit}
      />
    );
  }

  /* -------------------- SAFETY FALLBACK -------------------- */
  return null;
}
