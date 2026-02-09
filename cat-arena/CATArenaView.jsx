"use client";

import { useState } from "react";
import CATArenaLanding from "./CATArenaLanding";
import RCSectionalRunner from "./rc/RCSectionalRunner";
import DiagnosisView from "./rc/components/DiagnosisView";
import CATAnalytics from "../components/CATAnalytics";

/*
  Arena Modes:
  - landing
  - rc-test
  - rc-diagnosis
  - rc-review
*/

export default function CATArenaView() {
  /* ---------------- TABS ---------------- */
  const [activeTab, setActiveTab] = useState("tests"); // tests | analytics

  /* ---------------- ARENA STATE ---------------- */
  const [arenaMode, setArenaMode] = useState("landing");
  const [activeTestId, setActiveTestId] = useState(null);
  const [lastRCResult, setLastRCResult] = useState(null);

  /* ---------------- ACTIONS ---------------- */

  function startRCTest(testId) {
    setActiveTestId(testId);
    setArenaMode("rc-test");
  }

  function exitToArena() {
    setArenaMode("landing");
  }

  function onRCTestCompleted(resultPayload) {
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

  /* ---------------- RENDER ---------------- */

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* ================= TOP TABS ================= */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 12,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setActiveTab("tests")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 12,
            fontWeight: 600,
            border: "none",
            background: activeTab === "tests" ? "#2563eb" : "#e5e7eb",
            color: activeTab === "tests" ? "#ffffff" : "#111827",
          }}
        >
          Take Tests
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 12,
            fontWeight: 600,
            border: "none",
            background: activeTab === "analytics" ? "#2563eb" : "#e5e7eb",
            color: activeTab === "analytics" ? "#ffffff" : "#111827",
          }}
        >
          Analytics
        </button>
      </div>

      {/* ================= TAB CONTENT ================= */}

      {/* -------- TAKE TESTS TAB -------- */}
      {activeTab === "tests" && (
        <>
          {arenaMode === "landing" && (
            <CATArenaLanding
              onStartRC={() => startRCTest("rc-sectional-01")}
              onViewDiagnosis={openDiagnosis}
              onReviewTest={openReview}
              hasAttemptedRC={!!lastRCResult}
            />
          )}

          {arenaMode === "rc-test" && (
            <RCSectionalRunner
              testId={activeTestId}
              onExit={exitToArena}
              onComplete={onRCTestCompleted}
            />
          )}

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

          {arenaMode === "rc-review" && lastRCResult && (
            <RCSectionalRunner
              testId={activeTestId}
              mode="review"
              initialState={lastRCResult}
              onExit={() => setArenaMode("rc-diagnosis")}
            />
          )}
        </>
      )}

      {/* -------- ANALYTICS TAB -------- */}
      {activeTab === "analytics" && <CATAnalytics />}
    </div>
  );
}
