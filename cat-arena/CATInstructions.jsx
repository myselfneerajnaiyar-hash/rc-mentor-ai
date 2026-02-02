"use client";

import { useState } from "react";

export default function CATInstructions({ onStart }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "24px 28px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        lineHeight: 1.6,
      }}
    >
      <h2 style={{ marginBottom: 16 }}>CAT RC Sectional – Instructions</h2>

      {/* GENERAL */}
      <section style={{ marginBottom: 20 }}>
        <h4>General Instructions</h4>
        <ul>
          <li>This test contains <b>4 Reading Comprehension passages</b>.</li>
          <li>Each passage has <b>4 questions</b>, making a total of <b>16 questions</b>.</li>
          <li>The total duration of the test is <b>30 minutes</b>.</li>
          <li>The test will be <b>auto-submitted</b> when the timer ends.</li>
          <li>Do <b>not refresh</b> the page during the test.</li>
        </ul>
      </section>

      {/* MARKING */}
      <section style={{ marginBottom: 20 }}>
        <h4>Marking Scheme</h4>
        <ul>
          <li><b>+3 marks</b> for every correct answer</li>
          <li><b>−1 mark</b> for every incorrect answer</li>
          <li><b>0 marks</b> for unattempted questions</li>
        </ul>
      </section>

      {/* NAVIGATION */}
      <section style={{ marginBottom: 20 }}>
        <h4>Navigation & Actions</h4>
        <ul>
          <li>
            <b>Save & Next</b> – saves your response and moves to the next question
          </li>
          <li>
            <b>Mark for Review</b> – marks the question for later review
          </li>
          <li>
            <b>Clear Response</b> – removes the selected option
          </li>
          <li>You may navigate freely between questions during the test</li>
        </ul>
      </section>

      {/* PALETTE */}
      <section style={{ marginBottom: 20 }}>
        <h4>Question Palette</h4>
        <ul>
          <li><b>Not Visited</b> – You have not opened the question</li>
          <li><b>Not Answered</b> – You have viewed but not answered</li>
          <li><b>Answered</b> – You have answered the question</li>
          <li><b>Marked for Review</b> – Question marked but not answered</li>
          <li><b>Answered & Marked</b> – Answered and marked for review</li>
        </ul>
      </section>

      {/* FINAL NOTE */}
      <section style={{ marginBottom: 24 }}>
        <p>
          Please read all instructions carefully before starting the test.
          Once the test begins, the timer cannot be paused.
        </p>
      </section>

      {/* CONFIRM */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
          />
          I have read and understood the instructions
        </label>
      </div>

      {/* START BUTTON */}
      <button
        disabled={!confirmed}
        onClick={onStart}
        style={{
          padding: "12px 22px",
          background: confirmed ? "#2563eb" : "#94a3b8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          cursor: confirmed ? "pointer" : "not-allowed",
        }}
      >
        Start Test
      </button>
    </div>
  );
}
