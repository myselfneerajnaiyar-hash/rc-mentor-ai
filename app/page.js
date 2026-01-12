"use client";

import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");

  function handleDissect() {
    const parts = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    setParas(parts);
    setIndex(0);
    setExplanation("");
  }

  const current = paras[index] || "";

  async function explainCurrent() {
    if (!current) return;

    setLoading(true);
    setExplanation("");

    try {
      const res = await fetch("/api/rc-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph: current }),
      });

      const data = await res.json();
      setExplanation(data.output || "No explanation returned.");
    } catch (e) {
      setExplanation("Error talking to mentor.");
    }

    setLoading(false);
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
        onClick={handleDissect}
        style={{
          marginTop: 12,
          padding: "10px 16px",
          background: "#22c55e",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Split Passage 🌿
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

          <button
            onClick={explainCurrent}
            style={{
              marginTop: 12,
              padding: "8px 14px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Explain this paragraph
          </button>

          {loading && <p style={{ marginTop: 10 }}>Thinking…</p>}

          {explanation && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 6,
                whiteSpace: "pre-wrap",
              }}
            >
              {explanation}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => {
                setIndex(i => Math.max(0, i - 1));
                setExplanation("");
              }}
              disabled={index === 0}
            >
              Prev
            </button>

            <button
              onClick={() => {
                setIndex(i => Math.min(paras.length - 1, i + 1));
                setExplanation("");
              }}
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
