"use client";

import { useState } from "react";
import CATArenaLanding from "./CATArenaLanding";
import RCSectionalRunner from "./rc/RCSectionalRunner";
import DiagnosisView from "./rc/components/DiagnosisView";
import CATAnalytics from "../components/CATAnalytics";

/*
  Arena Modes:
  - landing       : CAT Arena home
  - rc-test       : RC test running
  - rc-diagnosis  : Diagnosis report
  - rc-review     : Question review
*/

export default function CATArenaView() {
  const [arenaMode, setArenaMode] = useState("landing");

  // which sectional test (01, 02, etc.)
  const [activeTestId, setActiveTestId] = useState(null);

  // persisted test result (in-memory for now)
  const [lastRCResult, setLastRCResult] = useState(null);

  const [activeTab, setActiveTab] = useState("tests");
// "tests" | "analytics"

  /* ------------------ ACTIONS ------------------ */

  function startRCTest(testId) {
    setActiveTestId(testId);
    setArenaMode("rc-test");
  }

  function exitToArena() {
    setArenaMode("landing");
  }

  function onRCTestCompleted(resultPayload) {
    // resultPayload = { passages, questions, answers, questionTime }
    setLastRCResult(resultPayload);
    setArenaMode("rc-diagnosis");
  }

  function openDiagnosis() {
    if (!lastRCResult) return;
    setArenaMode("rc-diagnosis");
  }

  function openReview() {
    if (!lastRCResult) return;
    setArenaMode("rc-review");
  }

  /* ------------------ RENDER ------------------ */

  return (
    <>
      {/* ---------------- LANDING ---------------- */}
      {arenaMode === "landing" && (
        <CATArenaLanding
          onStartRC={() => startRCTest("rc-sectional-01")}
          onViewDiagnosis={openDiagnosis}
          onReviewTest={openReview}
          hasAttemptedRC={!!lastRCResult}
        />
      )}

      {/* ---------------- RC TEST ---------------- */}
      {arenaMode === "rc-test" && (
        <RCSectionalRunner
          testId={activeTestId}
          onExit={exitToArena}
          onComplete={onRCTestCompleted}
        />
      )}

      {/* ---------------- DIAGNOSIS ---------------- */}
      {arenaMode === "rc-diagnosis" && lastRCResult && (
        <DiagnosisView
          passages={lastRCResult.passages}
          questions={lastRCResult.questions}
          answers={lastRCResult.answers}
          questionTime={lastRCResult.questionTime}
          onReview={() => setArenaMode("rc-review")}
          onExit={exitToArena}
        />
      )}

      {/* ---------------- REVIEW ---------------- */}
      {arenaMode === "rc-review" && lastRCResult && (
        <RCSectionalRunner
          testId={activeTestId}
          mode="review"
          initialState={lastRCResult}
          onExit={() => setArenaMode("rc-diagnosis")}
        />
      )}
    </>
  );
}
