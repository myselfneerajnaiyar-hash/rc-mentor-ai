"use client";

import { useState, useEffect } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";

/* ================= STORAGE ================= */

const STORAGE_KEY = "catRCResults";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveAttempt(sectionalId, payload) {
  const all = loadAll();

  // 🛡️ force-correct corrupted data
  if (!Array.isArray(all[sectionalId])) {
    all[sectionalId] = [];
  }

  all[sectionalId].push({
    attemptId: Date.now().toString(),
    timestamp: Date.now(),
    ...payload,
  });

  saveAll(all);


function getLatestAttempt(sectionalId) {
  const all = loadAll();
  const list = all[sectionalId] || [];
  return list.length ? list[list.length - 1] : null;
}

/* ================= COMPONENT ================= */

export default function RCSectionalContainer({ testData, onExit }) {
  const sectionalId = testData.id;

  const [phase, setPhase] = useState(
    testData.__startPhase || "instructions"
  );

  const [result, setResult] = useState(null);

  /* ---- load stored attempt for review / diagnosis ---- */
  useEffect(() => {
    if (phase === "diagnosis" || phase === "review") {
      const latest = getLatestAttempt(sectionalId);
      if (latest) setResult(latest);
    }
  }, [phase, sectionalId]);

  /* ---------------- INSTRUCTIONS ---------------- */
  if (phase === "instructions") {
    return (
      <CATInstructions
        onStart={() => setPhase("test")}
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
          saveAttempt(sectionalId, payload);
          setResult(payload);
          setPhase("diagnosis");
        }}
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
