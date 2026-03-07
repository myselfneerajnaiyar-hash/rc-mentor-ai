"use client";

import { useState } from "react";
import CATArenaLanding from "./CATArenaLanding";
import RCSectionalContainer from "./rc/RCSectionalContainer";
import CATAnalytics from "../components/CATAnalytics";
import TabGroup from "../components/TabGroup";

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
  <div
  style={{
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: 24,
  }}
>

      {/* Tabs */}
      <TabGroup
  tabs={[
    { value: "tests", label: "Take Tests" },
    { value: "analytics", label: "Analytics" },
  ]}
  active={activeTab}
  onChange={setActiveTab}
/>

    
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