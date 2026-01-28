"use client";
import { useState, useEffect } from "react";

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
    if (!history.length) return { wpm: 180, words: 120, level: "easy" };

    const recent = history.slice(-5);
    const avg = recent.reduce((a, b) => a + b.effectiveWPM, 0) / recent.length;

    if (avg < 160) return { wpm: 180, words: 120, level: "easy" };
    if (avg < 210) return { wpm: 220, words: 150, level: "moderate" };
    if (avg < 260) return { wpm: 260, words: 180, level: "hard" };
    return { wpm: 300, words: 210, level: "elite" };
  }

  async function start() {
  const target = computeTarget();
  setMeta(target);
  setPhase("loading");

  try {
    const res = await fetch("/api/speed-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });

    if (!res.ok) {
      throw new Error("API failed: " + res.status);
    }

    const data = await res.json();

    if (!data.text) {
      throw new Error("No text returned");
    }

    const words = data.text.split(/\s+/).length;
    const totalSeconds = Math.ceil((words / target.wpm) * 60);

    setPassage(data.text);
    setQuestions(data.questions || []);
    setAnswers({});
    setResult(null);
    setTimeLeft(totalSeconds);

    // Move to reading phase after state is ready
    setTimeout(() => {
      setPhase("reading");
    }, 50);
  } catch (e) {
    console.error(e);
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
      setCurrent(c => Math.min(c + 1, chunks.length - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timeLeft, chunks.length]);

  function submit() {
    const correct = questions.reduce(
      (s, q, i) => s + (answers[i] === q.correct ? 1 : 0),
      0
    );

    const seenText = chunks.slice(0, current + 1).join(" ");
    const words = seenText.split(/\s+/).length;

    const rawWPM = Math.round((words / (meta.words / meta.wpm)) * meta.wpm);
    const accuracy = Math.round((correct / questions.length) * 100);
    const effectiveWPM = Math.round(rawWPM * (accuracy / 100));

    const record = {
      date: Date.now(),
      rawWPM,
      accuracy,
      effectiveWPM,
      level: meta.level,
    };

    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    history.push(record);
    localStorage.setItem("speedProfile", JSON.stringify(history));

    setResult({ rawWPM, accuracy, effectiveWPM });
    setPhase("result");
  }

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
          <p style={text}>{chunks[current]}</p>
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
                      onChange={() => setAnswers(a => ({ ...a, [i]: oi }))}
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
          <p><b>Raw Speed:</b> {result.rawWPM} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>
          <p><b>Effective Speed:</b> {result.effectiveWPM} WPM</p>
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
