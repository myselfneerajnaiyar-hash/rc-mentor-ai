"use client";
import { useEffect, useRef, useState } from "react";

export default function SpeedGym({ onBack }) {
  const [phase, setPhase] = useState("intro");
  const [chunks, setChunks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  function computeTarget() {
    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    if (!history.length) return { wpm: 180, level: "easy" };

    const recent = history.slice(-5);
    const avgWPM =
      recent.reduce((a, b) => a + b.rawWpm, 0) / recent.length;
    const avgAcc =
      recent.reduce((a, b) => a + b.accuracy, 0) / recent.length;

    if (avgWPM < 200 || avgAcc < 60) return { wpm: 180, level: "easy" };
    if (avgWPM < 240 || avgAcc < 70) return { wpm: 220, level: "moderate" };
    if (avgWPM < 280 || avgAcc < 80) return { wpm: 260, level: "hard" };
    return { wpm: 300, level: "elite" };
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

      const data = await res.json();

      const parts =
        data.text.match(/(.{1,220})(\s|$)/g) || [];

      setChunks(parts);
      setQuestions(data.questions || []);
      setAnswers({});
      setCurrent(0);
      setResult(null);

      setPhase("reading");
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        setCurrent(c => {
          if (c + 1 >= parts.length) {
            clearInterval(intervalRef.current);
            setPhase("questions");
            return c;
          }
          return c + 1;
        });
      }, 800);
    } catch (e) {
      alert("Speed drill could not load. Check API / console.");
      setPhase("intro");
    }
  }

  function submit() {
    const correct = questions.reduce(
      (s, q, i) => s + (answers[i] === q.correct ? 1 : 0),
      0
    );

    const shown = chunks.slice(0, current + 1).join(" ");
    const words = shown.split(/\s+/).length;

    const seconds = (Date.now() - startTimeRef.current) / 1000;
    const rawWpm = Math.round((words / seconds) * 60);
    const accuracy = Math.round((correct / questions.length) * 100);
    const effectiveWpm = Math.round(rawWpm * (accuracy / 100));

    const record = {
      date: Date.now(),
      rawWpm,
      accuracy,
      effectiveWpm,
      level: meta.level,
    };

    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    history.push(record);
    localStorage.setItem("speedProfile", JSON.stringify(history));

    setResult(record);
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
          <h3>Read Fast</h3>
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
          <p><b>Raw Speed:</b> {result.rawWpm} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>
          <p><b>Effective Speed:</b> {result.effectiveWpm} WPM</p>
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
