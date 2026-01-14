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
  const [feedback, setFeedback] = useState("");
  const [flow, setFlow] = useState("original");

  const [genre, setGenre] = useState("Psychology");
  const [difficulty, setDifficulty] = useState("moderate");
  const [lengthRange, setLengthRange] = useState("400-500");

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});
  const [testQuestions, setTestQuestions] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("mentor"); // mentor | ready | test | result | newRC

  const [generatedRC, setGeneratedRC] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

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

      const json = await res.json();
      setData(json);
      setMode("showingPrimary");
    } catch {
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
        setFeedback("Not quite. Let’s try a simpler question.");
        setMode("showingEasier");
      }
    } else if (mode === "showingEasier") {
      if (optionIndex === data.easierQuestion.correctIndex) {
        setFeedback("Correct. Good recovery.");
        setMode("solved");
      } else {
        setFeedback("Still off. Re-read once.");
      }
    }
  }

  function nextParagraph() {
    if (index === paras.length - 1) {
      setPhase("ready");
      return;
    }

    setIndex(i => i + 1);
    setData(null);
    setMode("idle");
    setFeedback("");
  }

  async function startTest() {
    setTestLoading(true);
    setTestAnswers({});

    const fullPassage = paras.join("\n\n");
    const res = await fetch("/api/rc-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passage: fullPassage }),
    });

    const json = await res.json();
    setTestQuestions(json.questions || []);
    setPhase("test");
    setTestLoading(false);
  }

  async function submitTest() {
    setTimerRunning(false);
    setLoading(true);

    const fullPassage = paras.join("\n\n");
    const res = await fetch("/api/rc-diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passage: fullPassage,
        questions: testQuestions,
        answers: testAnswers,
      }),
    });

    const json = await res.json();
    setResult(json);
    setPhase("result");
    setLoading(false);
  }

  async function generateNewRC() {
    setGenLoading(true);

    const res = await fetch("/api/rc-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre, difficulty, lengthRange }),
    });

    const json = await res.json();
    setGeneratedRC(json);
    setPhase("newRC");
    setShowGenerator(false);
    setGenLoading(false);
  }

  const score = testQuestions.reduce(
    (s, q, i) => s + (testAnswers[i] === q.correctIndex ? 1 : 0),
    0
  );

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RC Mentor</h1>

      {paras.length === 0 && (
        <>
          <p>Paste a passage.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", minHeight: 180, padding: 12 }}
          />
          <button onClick={splitPassage}>Split Passage</button>
        </>
      )}

      {paras.length > 0 && phase === "mentor" && (
        <>
          <h3>Paragraph {index + 1} of {paras.length}</h3>
          <div style={{ padding: 14, background: "#f5f5f5" }}>{current}</div>
          <button onClick={explain}>Explain this paragraph</button>

          {loading && <p>Thinking…</p>}

          {data && (
            <>
              <p>{data.explanation}</p>

              {mode === "showingPrimary" &&
                data.primaryQuestion.options.map((o, i) => (
                  <button key={i} onClick={() => choose(i)}>{o}</button>
                ))}

              {mode === "showingEasier" &&
                data.easierQuestion.options.map((o, i) => (
                  <button key={i} onClick={() => choose(i)}>{o}</button>
                ))}

              {mode === "solved" && (
                <button onClick={nextParagraph}>Next</button>
              )}
            </>
          )}
        </>
      )}

      {phase === "ready" && (
        <>
          <p>You’ve now understood this passage.</p>
          <button onClick={startTest}>Take Test</button>
        </>
      )}

      {phase === "test" && (
        <>
          {testQuestions.map((q, qi) => (
            <div key={qi}>
              <p>{q.prompt}</p>
              {q.options.map((o, oi) => (
                <button key={oi} onClick={() =>
                  setTestAnswers(a => ({ ...a, [qi]: oi }))
                }>
                  {o}
                </button>
              ))}
            </div>
          ))}
          <button onClick={submitTest}>Submit Test</button>
        </>
      )}

      {phase === "result" && (
        <>
          <h2>Your Score: {score}</h2>
          {result && <p>{result.summary}</p>}

          <button onClick={() => setShowGenerator(true)}>
            Generate New RC
          </button>

          {showGenerator && (
            <div style={{ marginTop: 20 }}>
              <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option>Psychology</option>
                <option>Economics</option>
                <option>Culture</option>
              </select>

              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="moderate">Moderate</option>
                <option value="advanced">Advanced</option>
                <option value="pro">Pro</option>
              </select>

              <select value={lengthRange} onChange={(e) => setLengthRange(e.target.value)}>
                <option value="300-400">300–400</option>
                <option value="400-500">400–500</option>
              </select>

              <button onClick={generateNewRC}>
                {genLoading ? "Generating…" : "Generate"}
              </button>
            </div>
          )}
        </>
      )}

      {phase === "newRC" && generatedRC && (
        <>
          <h2>How would you like to proceed?</h2>
          <button onClick={() => {
            setParas(generatedRC.passage.split(/\n\s*\n/));
            setPhase("mentor");
          }}>
            View Detailed Explanation
          </button>
        </>
      )}
    </main>
  );
}
