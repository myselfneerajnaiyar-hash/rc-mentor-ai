"use client";

import { useState, useRef, useEffect } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/*
  RC Sectional Flow (LOCKED & SAFE):
  instructions → test → diagnosis → review → diagnosis → exit
*/

const MASTER_KEY = "catRCResults"; // 🔒 ONE SOURCE OF TRUTH

export default function RCSectionalContainer({ testData, onExit }) {
  const sectionalId = testData?.id;

  const startPhaseUsed = useRef(false);

  const [phase, setPhase] = useState(() => {
    if (!startPhaseUsed.current && testData?.__startPhase) {
      startPhaseUsed.current = true;
      return testData.__startPhase;
    }
    return "instructions";
  });

  const [result, setResult] = useState(null);

  /* -------------------- LOAD STORED RESULT -------------------- */
  useEffect(() => {
    if ((phase === "diagnosis" || phase === "review") && !result) {
      const all = JSON.parse(localStorage.getItem(MASTER_KEY) || "{}");
      if (all[sectionalId]) {
        setResult(all[sectionalId]);
      } else {
        setPhase("instructions");
      }
    }
  }, [phase, sectionalId]);

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
        initialState={result}
        onSubmit={(payload) => {
          // 🔒 SAVE UNDER MASTER MAP
          const all = JSON.parse(localStorage.getItem(MASTER_KEY) || "{}");
          all[sectionalId] = payload;
          localStorage.setItem(MASTER_KEY, JSON.stringify(all));

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

  return null;
}
