"use client";
import { useEffect, useState } from "react";

export default function SpeedGym({ onBack }) {
  const [phase, setPhase] = useState("intro");
  const [chunks, setChunks] = useState([]);
  const [current, setCurrent] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);

  function computeTarget() {
    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    if (!history.length) return { wpm: 180, level: "easy" };

    const recent = history.slice(-5);
    const avgWPM =
      recent.reduce((a, b) => a + b.effective, 0) / recent.length;

    if (avgWPM < 200) return { wpm: 180, level: "easy" };
    if (avgWPM < 240) return { wpm: 220, level: "moderate" };
    if (avgWPM < 280) return { wpm: 260, level: "hard" };
    return { wpm: 300, level: "elite" };
  }

  function splitIntoChunks(text, wordsPerChunk = 100) {
    const words = text.split(/\s+/);
    const out = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      out.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    return out;
  }

  async function start() {
    try {
      const target = computeTarget();
      setMeta(target);
      setPhase("loading");

      const res = await fetch("/api/speed-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });

      const data = await res.json();
      if (!data.text) throw new Error("No text");

      const parts = splitIntoChunks(data.text, 100);

      setChunks(parts);
      setQuestions(data.questions || []);
      setAnswers({});
      setCurrent(0);

      const words = parts[0].split(/\s+/).length;
      const seconds = Math.ceil((words / target.wpm) * 60);

      setTimeLeft(seconds);
      setPhase("reading");
    } catch (e) {
      alert("Speed drill could not load. Check API / console.");
      setPhase("intro");
    }
  }

  useEffect(() => {
    if (phase !== "reading") return;

    if (timeLeft <= 0) {
      setPhase("questions");
      return;
    }

    const id = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timeLeft]);

  function submit() {
    const correct = questions.reduce(
      (s, q, i) => s + (answers[i] === q.correct ? 1 : 0),
      0
    );

    const words = chunks[0].split(/\s+/).length;
    const raw = Math.round((words / (timeLeftStart)) * 60);
    const accuracy = Math.round((correct / questions.length) * 100);
    const effective = Math.round(raw * (accuracy / 100));

    const record = {
      date: Date.now(),
      raw,
      accuracy,
      effective,
      level: meta.level,
    };

    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    history.push(record);
    localStorage.setItem("speedProfile", JSON.stringify(history));

    setResult(record);
    setPhase("result");
  }

  const timeLeftStart = meta
    ? Math.ceil((chunks[0]?.split(/\s+/).length / meta.wpm) * 60)
    : 0;

  return (
    <div style={wrap}>
      {phase === "intro" && (
        <div style={panel}>
          <h2>Speed Reading Gym</h2>
          <p>Train how fast you read without losing meaning.</p>
          <button style={btn} onClick={start}>Start Drill</button>
          <button onClick={onBack} style={{ marginTop: 12 }}>← Back</button>
        </div>
      )}

      {phase === "loading" && (
        <div style={panel}>
          <h3>Preparing adaptive drill…</h3>
          <p>Target: {meta?.wpm} WPM · {meta?.level}</p>
        </div>
      )}

      {phase === "reading" && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Read Fast</b>
            <b>{timeLeft}s</b>
          </div>
          <p style={text}>{chunks[0]}</p>
        </div>
      )}

      {phase === "questions" && (
        <div style={panel}>
          <h3>Check Your Understanding</h3>
          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <b>{q.q}</b>
              {q.options.map((o, oi) => (
                <div key={oi}>
                  <label>
                    <input
                      type="radio"
                      name={"q" + i}
                      onChange={() =>
                        setAnswers(a => ({ ...a, [i]: oi }))
                      }
                    />{" "}
                    {o}
                  </label>
                </div>
              ))}
            </div>
          ))}
          <button style={btn} onClick={submit}>Submit</button>
        </div>
      )}

      {phase === "result" && (
        <div style={panel}>
          <h2>Drill Result</h2>
          <p><b>Raw Speed:</b> {result.raw} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>
          <p><b>Effective Speed:</b> {result.effective} WPM</p>
          <button style={btn} onClick={() => setPhase("intro")}>
            Next Drill
          </button>
        </div>
      )}
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const panel = {
  width: "100%",
  maxWidth: 800,
  padding: 28,
  borderRadius: 20,
  background: "linear-gradient(180deg, #ecfeff, #f0fdfa)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
};

const btn = {
  padding: "12px 18px",
  borderRadius: 10,
  background: "#22c55e",
  color: "#fff",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

const text = {
  marginTop: 14,
  lineHeight: 1.8,
  fontSize: 16,
};
