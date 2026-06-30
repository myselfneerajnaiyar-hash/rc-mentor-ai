"use client";

import { useState } from "react";
import CATArenaLanding from "./CATArenaLandingV2";
import RCSectionalContainer from "./rc/RCSectionalContainerV2";
import CATAnalytics from "../app/components/CATAnalytics";
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

  const inTest = arenaMode === "rc-test";
 return (
  <div
    style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#e2e8f0",
      padding: inTest ? 0 : 24,
    }}
  >

      {/* Tabs */}
     {!inTest && (
  <TabGroup
    tabs={[
      { value: "tests", label: "Take Tests" },
      { value: "analytics", label: "Analytics" },
    ]}
    active={activeTab}
    onChange={setActiveTab}
  />
)}

    
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