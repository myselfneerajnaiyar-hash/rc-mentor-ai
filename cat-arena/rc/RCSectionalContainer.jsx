"use client";

import { useEffect, useState } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";
import MobileRCSectional from "../../app/components/MobileRCSectional";

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
  if (!Array.isArray(all[sectionalId])) {
    all[sectionalId] = [];
  }

  all[sectionalId].push({
    attemptId: Date.now().toString(),
    timestamp: Date.now(),
    ...payload,
  });

  saveAll(all);
}

function loadAttempts(sectionalId) {
  const all = loadAll();
  return Array.isArray(all[sectionalId]) ? all[sectionalId] : [];
}

/* ================= COMPONENT ================= */

export default function RCSectionalContainer({ testData, onExit }) {
  const sectionalId = testData.id;

  const [phase, setPhase] = useState(
    testData.__startPhase || "instructions"
  );

  const [attempts, setAttempts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  /* ---- Mobile detection ---- */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ---- Load attempts ---- */
  useEffect(() => {
    const list = loadAttempts(sectionalId);
    setAttempts(list);

    if (!list.length) return;

    if (testData.__attemptId) {
      const idx = list.findIndex(
        a => a.attemptId === testData.__attemptId
      );
      setActiveIndex(idx !== -1 ? idx : list.length - 1);
    } else {
      setActiveIndex(list.length - 1);
    }
  }, [sectionalId, testData.__attemptId]);

  const activeAttempt =
    activeIndex !== null ? attempts[activeIndex] : null;

  /* ---------------- INSTRUCTIONS ---------------- */
  if (phase === "instructions") {
    return <CATInstructions onStart={() => setPhase("test")} />;
  }

  /* ---------------- TEST ---------------- */
  if (phase === "test") {
    return isMobile ? (
      <MobileRCSectional
        passage={testData.passages[0]?.text || ""}
        question={testData.passages[0]?.questions[0]}
        options={testData.passages[0]?.questions[0]?.options || []}
        durationSeconds={30 * 60}
        currentQuestionIndex={0}
        totalQuestions={testData.passages.length * 4}
        questionStates={[]}
        onSelectOption={() => {}}
        onNext={() => {}}
        onMark={() => {}}
        onClear={() => {}}
        onJump={() => {}}
        onSubmit={() => {
          saveAttempt(sectionalId, {});
          setPhase("diagnosis");
        }}
      />
    ) : (
      <CATArenaTestView
        testData={testData}
        mode="test"
        onSubmit={(payload) => {
          saveAttempt(sectionalId, payload);
          window.dispatchEvent(new Event("CAT_ATTEMPT_SAVED"));
          const updated = loadAttempts(sectionalId);
          setAttempts(updated);
          setActiveIndex(updated.length - 1);
          setPhase("diagnosis");
        }}
      />
    );
  }

  /* ---------------- REVIEW ---------------- */
  if (phase === "review" && activeAttempt) {
    return (
      <CATArenaTestView
        testData={testData}
        mode="review"
        initialState={activeAttempt}
        onSubmit={() => setPhase("diagnosis")}
      />
    );
  }

  /* ---------------- DIAGNOSIS ---------------- */
  if (phase === "diagnosis" && activeAttempt) {
    return (
      <DiagnosisView
        passages={activeAttempt.passages}
        questions={activeAttempt.questions}
        answers={activeAttempt.answers}
        questionTime={activeAttempt.questionTime}
        onReview={() => setPhase("review")}
        onBack={onExit}
      />
    );
  }

  return null;
}
