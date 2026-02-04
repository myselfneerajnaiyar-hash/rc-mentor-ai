"use client";

import { useState, useEffect, useRef } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/*
  STORAGE CONTRACT (LOCKED)
  localStorage.catRCResults = {
    [sectionalId]: {
      passages,
      questions,
      answers,
      questionTime
    }
  }
*/

const STORAGE_KEY = "catRCResults";

function loadAllResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveResult(sectionalId, result) {
  const all = loadAllResults();
  all[sectionalId] = result;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function loadResult(sectionalId) {
  const all = loadAllResults();
  return all[sectionalId] || null;
}

export default function RCSectionalContainer({ testData, onExit }) {
  const sectionalId = testData.id;

  // ✅ phase bootstrap (ONCE)
  const startPhaseUsed = useRef(false);
  const [phase, setPhase] = useState(() => {
    if (!startPhaseUsed.current && testData.__startPhase) {
      startPhaseUsed.current = true;
      return testData.__startPhase;
    }
    return "instructions";
  });

  const [result, setResult] = useState(null);

  // ✅ Load stored result if entering diagnosis/review
  useEffect(() => {
    if (phase === "diagnosis" || phase === "review") {
      const stored = loadResult(sectionalId);
      if (stored) {
        setResult(stored);
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
        initialState={phase === "review" ? result : null}
        onSubmit={(payload) => {
          saveResult(sectionalId, payload);   // ✅ PER-SECTION SAVE
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
