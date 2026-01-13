"use client";
import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("idle");
  // idle | showingPrimary | showingEasier | solved

  const [feedback, setFeedback] = useState("");

  const [phase, setPhase] = useState("mentor");
  // mentor | ready | test | result

  function splitPassage() {
    const raw = text.trim();

    let parts = raw
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    if (parts.length === 1) {
      const sentences = raw.match(/[^.!?]+[.!?]+/g) || [raw];

      parts = [];
      let current = "";

      for (let s of sentences) {
        if ((current + s).length > 300) {
          parts.push(current.trim());
          current = s;
        } else {
          current += " " + s;
        }
      }

      if (current.trim()) parts.push(current.trim());
    }

    setParas(parts);
    setIndex(0);
    setData(null);
    setMode("idle");
    setFeedback("");
    setPhase("mentor");
  }

  const current = paras[index] || "";

  async function explain() {
    if (!current) return;

    setLoading(true);
    setError("");
    setData(null);
    setFeedback("");
    setMode("idle");

    try {
      const res = await fetch("/api/rc-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph: current }),
      });

      if (!res.ok) throw new Error("API failed");

      const json = await res.json();
      setData(json);
      setMode("showingPrimary");
    } catch (e) {
      setError("Could not fetch explanation.");
    } finally {
      setLoading(false);
    }
  }

  function choose(optionIndex) {
    if (!data) return;

    if (mode === "showingPrimary") {
      if (optionIndex === data.primaryQuestion.correctIndex) {
        setFeedback("Correct. You're reading this paragraph the right way.");
        setMode("solved");
      } else {
        setFeedback("Not quite. Let’s try a simpler question on the same idea.");
        setMode("showingEasier");
      }
    } else if (mode === "showingEasier") {
      if (optionIndex === data.easierQuestion.correctIndex) {
        setFeedback("Correct. Good recovery.");
        setMode("solved");
      } else {
        setFeedback("Still off. Re-read the paragraph once and try again.");
      }
    }
  }

  function nextParagraph() {
    if (index === paras.length - 1) {
      setPhase("ready");
      return;
    }

    setIndex(i => Math.min(paras.length - 1, i + 1));
    setData(null);
    setMode("idle");
    setFeedback("");
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

      {paras.length > 0 && phase === "mentor" && (
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

          {data && (
            <div style={{ marginTop: 20 }}>
              <h4>Simple Explanation</h4>
              <p>{data.explanation}</p>

              <h4>Difficult Words</h4>
              <ul>
                {data.difficultWords.map((d, i) => (
                  <li key={i}>
                    <b>{d.word}</b>: {d.meaning}
                  </li>
                ))}
              </ul>

              {mode === "showingPrimary" && (
                <>
                  <h4>Question</h4>
                  <p>{data.primaryQuestion.prompt}</p>
                  {data.primaryQuestion.options.map((o, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
                      {o}
                    </button>
                  ))}
                </>
              )}

              {mode === "showingEasier" && (
                <>
                  <h4>Simpler Question</h4>
                  <p>{data.easierQuestion.prompt}</p>
                  {data.easierQuestion.options.map((o, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
                      {o}
                    </button>
                  ))}
                </>
              )}

              {feedback && <p style={{ marginTop: 10 }}>{feedback}</p>}

              {mode === "solved" && (
                <button
                  onClick={nextParagraph}
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
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {phase === "ready" && (
        <div
          style={{
            marginTop: 40,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            You’ve now understood this passage in depth.
            <br />
            We broke down every paragraph and clarified the ideas.
            <br /><br />
            Let’s see how well this understanding translates into performance.
          </p>

          <button
            onClick={() => setPhase("test")}
            style={{
              padding: "10px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Take Test
          </button>

          <button
            onClick={() => setPhase("mentor")}
            style={{
              marginLeft: 12,
              padding: "10px 16px",
              background: "#eee",
              border: "1px solid #ccc",
              borderRadius: 6,
            }}
          >
            Skip for Now
          </button>
        </div>
      )}
    </main>
  );
}
