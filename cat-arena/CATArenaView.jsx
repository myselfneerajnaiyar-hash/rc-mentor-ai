"use client";

import { useState } from "react";
import CATArenaLanding from "./CATArenaLanding";
import RCSectionalContainer from "./rc/RCSectionalContainer";
import CATAnalytics from "../components/CATAnalytics";

export default function CATArenaView() {
  const [activeTab, setActiveTab] = useState("tests");
  const [arenaMode, setArenaMode] = useState("landing");
  const [activeTestId, setActiveTestId] = useState(null);
  const [forceDiagnosis, setForceDiagnosis] = useState(false);

  function startRCTest(testId) {
    setActiveTestId(testId);
    setForceDiagnosis(false);
    setArenaMode("rc-test");
  }

  function viewDiagnosis(testId) {
    setActiveTestId(testId);
    setForceDiagnosis(true);
    setArenaMode("rc-test");
  }

  function exitToArena() {
    setArenaMode("landing");
    setForceDiagnosis(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        <button
          onClick={() => setActiveTab("tests")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: activeTab === "tests" ? "#2563eb" : "#e5e7eb",
            color: activeTab === "tests" ? "#fff" : "#111827",
          }}
        >
          Take Tests
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: activeTab === "analytics" ? "#2563eb" : "#e5e7eb",
            color: activeTab === "analytics" ? "#fff" : "#111827",
          }}
        >
          Analytics
        </button>
      </div>

      {activeTab === "tests" && (
        <>
          {arenaMode === "landing" && (
            <CATArenaLanding
              onStartRC={startRCTest}
              onViewDiagnosis={viewDiagnosis}
            />
          )}

          {arenaMode === "rc-test" && activeTestId && (
            <RCSectionalContainer
              key={activeTestId + "-" + forceDiagnosis}
              testData={{ id: activeTestId }}
              forceDiagnosis={forceDiagnosis}
              onExit={exitToArena}
            />
          )}
        </>
      )}

      {activeTab === "analytics" && <CATAnalytics />}
    </div>
  );
}