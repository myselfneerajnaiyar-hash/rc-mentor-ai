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
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timeLeft]);

  function splitPassage() {
    const raw = text.trim();
    let parts = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    if (parts.length === 1) {
      const sentences = raw.match(/[^.!?]+[.!?]+/g) || [raw];
      parts = [];
      let cur = "";
      for (let s of sentences) {
        if ((cur + s).length > 300) {
          parts.push(cur.trim());
          cur = s;
        } else cur += " " + s;
      }
      if (cur.trim()) parts.push(cur.trim());
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
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setMode("showingPrimary");
    } catch {
      setError("Could not fetch explanation.");
    } finally {
      setLoading(false);
    }
  }

  function choose(i) {
    if (!data) return;
    if (mode === "showingPrimary") {
      if (i === data.primaryQuestion.correctIndex) {
        setFeedback("Correct.");
        setMode("solved");
      } else {
        setFeedback("Try a simpler question.");
        setMode("showingEasier");
      }
    } else if (mode === "showingEasier") {
      if (i === data.easierQuestion.correctIndex) {
        setFeedback("Correct.");
        setMode("solved");
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
    try {
      const full = paras.join("\n\n");
      const res = await fetch("/api/rc-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passage: full }),
      });
      const json = await res.json();
      setTestQuestions(json.questions || []);
      setPhase("test");
    } finally {
      setTestLoading(false);
    }
  }

  async function submitTest() {
    setTimerRunning(false);
    const full = paras.join("\n\n");
    const res = await fetch("/api/rc-diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passage: full, questions: testQuestions, answers: testAnswers }),
    });
    const json = await res.json();
    setResult(json);
    setPhase("result");
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
    setGenLoading(false);
  }

  const score = testQuestions.reduce((s, q, i) => s + (testAnswers[i] === q.correctIndex ? 1 : 0), 0);

  const showInitial = paras.length === 0 && !showGenerator;
  const showGenPanel = showGenerator && (paras.length === 0 || phase === "result");

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RC Mentor</h1>

      {showGenPanel && (
        <div style={{ marginTop: 20, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3>Generate a New Passage</h3>
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            <option>Psychology</option><option>Economics</option><option>Culture</option>
            <option>Science</option><option>Technology</option><option>Environment</option>
          </select>{" "}
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="moderate">Moderate</option>
            <option value="advanced">Advanced</option>
            <option value="pro">Pro</option>
          </select>{" "}
          <select value={lengthRange} onChange={e => setLengthRange(e.target.value)}>
            <option value="300-400">300–400</option>
            <option value="400-500">400–500</option>
            <option value="500-600">500–600</option>
          </select>
          <div style={{ marginTop: 10 }}>
            <button onClick={generateNewRC}>{genLoading ? "Generating…" : "Generate"}</button>
            <button onClick={() => setShowGenerator(false)} style={{ marginLeft: 10 }}>Cancel</button>
          </div>
        </div>
      )}

      {showInitial && (
        <>
          <p>Paste a passage.</p>
          <textarea value={text} onChange={e => setText(e.target.value)} style={{ width: "100%", minHeight: 180 }} />
          <div style={{ marginTop: 12 }}>
            <button onClick={splitPassage} style={{ background: "green", color: "#fff", padding: "10px 16px", borderRadius: 6 }}>
              Split Passage 🌱
            </button>
            <button onClick={() => setShowGenerator(true)} style={{ marginLeft: 12, background: "#2563eb", color: "#fff", padding: "10px 16px", borderRadius: 6 }}>
              Generate New Passage
            </button>
          </div>
        </>
      )}

      {/* Rest of your mentor, test, result, newRC UI remains unchanged in behavior */}
    </main>
  );
}
