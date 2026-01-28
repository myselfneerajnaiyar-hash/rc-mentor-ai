"use client";
import { useState, useEffect } from "react";

const SAMPLE = {
  text: `Most people read the way they were taught in school: slowly, carefully, and with an unconscious habit of subvocalizing every word. While this method feels “safe,” it severely limits speed. Skilled readers, in contrast, treat text as a stream of ideas rather than a chain of words. They do not pronounce each term mentally; instead, they group phrases, anticipate structure, and let meaning emerge in chunks. Speed, therefore, is not about racing the eyes but about trusting comprehension. The brain is capable of processing far more than the voice can articulate.`,
  questions: [
    {
      q: "What is the main idea of the passage?",
      options: [
        "Reading slowly ensures better comprehension",
        "Speed reading depends on seeing words clearly",
        "Efficient reading is about processing ideas, not words",
        "Most people are incapable of reading quickly",
      ],
      correct: 2,
    },
    {
      q: "According to the passage, why is subvocalization limiting?",
      options: [
        "It distracts the reader",
        "It ties reading speed to speaking speed",
        "It makes texts confusing",
        "It reduces vocabulary growth",
      ],
      correct: 1,
    },
    {
      q: "Which quality distinguishes skilled readers?",
      options: [
        "They read every word carefully",
        "They rely on memory",
        "They group ideas and anticipate structure",
        "They skip difficult sentences",
      ],
      correct: 2,
    },
  ],
};

export default function SpeedGym({ setView }) {
  const [phase, setPhase] = useState("intro");
  const [timeLeft, setTimeLeft] = useState(25);
  const [running, setRunning] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const words = SAMPLE.text.split(/\s+/).length;

  useEffect(() => {
    if (!running) return;

    if (timeLeft <= 0) {
      setRunning(false);
      setPhase("questions");
      return;
    }

    const id = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [running, timeLeft]);

  function start() {
    setTimeLeft(25);
    setAnswers({});
    setResult(null);
    setRunning(true);
    setPhase("reading");
  }

  function submit() {
    const correct = SAMPLE.questions.reduce(
      (s, q, i) => s + (answers[i] === q.correct ? 1 : 0),
      0
    );

    const accuracy = Math.round((correct / SAMPLE.questions.length) * 100);
    const wpm = Math.round((words / 25) * 60);

    const report = {
      date: Date.now(),
      wpm,
      accuracy,
      correct,
      total: SAMPLE.questions.length,
    };

    const existing = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    existing.push(report);
    localStorage.setItem("speedProfile", JSON.stringify(existing));

    setResult(report);
    setPhase("result");
  }

  const pct = Math.round((timeLeft / 25) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eef2ff, #f8fafc)",
        color: "#1f2937",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <button onClick={() => setView("home")} style={{ marginBottom: 20 }}>
          ← Back
        </button>

        {phase === "intro" && (
          <div style={card}>
            <h1>Speed Reading Gym</h1>
            <p style={{ color: "#475569" }}>
              You will see a passage for <b>25 seconds</b>.
              <br />
              Read for ideas, not words. Let meaning flow.
            </p>
            <button style={primaryBtn} onClick={start}>
              Start Drill
            </button>
          </div>
        )}

        {phase === "reading" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <b>Reading Window</b>
              <span>{timeLeft}s</span>
            </div>

            <div style={barOuter}>
              <div style={{ ...barInner, width: pct + "%" }} />
            </div>

            <div style={{ ...card, marginTop: 16, lineHeight: 1.8 }}>
              {SAMPLE.text}
            </div>
          </div>
        )}

        {phase === "questions" && (
          <div style={card}>
            <h2>Retention Check</h2>

            {SAMPLE.questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 600 }}>{q.q}</p>
                {q.options.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers(a => ({ ...a, [i]: oi }))}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      marginBottom: 6,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: answers[i] === oi ? "#dbeafe" : "#f9fafb",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            ))}

            <button style={primaryBtn} onClick={submit}>
              Submit
            </button>
          </div>
        )}

        {phase === "result" && result && (
          <div style={card}>
            <h2>Your Speed Report</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 16 }}>
              <Stat label="Speed" value={result.wpm + " WPM"} />
              <Stat label="Accuracy" value={result.accuracy + "%"} />
              <Stat label="Ideas Retained" value={${result.correct}/${result.total}} />
            </div>

            <p style={{ marginTop: 20, color: "#475569" }}>
              {result.accuracy >= 70
                ? "Excellent balance of speed and comprehension. This is CAT-grade reading."
                : "You’re gaining speed, but clarity is leaking. Slow slightly and anchor meaning."}
            </p>

            <button style={primaryBtn} onClick={() => setPhase("intro")}>
              Train Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
    </div>
  );
}

const card = {
  background: "#ffffff",
  padding: 24,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
};

const primaryBtn = {
  marginTop: 16,
  padding: "12px 18px",
  borderRadius: 10,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

const barOuter = {
  height: 6,
  background: "#e5e7eb",
  borderRadius: 6,
  overflow: "hidden",
};

const barInner = {
  height: "100%",
  background: "#22c55e",
};
