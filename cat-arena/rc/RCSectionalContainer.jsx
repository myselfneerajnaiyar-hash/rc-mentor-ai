"use client";

import { useState, useRef, useEffect } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/*
  RC Sectional Flow (LOCKED & SAFE):
  instructions → test → diagnosis → review → diagnosis → exit

  RULE:
  diagnosis/review is allowed ONLY if result exists
*/

export default function RCSectionalContainer({ testData, onExit }) {
  const startPhaseUsed = useRef(false);

  const [phase, setPhase] = useState("instructions");
  const [result, setResult] = useState(null);

  /* -------------------- INITIAL PHASE RESOLUTION -------------------- */
  useEffect(() => {
    if (startPhaseUsed.current) return;
    startPhaseUsed.current = true;

    const requested = testData?.__startPhase;

    // 🚨 SAFETY RULE
    if ((requested === "diagnosis" || requested === "review") && !result) {
      setPhase("instructions");
      return;
    }

    if (requested) {
      setPhase(requested);
    }
  }, [testData, result]);

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
        mode={phase}
        initialState={phase === "review" ? result : null}
        onSubmit={(payload) => {
          setResult(payload);
          setPhase("diagnosis");
        }}
        onExit={onExit}
      />
    );
  }

  /* -------------------- DIAGNOSIS -------------------- */
  if (phase === "diagnosis") {
    if (!result) {
      // 🛡 Absolute safety fallback
      setPhase("instructions");
      return null;
    }

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

  return null;
}
