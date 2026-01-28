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
  // intro | reading | questions | result

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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <button onClick={() => setView("home")}>← Back</button>

      {phase === "intro" && (
        <div style={{ marginTop: 40 }}>
          <h1>Speed Reading Gym</h1>
          <p>
            You will see a short passage for <b>25 seconds</b>.
            Read fast, focus on ideas, not words.
          </p>
          <button onClick={start}>Start Drill</button>
        </div>
      )}

      {phase === "reading" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>
            Time left: {timeLeft}s
          </div>
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              lineHeight: 1.7,
            }}
          >
            {SAMPLE.text}
          </div>
        </div>
      )}

      {phase === "questions" && (
        <div style={{ marginTop: 20 }}>
          <h2>Retention Check</h2>

          {SAMPLE.questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 600 }}>{q.q}</p>
              {q.options.map((o, oi) => (
                <button
                  key={oi}
                  onClick={() =>
                    setAnswers(a => ({ ...a, [i]: oi }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    marginBottom: 6,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    background:
                      answers[i] === oi ? "#dbeafe" : "#f9fafb",
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          ))}

          <button onClick={submit}>Submit</button>
        </div>
      )}

      {phase === "result" && result && (
        <div style={{ marginTop: 30 }}>
          <h2>Speed Report</h2>
          <p><b>Speed:</b> {result.wpm} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>
          <p>
            You retained {result.correct} out of {result.total} ideas.
          </p>

          <button onClick={() => setPhase("intro")}>
            Try Another Drill
          </button>
        </div>
      )}
    </div>
  );
}
