"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DrillPage() {
  const router = useRouter();

  const [stage, setStage] = useState("loading");
  // loading | ready | test

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("ready");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (stage === "loading") {
    return (
      <div style={{ padding: 40 }}>
        <h2>Preparing your CAT RC Test...</h2>
        <p>Generating passage-based questions.</p>
      </div>
    );
  }

  if (stage === "ready") {
    return (
      <div style={{ padding: 40 }}>
        <h2>Your passage is ready.</h2>
        <p>How would you like to approach it?</p>

        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          <button
            style={{
              padding: "14px 24px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
            }}
            onClick={() => setStage("test")}
          >
            Guided Explanation Mode
          </button>

          <button
            style={{
              padding: "14px 24px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
            }}
            onClick={() => setStage("test")}
          >
            Take it as a Test
          </button>
        </div>
      </div>
    );
  }

  if (stage === "test") {
    return (
      <div style={{ padding: 40 }}>
        <h2>Mini RC Test</h2>
        <p>⏱ Timer running...</p>

        {/* Replace this with your actual MiniRCTest component */}
        <div style={{ marginTop: 20 }}>
          <p>Passage and questions go here...</p>
        </div>

        <button
          onClick={() => router.push("/rc/profile")}
          style={{
            marginTop: 30,
            padding: "12px 20px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
          }}
        >
          Finish & Return to Dashboard
        </button>
      </div>
    );
  }
}