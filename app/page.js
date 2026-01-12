"use client";

import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSplit() {
    // Stronger paragraph detection:
    // 1. Normalize Windows/Mac line breaks
    const cleaned = text.replace(/\r\n/g, "\n");

    // 2. Split on TWO or more line breaks
    const parts = cleaned
      .split(/\n\s*\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 40); // ignore junk

    setParas(parts);
    setIndex(0);
    setExplanation("");
  }

  async function explainCurrent() {
    setLoading(true);
    setExplanation("");

    try {
      const res = await fetch("/api/rc-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paragraph: paras[index],
        }),
      });

      const data = await res.json();
      setExplanation(data.result || "No explanation returned.");
    } catch (e) {
      setExplanation("Error fetching explanation.");
    }

    setLoading(false);
  }

  const current = paras[index] || "";

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RC Mentor</h1>
      <p>Paste a passage. Let’s read it together.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your RC passage here..."
        style={{
          width: "100%",
          minHeight: 180,
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
          padding: "10px 16px",
          background: "#16a34a",
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
            disabled={loading}
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
            {loading ? "Thinking..." : "Explain this paragraph"}
          </button>

          <div style={{ marginTop: 16 }}>
            <strong>Simple Explanation:</strong>
            <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
              {explanation || "—"}
            </div>
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
