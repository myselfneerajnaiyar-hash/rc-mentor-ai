"use client";
import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);

  const [result, setResult] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | explained | primary | easier | correct
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  function splitPassage() {
    let parts = [];

    if (/\n\s*\n/.test(text)) {
      parts = text
        .split(/\n\s*\n+/)
        .map(p => p.trim())
        .filter(Boolean);
    }

    if (parts.length < 2) {
      const sentences = text.split(/(?<=[.!?])\s+/);
      const size = Math.ceil(sentences.length / 4);
      parts = [];
      for (let i = 0; i < sentences.length; i += size) {
        parts.push(sentences.slice(i, i + size).join(" "));
      }
    }

    setParas(parts.filter(Boolean));
    setIndex(0);
    setResult(null);
    setStage("idle");
    setFeedback("");
  }

  const current = paras[index] || "";

  async function explain() {
    if (!current) return;
    setLoading(true);
    setFeedback("");
    setStage("idle");

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paragraph: current }),
    });

    const data = await res.json();
    setResult(data);
    setStage("explained");
    setLoading(false);
  }

  function choose(optionIndex) {
    if (!result) return;

    if (stage === "primary") {
      if (optionIndex === result.primaryQuestion.correctIndex) {
        setFeedback("Correct. You’re reading this paragraph the right way.");
        setStage("correct");
      } else {
        setFeedback("Not quite. Let’s try a simpler question on the same idea.");
        setStage("easier");
      }
    } else if (stage === "easier") {
      if (optionIndex === result.easierQuestion.correctIndex) {
        setFeedback("Good. That’s the right direction.");
        setStage("correct");
      } else {
        setFeedback("Let’s pause here and reread the paragraph slowly.");
      }
    }
  }

  function nextPara() {
    if (index < paras.length - 1) {
      setIndex(i => i + 1);
      setResult(null);
      setStage("idle");
      setFeedback("");
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

          {!result && (
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
          )}

          {loading && <p>Thinking…</p>}

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

              {stage === "explained" && (
                <>
                  <h4>Question</h4>
                  <p>{result.primaryQuestion.prompt}</p>
                  {result.primaryQuestion.options.map((op, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
                      {op}
                    </button>
                  ))}
                  {setStage && setStage("primary")}
                </>
              )}

              {stage === "primary" && (
                <>
                  <h4>Question</h4>
                  <p>{result.primaryQuestion.prompt}</p>
                  {result.primaryQuestion.options.map((op, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
                      {op}
                    </button>
                  ))}
                </>
              )}

              {stage === "easier" && (
                <>
                  <h4>Simpler Question</h4>
                  <p>{result.easierQuestion.prompt}</p>
                  {result.easierQuestion.options.map((op, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
                      {op}
                    </button>
                  ))}
                </>
              )}

              {feedback && <p style={{ marginTop: 10 }}>{feedback}</p>}

              {stage === "correct" && (
                <button
                  onClick={nextPara}
                  style={{
                    marginTop: 12,
                    padding: "8px 14px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Next Paragraph →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
