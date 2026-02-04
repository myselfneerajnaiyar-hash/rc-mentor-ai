"use client";

import { useState, useEffect, useRef } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

const STORAGE_KEY = "catRCResults";

export default function RCSectionalContainer({ testData, onExit }) {
  const startPhaseUsed = useRef(false);

  const [phase, setPhase] = useState(() => {
    if (!startPhaseUsed.current && testData?.__startPhase) {
      startPhaseUsed.current = true;
      return testData.__startPhase;
    }
    return "instructions";
  });

  const [result, setResult] = useState(null);

  /* 🔑 LOAD STORED RESULT BEFORE DIAGNOSIS / REVIEW */
  useEffect(() => {
    if (phase === "diagnosis" || phase === "review") {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const stored = all[testData.id];

      if (stored && stored.questions && stored.answers) {
        setResult(stored);
      }
    }
  }, [phase, testData.id]);

  /* ---------------- INSTRUCTIONS ---------------- */
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

  /* ---------------- TEST / REVIEW ---------------- */
  if (phase === "test" || phase === "review") {
    return (
      <CATArenaTestView
        testData={testData}
        mode={phase}
        initialState={phase === "review" ? result : null}
        onSubmit={(payload) => {
          // 🚨 THIS IS THE MOST IMPORTANT PART
          const cleanPayload = {
            passages: payload.passages || [],
            questions: payload.questions || [],
            answers: payload.answers || {},
            questionTime: payload.questionTime || {},
          };

          const all = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "{}"
          );

          all[testData.id] = cleanPayload;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

          setResult(cleanPayload);
          setPhase("diagnosis");
        }}
        onExit={onExit}
      />
    );
  }

  /* ---------------- DIAGNOSIS ---------------- */
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
