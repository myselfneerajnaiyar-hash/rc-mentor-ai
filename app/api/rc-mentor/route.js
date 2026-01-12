"use client";

import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  function splitPassage() {
    const parts = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 40);

    setParas(parts);
    setIndex(0);
    setResult("");
  }

  async function explain() {
    setLoading(true);
    setResult("");

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: paras[index],
      }),
    });

    const data = await res.json();
    setResult(data.result || "No explanation returned.");
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
        onClick={splitPassage}
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
              padding: 14,
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              border: "1px solid #e5e7eb",
              lineHeight: 1.6,
            }}
          >
            {current}
          </div>

          <button
            onClick={explain}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "8px 14px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Thinking..." : "Explain this paragraph"}
          </button>

          {result && (
            <div
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: 6,
                background: "#fff",
                border: "1px solid #e5e7eb",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {result}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => {
                setIndex(i => Math.max(0, i - 1));
                setResult("");
              }}
              disabled={index === 0}
            >
              Prev
            </button>

            <button
              onClick={() => {
                setIndex(i => Math.min(paras.length - 1, i + 1));
                setResult("");
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
