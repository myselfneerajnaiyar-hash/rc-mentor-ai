"use client";
import { useState } from "react";

export default function SpeedGym({ onBack }) {
  const [phase, setPhase] = useState("intro");
  const [passage, setPassage] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);

  function computeTarget() {
    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    if (!history.length) {
      return { wpm: 180, words: 90, level: "easy" };
    }

    const recent = history.slice(-5);
    const avgWPM = Math.round(
      recent.reduce((a, b) => a + b.wpm, 0) / recent.length
    );
    const avgAcc = Math.round(
      recent.reduce((a, b) => a + b.accuracy, 0) / recent.length
    );

    if (avgWPM < 200 || avgAcc < 60)
      return { wpm: 180, words: 90, level: "easy" };
    if (avgWPM < 240 || avgAcc < 70)
      return { wpm: 220, words: 120, level: "moderate" };
    if (avgWPM < 280 || avgAcc < 80)
      return { wpm: 260, words: 150, level: "hard" };

    return { wpm: 300, words: 180, level: "elite" };
  }

  async function start() {
    const target = computeTarget();
    setMeta(target);
    setPhase("loading");

    const res = await fetch("/api/speed-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });

    const data = await res.json();

    const text = data.text || data.passage || "";
    const qs = Array.isArray(data.questions) ? data.questions : [];

    setPassage(text);
    setQuestions(qs);
    setAnswers({});
    setResult(null);
    setTimeLeft(25);
    setPhase("reading");

    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("questions");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function submit() {
    if (!questions.length) return;

    const correct = questions.reduce(
      (s, q, i) => s + (answers[i] === q.correct ? 1 : 0),
      0
    );

    const words = passage.split(/\s+/).length;
    const wpm = Math.round((words / 25) * 60);
    const accuracy = Math.round((correct / questions.length) * 100);

    const record = {
      date: Date.now(),
      wpm,
      accuracy,
      level: meta.level,
    };

    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    history.push(record);
    localStorage.setItem("speedProfile", JSON.stringify(history));

    setResult({ wpm, accuracy, correct, total: questions.length });
    setPhase("result");
  }

  return (
    <div style={wrap}>
      {phase === "intro" && (
        <div style={panel}>
          <h2>Speed Reading Gym</h2>
          <p>Train how fast you read without losing meaning.</p>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button style={btn} onClick={start}>Start Drill</button>
            <button onClick={onBack} style={ghost}>← Back</button>
          </div>
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
          <p style={text}>{passage || "Loading passage…"}</p>
        </div>
      )}

      {phase === "questions" && (
        <div style={panel}>
          <h3>Check Your Understanding</h3>

          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <b>{q.q || q.prompt || `Question ${i + 1}`}</b>

              {(q.options || []).map((o, oi) => (
                <div key={oi} style={{ marginTop: 6 }}>
                  <label>
                    <input
                      type="radio"
                      name={"q" + i}
                      checked={answers[i] === oi}
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

          <button style={{ ...btn, marginTop: 10 }} onClick={submit}>
            Submit
          </button>
        </div>
      )}

      {phase === "result" && (
        <div style={panel}>
          <h2>Drill Result</h2>
          <p><b>Speed:</b> {result.wpm} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>

          <button style={{ ...btn, marginTop: 12 }} onClick={() => setPhase("intro")}>
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

const ghost = {
  padding: "12px 18px",
  borderRadius: 10,
  background: "transparent",
  border: "1px solid #94a3b8",
  cursor: "pointer",
};

const text = {
  marginTop: 14,
  lineHeight: 1.8,
  fontSize: 16,
};
