"use client";
import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function splitPassage() {
    const parts = text
      .split(/\n\s*\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    setParas(parts);
    setIndex(0);
    setResult(null);
  }

  const current = paras[index];

  async function explain() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paragraph: current }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
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
            style={{ width: "100%", minHeight: 180, padding: 12 }}
          />
          <button
            onClick={splitPassage}
            style={{ marginTop: 12, padding: "10px 16px", background: "green", color: "#fff" }}
          >
            Split Passage 🌱
          </button>
        </>
      )}

      {paras.length > 0 && (
        <>
          <h3>Paragraph {index + 1} of {paras.length}</h3>

          <div style={{ background: "#f5f5f5", padding: 14, borderRadius: 6 }}>
            {current}
          </div>

          <button onClick={explain} style={{ marginTop: 12 }}>
            Explain this paragraph
          </button>

          {loading && <p>Thinking…</p>}

          {result && (
            <div style={{ marginTop: 20 }}>
              <h4>Simple Explanation</h4>
              <p>{result.explanation}</p>

              <h4>Difficult Words</h4>
              <ul>
                {result.difficultWords.map((d, i) => (
                  <li key={i}><b>{d.word}</b>: {d.meaning}</li>
                ))}
              </ul>

              <h4>Question</h4>
              <pre style={{ whiteSpace: "pre-wrap" }}>{result.question}</pre>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
              Prev
            </button>
            <button
              onClick={() => { setIndex(i => Math.min(paras.length - 1, i + 1)); setResult(null); }}
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
