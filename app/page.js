"use client";

import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);

  function handleDissect() {
    // Split strictly by blank lines
    const parts = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    setParas(parts);
    setIndex(0);
  }

  const current = paras[index] || "";

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RC Mentor</h1>
      <p>Paste a passage. Let’s read it together.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your RC passage here..."
        style={{
          width: "100%",
          minHeight: 160,
          padding: 12,
          fontSize: 14,
          border: "1px solid #ccc",
          borderRadius: 6,
        }}
      />

      <button
        onClick={handleDissect}
        style={{
          marginTop: 12,
          padding: "10px 16px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Let’s dissect 🚀
      </button>

      {current && (
        <div style={{ marginTop: 30 }}>
          <h3>Paragraph {index + 1}</h3>

          <div
            style={{
              background: "#f8fafc",
              padding: 12,
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              border: "1px solid #e5e7eb",
            }}
          >
            {current}
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Simple Explanation:</strong>
            <p style={{ marginTop: 6 }}>
              This paragraph is saying the same idea in a simpler way. The goal
              here is to first *see the paragraph exactly as it is*, and only
              then think about what it means in easier language.
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Prev
            </button>
            <button
              onClick={() => setIndex(i => Math.min(paras.length - 1, i + 1))}
              disabled={index >= paras.length - 1}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
