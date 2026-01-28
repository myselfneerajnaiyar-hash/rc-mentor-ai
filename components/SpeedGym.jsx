"use client";
import { useEffect, useState } from "react";

export default function SpeedGym({ onBack }) {
  const [phase, setPhase] = useState("intro");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [readSeconds, setReadSeconds] = useState(0);
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);

 function computeTarget() {
  const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");

  if (!history.length) {
    return { wpm: 180, level: "easy" };
  }

  const last = history[history.length - 1];

  // Use effective speed (raw * accuracy)
  const eff = last.effective;

  if (eff < 170) return { wpm: 160, level: "easy" };
  if (eff < 210) return { wpm: 190, level: "easy+" };
  if (eff < 240) return { wpm: 220, level: "moderate" };
  if (eff < 270) return { wpm: 250, level: "moderate+" };
  if (eff < 300) return { wpm: 280, level: "hard" };
  return { wpm: 320, level: "elite" };
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

if (!data.paragraphs || !data.questions) {
  console.error("API error:", data);
  throw new Error("Invalid API response");
}

// Combine paragraph + question into one array
const merged = data.paragraphs.map((p, i) => ({
  text: p,
  question: data.questions[i],
}));

setParas(merged);
      setIndex(0);
      setAnswers({});
      setReadSeconds(0);

      const words = merged[0].text.split(/\s+/).length;
      const sec = Math.ceil((words / target.wpm) * 60);
      setTimeLeft(sec);
      setPhase("reading");
    } catch {
      alert("Speed drill could not load.");
      setPhase("intro");
    }
  }

  useEffect(() => {
    if (phase !== "reading") return;

    if (timeLeft <= 0) {
      setPhase("question");
      return;
    }

    const id = setInterval(() => {
      setTimeLeft(t => t - 1);
      setReadSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timeLeft]);

  function nextPara() {
    const next = index + 1;
    if (next >= paras.length) {
      finish();
      return;
    }

    setIndex(next);
    const words = paras[next].text.split(/\s+/).length;
    const sec = Math.ceil((words / meta.wpm) * 60);
    setTimeLeft(sec);
    setPhase("reading");
  }

  function finish() {
    const totalWords = paras.reduce(
      (s, p) => s + p.text.split(/\s+/).length,
      0
    );

    const rawWPM = Math.round((totalWords / readSeconds) * 60);

    const correct = paras.reduce(
      (s, p, i) => s + (answers[i] === p.question.correct ? 1 : 0),
      0
    );

    const accuracy = Math.round((correct / paras.length) * 100);
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

    setResult(record);
    setPhase("result");
  }

  return (
    <div style={wrap}>
      {phase === "intro" && (
        <div style={panel}>
          <h2>Speed Reading Gym</h2>
          <p>Train how fast you read without losing meaning.</p>
         <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
  <button style={btn} onClick={start}>Start Drill</button>

  <button
    onClick={onBack}
    style={{
      background: "transparent",
      border: "none",
      color: "#0f766e",
      fontWeight: 500,
      cursor: "pointer",
      padding: 0,
      textDecoration: "underline",
    }}
  >
    ← Back
  </button>
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
            <b>Paragraph {index + 1}/4</b>
            <b>{timeLeft}s</b>
          </div>
          <p style={text}>{paras[index]?.text}</p>
        </div>
      )}

      {phase === "question" && (
        <div style={panel}>
          <b>{paras[index].question.q}</b>
          {paras[index].question.options.map((o, oi) => (
            <div key={oi}>
              <label>
                <input
                  type="radio"
                  name={"q" + index}
                  onChange={() =>
                    setAnswers(a => ({ ...a, [index]: oi }))
                  }
                />{" "}
                {o}
              </label>
            </div>
          ))}
          <button style={{ ...btn, marginTop: 12 }} onClick={nextPara}>
            Continue
          </button>
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
  maxWidth: 820,
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
