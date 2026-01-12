"use client";

import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [explainedIndex, setExplainedIndex] = useState(null);

  function handleSplit() {
    const parts = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    setParas(parts);
    setExplainedIndex(null);
  }

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
        onClick={handleSplit}
        style={{
          marginTop: 12,
          padding: "10px 18px",
          background: "#16a34a", // green
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Split Passage 🌿
      </button>

      {paras.length > 0 && (
        <div style={{ marginTop: 30 }}>
          {paras.map((p, i) => (
            <div
              key={i}
              style={{
                marginBottom: 24,
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  marginBottom: 10,
                }}
              >
                {p}
              </div>

              <button
                onClick={() => setExplainedIndex(i)}
                style={{
                  padding: "6px 12px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Explain this paragraph
              </button>

              {explainedIndex === i && (
                <div style={{ marginTop: 10 }}>
                  <strong>Simple Explanation:</strong>
                  <p style={{ marginTop: 6 }}>
                    This paragraph is being taken exactly as written above.
                    The explanation will always be based only on this paragraph,
                    not on the rest of the passage.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
