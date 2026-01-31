"use client";

import { useState } from "react";
import CATArenaLanding from "./CATArenaLanding";
import RCSectionalRunner from "./rc/RCSectionalRunner";
import VocabSectionalRunner from "./vocab/VocabSectionalRunner";

export default function CATArenaView() {
  // which screen user is on inside CAT Arena
  const [arenaScreen, setArenaScreen] = useState("landing");
  // which test is currently running
  const [activeTestId, setActiveTestId] = useState(null);

  // ---- navigation handlers ----
  function startRCTest(testId) {
    setActiveTestId(testId);
    setArenaScreen("rc");
  }

  function startVocabTest(testId) {
    setActiveTestId(testId);
    setArenaScreen("vocab");
  }

  function goBackToLanding() {
    setActiveTestId(null);
    setArenaScreen("landing");
  }

  return (
    <>
      {arenaScreen === "landing" && (
        <CATArenaLanding
          onStartRC={startRCTest}
          onStartVocab={startVocabTest}
        />
      )}

      {arenaScreen === "rc" && (
        <RCSectionalRunner
          testId={activeTestId}
          onExit={goBackToLanding}
        />
      )}

      {arenaScreen === "vocab" && (
        <VocabSectionalRunner
          testId={activeTestId}
          onExit={goBackToLanding}
        />
      )}
    </>
  );
}
