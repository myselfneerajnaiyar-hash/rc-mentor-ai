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
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 10,
        lineHeight: 1.6,
        color: "e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: 16 }}>CAT RC Sectional – Instructions</h2>

     {/* GENERAL */}
<section style={{ marginBottom: 20 }}>
  <h4>General Instructions</h4>

  <ul>
    <li>
      This sectional contains a total of <b>24 questions</b>.
    </li>

    <li>
      The first <b>16 questions</b> are Reading Comprehension based on <b>4 passages</b> (4 questions each).
    </li>

    <li>
      The remaining <b>8 questions</b> belong to the <b>Verbal Ability</b> section.
    </li>

    <li>
      The total duration of the test is <b>40 minutes</b>.
    </li>

    <li>
      The test will be <b>auto-submitted</b> when the timer expires.
    </li>

    <li>
      Do <b>not refresh or close</b> the browser during the test.
    </li>

  </ul>
</section>

     {/* MARKING */}
<section style={{ marginBottom: 20 }}>
  <h4>Marking Scheme</h4>

  <ul>

    <li>
      <b>+3 marks</b> for every correct answer.
    </li>

    <li>
      <b>-1 mark</b> for every incorrect <b>MCQ</b>.
    </li>

    <li>
      <b>No negative marking</b> for incorrect <b>TITA (Type In The Answer)</b> questions.
    </li>

    <li>
      <b>0 marks</b> for unattempted questions.
    </li>

  </ul>
</section>

    {/* NAVIGATION */}
<section style={{ marginBottom: 20 }}>
  <h4>Navigation & Actions</h4>

  <ul>

    <li>
      Use the <b>Question Palette</b> to jump to any question.
    </li>

    <li>
      You may freely switch between Reading Comprehension and Verbal Ability questions during the test.
    </li>

    <li>
      You can change your answer any number of times before submitting.
    </li>

    <li>
      Questions marked for review will still be evaluated if they contain an answer.
    </li>

    <li>
      Click <b>Submit Test</b> only after reviewing all your responses.
    </li>

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
          background: confirmed ? "#2563eb" : "#334155",
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
