"use client";
import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function splitPassage() {
    let parts = [];

    // First try blank-line splitting
    if (/\n\s*\n/.test(text)) {
      parts = text
        .split(/\n\s*\n+/)
        .map(p => p.trim())
        .filter(Boolean);
    }

    // If still not enough, force into ~4 chunks
    if (parts.length < 4) {
      const sentences = text.split(/(?<=[.!?])\s+/);
      const total = sentences.length;
      const size = Math.ceil(total / 4);

      parts = [];
      for (let i = 0; i < total; i += size) {
        parts.push(sentences.slice(i, i + size).join(" "));
      }
    }

    setParas(parts.filter(Boolean));
    setIndex(0);
    setResult(null);
    setError("");
  }

  const current = paras[index] || "";

  async function explain() {
    if (!current) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/rc-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph: current }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Could not fetch explanation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RC Mentor</h1>

      {paras.length === 0 && (
        <>
          <p>Paste a passage. Let’s read it together.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: "100%",
              minHeight: 180,
              padding: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={splitPassage}
            style={{
              marginTop: 12,
              padding: "10px 16px",
              background: "green",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Split Passage 🌱
          </button>
        </>
      )}

      {paras.length > 0 && (
        <>
          <h3>
            Paragraph {index + 1} of {paras.length}
          </h3>

          <div
            style={{
              background: "#f5f5f5",
              padding: 14,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              whiteSpace: "pre-wrap",
            }}
          >
            {current}
          </div>

          <button
            onClick={explain}
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
            Explain this paragraph
          </button>

          {loading && <p>Thinking…</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {result && (
            <div style={{ marginTop: 20 }}>
              <h4>Simple Explanation</h4>
              <p>{result.explanation}</p>

              <h4>Difficult Words</h4>
              <ul>
                {result.difficultWords.map((d, i) => (
                  <li key={i}>
                    <b>{d.word}</b>: {d.meaning}
                  </li>
                ))}
              </ul>

              <h4>Question</h4>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {result.question}
              </p>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => {
                setIndex(i => Math.max(0, i - 1));
                setResult(null);
              }}
              disabled={index === 0}
            >
              Prev
            </button>
            <button
              onClick={() => {
                setIndex(i => Math.min(paras.length - 1, i + 1));
                setResult(null);
              }}
              disabled={index === paras.length - 1}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
