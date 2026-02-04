"use client";

import { useState } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/*
  RC Sectional Flow (LOCKED):
  instructions → test → diagnosis → review → diagnosis → exit
*/

export default function RCSectionalContainer({ testData, onExit }) {
  const [phase, setPhase] = useState(
  testData?.__startPhase || "instructions"
);
  // instructions | test | diagnosis | review

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
        mode={phase}              // test | review
        initialState={result}     // used ONLY in review
        onSubmit={(payload) => {
          /**
           * payload must contain:
           * passages, questions, answers, questionTime
           */
          setResult(payload);
          setPhase("diagnosis");
        }}
        onExit={() => {
          // safety exit (rarely used)
          onExit();
        }}
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
