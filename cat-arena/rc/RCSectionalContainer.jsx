"use client";

import { useState, useRef, useEffect } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/*
  RC Sectional Flow (LOCKED & SAFE):
  instructions → test → diagnosis → review → diagnosis → exit
*/

export default function RCSectionalContainer({ testData, onExit }) {
  const STORAGE_KEY = `catResult-${testData?.id}`;

  // ensure __startPhase is applied ONLY once
  const startPhaseUsed = useRef(false);

  const [phase, setPhase] = useState(() => {
    if (!startPhaseUsed.current && testData?.__startPhase) {
      startPhaseUsed.current = true;
      return testData.__startPhase;
    }
    return "instructions";
  });

  const [result, setResult] = useState(null);

  /* -------------------- LOAD STORED RESULT (CRITICAL FIX) -------------------- */
  useEffect(() => {
    if ((phase === "diagnosis" || phase === "review") && !result) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setResult(JSON.parse(saved));
      } else {
        // safety fallback
        setPhase("instructions");
      }
    }
  }, [phase]);

  /* -------------------- INSTRUCTIONS -------------------- */
  if (phase === "instructions") {
    return (
      <CATInstructions
        onStart={() => {
          setResult(null);
          localStorage.removeItem(STORAGE_KEY);
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
        initialState={result}     // used ONLY for review
        onSubmit={(payload) => {
          // ✅ STORE RESULT (THIS IS THE FIX)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

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
