"use client";

import { useState } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

export default function RCSectionalContainer({ testData, onExit }) {
  const [phase, setPhase] = useState("instructions");
  // instructions | test | diagnosis | review

  const [result, setResult] = useState(null);

  return (
    <>
      {phase === "instructions" && (
        <CATInstructions onStart={() => setPhase("test")} />
      )}

      {(phase === "test" || phase === "review") && (
        <CATArenaTestView
          testData={testData}
          mode={phase}
          initialState={result}
          onSubmit={(payload) => {
            setResult(payload);
            setPhase("diagnosis");
          }}
        />
      )}

      {phase === "diagnosis" && result && (
        <DiagnosisView
          passages={result.passages}
          questions={result.questions}
          answers={result.answers}
          questionTime={result.questionTime}
          onReview={() => setPhase("review")}
          onBack={onExit}
        />
      )}
    </>
  );
}
