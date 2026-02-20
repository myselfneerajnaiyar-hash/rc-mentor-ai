"use client";

import { useEffect, useState } from "react";

export default function WorkoutPage() {
  const [stage, setStage] = useState("speed");
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes
  const [running, setRunning] = useState(true);

  /* ---------------- TIMER LOGIC ---------------- */
  useEffect(() => {
    if (!running) return;

    if (timeLeft <= 0) {
      if (stage === "speed") {
        setStage("transition");
        setTimeout(() => {
          setStage("vocab");
          setTimeLeft(5 * 60);
        }, 3000);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, running, stage]);

  /* -------- Prevent accidental refresh -------- */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (stage !== "report" && stage !== "complete") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage]);

  /* ---------------- FORMAT TIMER ---------------- */
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /* ---------------- STAGE LABEL ---------------- */
  function getStageLabel() {
    if (stage === "speed") return "Speed Reading (5 min)";
    if (stage === "vocab") return "Vocabulary Drill (5 min)";
    if (stage === "transition") return "Transitioning...";
    return "";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f1f5f9",
        padding: "20px 16px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Today's Workout</h2>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>
            {getStageLabel()}
          </p>
        </div>

        {stage !== "transition" && (
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color:
                timeLeft < 15
                  ? "#ef4444"
                  : timeLeft < 60
                  ? "#f59e0b"
                  : "#f1f5f9",
            }}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      {stage === "speed" && (
        <div
          style={{
            background: "#1e293b",
            padding: 24,
            borderRadius: 16,
          }}
        >
          <h3>Speed Reading</h3>
          <p style={{ opacity: 0.8 }}>
            Read the paragraph below as quickly as possible while maintaining
            comprehension.
          </p>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "#0f172a",
              borderRadius: 12,
              lineHeight: 1.7,
              maxHeight: "50vh",
              overflowY: "auto",
            }}
          >
            The evolution of modern economies has often been explained as a
            gradual shift from agrarian systems toward industrial and finally
            service-based structures. Yet such linear narratives obscure the
            cyclical and often disruptive nature of technological change...
          </div>
        </div>
      )}

      {stage === "transition" && (
        <div
          style={{
            marginTop: 60,
            textAlign: "center",
          }}
        >
          <h2>Speed Complete</h2>
          <p>Next: Vocabulary Drill (5 min)</p>
        </div>
      )}

      {stage === "vocab" && (
        <div
          style={{
            background: "#1e293b",
            padding: 24,
            borderRadius: 16,
          }}
        >
          <h3>Vocabulary Drill</h3>
          <p style={{ opacity: 0.8 }}>
            (Vocab section coming next…)
          </p>
        </div>
      )}
    </div>
  );
}