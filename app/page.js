"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("idle");
  // idle | showingPrimary | showingEasier | solved

  const [feedback, setFeedback] = useState("");

  const [phase, setPhase] = useState("mentor");
  // mentor | ready | test | result

  // ---- TEST STATE ----
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});

  const testQuestions = [
    {
      prompt: "What is the central concern of the passage?",
      options: [
        "Technological progress is inevitable",
        "Attention is becoming fragmented",
        "Education systems are outdated",
        "People dislike reading",
      ],
      correct: 1,
    },
    {
      prompt: "The author is most critical of:",
      options: [
        "Human laziness",
        "Digital design choices",
        "Traditional education",
        "Scientific research",
      ],
      correct: 1,
    },
    {
      prompt: "Which best describes the tone of the passage?",
      options: [
        "Celebratory",
        "Neutral",
        "Reflective and concerned",
        "Humorous",
      ],
      correct: 2,
    },
    {
      prompt: "The passage primarily aims to:",
      options: [
        "Entertain",
        "Warn and explain",
        "Persuade politically",
        "Narrate history",
      ],
      correct: 1,
    },
  ];

  useEffect(() => {
    if (phase === "test") {
      setTimeLeft(6 * 60);
      setTimerRunning(true);
    }
  }, [phase]);

  useEffect(() => {
    if (!timerRunning) return;

    if (timeLeft <= 0) {
      setTimerRunning(false);
      setPhase("result");
      return;
    }

    const id = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [timerRunning, timeLeft]);

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

  function submitTest() {
    setTimerRunning(false);
    setPhase("result");
  }

  const score = testQuestions.reduce((s, q, i) => {
    return s + (testAnswers[i] === q.correct ? 1 : 0);
  }, 0);

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
          <p>
            You’ve now understood this passage in depth.  
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

      {phase === "test" && (
        <div
          style={{
            marginTop: 30,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>Mini RC Test</h2>
            <div style={{ fontWeight: 600 }}>
              ⏱ {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>

          {/* Scrollable Passage */}
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#f8fafc",
              maxHeight: 220,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            {paras.join("\n\n")}
          </div>

          {testQuestions.map((q, qi) => (
            <div
              key={qi}
              style={{
                marginBottom: 24,
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
              }}
            >
              <p style={{ fontWeight: 600 }}>
                Q{qi + 1}. {q.prompt}
              </p>

              {q.options.map((o, oi) => (
                <button
                  key={oi}
                  onClick={() =>
                    setTestAnswers(a => ({ ...a, [qi]: oi }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    margin: "6px 0",
                    padding: "8px 10px",
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    background:
                      testAnswers[qi] === oi ? "#c7d2fe" : "#f9fafb",
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          ))}

          <button
            onClick={submitTest}
            style={{
              padding: "12px 18px",
              background: "green",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Submit Test
          </button>
        </div>
      )}

      {phase === "result" && (
        <div style={{ marginTop: 40 }}>
          <h2>Your Score: {score} / {testQuestions.length}</h2>
          <p>
            This score reflects how well your understanding converted into
            exam-style performance.
          </p>
        </div>
      )}
    </main>
  );
}
