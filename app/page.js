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
  const [flow, setFlow] = useState("original"); 
  // original | generated

  const [genre, setGenre] = useState("Psychology");
  const [difficulty, setDifficulty] = useState("moderate");
  const [lengthRange, setLengthRange] = useState("400-500");

  // ---- TEST STATE ----
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});
  const [testQuestions, setTestQuestions] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("mentor");
  // mentor | ready | test | result | newRC

  const [generatedRC, setGeneratedRC] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
const [questionTimes, setQuestionTimes] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

 useEffect(() => {
  if (phase === "test") {
    setTimeLeft(6 * 60);
    setTimerRunning(true);
    setQuestionStartTime(Date.now()); // 👈 start timer for Q1
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
    setShowGenerator(false);
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
      setQuestionStartTime(Date.now());
    } catch {
      setError("Could not fetch explanation.");
    } finally {
      setLoading(false);
    }
  }

  function choose(i) {
    const end = Date.now();
const timeTaken = Math.round((end - questionStartTime) / 1000);

const key =
  mode === "showingPrimary"
    ? `para-${index}-primary`
    : `para-${index}-easier`;

setQuestionTimes(t => ({ ...t, [key]: timeTaken }));
    if (!data) return;

    if (mode === "showingPrimary") {
      if (i === data.primaryQuestion.correctIndex) {
        setFeedback("Correct. You're reading this paragraph the right way.");
        setMode("solved");
      } else {
        setFeedback("Not quite. Let’s try a simpler question on the same idea.");
        setMode("showingEasier");
setQuestionStartTime(Date.now());
      }
    } else if (mode === "showingEasier") {
      if (i === data.easierQuestion.correctIndex) {
        setFeedback("Correct. Good recovery.");
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
  setError("");

  // 🔴 CLEAR OLD TEST STATE FIRST
  setTestQuestions([]);
  setTestAnswers({});
  setQuestionTimes({});
  setResult(null);

  try {
    const full = paras.join("\n\n");
    const res = await fetch("/api/rc-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passage: full }),
    });
    if (!res.ok) throw new Error();
    const json = await res.json();

const normalized = (json.questions || []).map(q => ({
  ...q,
  type: q.type ? q.type.trim().toLowerCase() : "unknown",
}));

setTestQuestions(normalized);
setPhase("test");
  } catch {
    setError("Could not generate test.");
  } finally {
    setTestLoading(false);
  }
}

  async function submitTest() {
    setTimerRunning(false);
    setLoading(true);
    setError("");

    try {
      const full = paras.join("\n\n");
      const res = await fetch("/api/rc-diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: full,
          questions: testQuestions,
          answers: testAnswers,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setResult(json);
      setPhase("result");
      // ---- SAVE INTO RC PROFILE ----
const existing = JSON.parse(localStorage.getItem("rcProfile") || "{}");

const record = {
  date: Date.now(),
  questions: testQuestions.map((q, i) => ({
    type: (q.type || "inference").trim().toLowerCase(),
    correct: Number(testAnswers[i]) === Number(q.correctIndex),
    time: questionTimes[`test-${i}`] || 0,
  })),
};

existing.tests = existing.tests || [];
existing.tests.push(record);

localStorage.setItem("rcProfile", JSON.stringify(existing));
    } catch {
      setError("Could not analyze your test.");
    } finally {
      setLoading(false);
    }
  }

 async function generateNewRC() {
  setGenLoading(true);
  setError("");

  try {
    const res = await fetch("/api/rc-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre, difficulty, lengthRange }),
    });

    if (!res.ok) throw new Error();

    const json = await res.json();
    setGeneratedRC(json);
    setPhase("newRC");
    setShowGenerator(false);
  } catch {
    setError("Could not generate new RC.");
  } finally {
    setGenLoading(false);
  }
}

const score = testQuestions.reduce(
  (s, q, i) =>
    s + (Number(testAnswers[i]) === Number(q.correctIndex) ? 1 : 0),
  0
);

 const showInitial = paras.length === 0 && !showGenerator && phase !== "newRC";
 const showGenPanel = showGenerator;
  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>RC Mentor</h1>

    
      {/* Initial Paste Screen */}
      {showInitial && (
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

         <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
  <button
    onClick={splitPassage}
    style={{
      padding: "10px 16px",
      background: "green",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontWeight: 600,
    }}
  >
    Split Passage
  </button>

  <button
    onClick={() => {
      setShowGenerator(true);
      setTimeout(() => {
        const el = document.getElementById("generator-top");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }}
    style={{
      padding: "10px 16px",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontWeight: 600,
    }}
  >
    Generate New Passage
  </button>
      <button
  onClick={() => {
    setShowProfile(true);
    setShowGenerator(false);
  }}
  style={{
    padding: "10px 16px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
  }}
>
  RC Profile
</button>
</div>

<div
  style={{
    marginTop: 16,
    padding: 20,
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fafafa",
  }}
>

           
          </div>
        </>
      )}
 {showGenerator && (
  <div
    style={{
      marginTop: 16,
      padding: 20,
      border: "1px solid #ddd",
      borderRadius: 8,
      background: "#fafafa",
    }}
  >
    <h3>Generate a New Passage</h3>

    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <select value={genre} onChange={(e) => setGenre(e.target.value)}>
        <option>Psychology</option>
        <option>Economics</option>
        <option>Sociology / Society</option>
        <option>Philosophy</option>
        <option>History</option>
        <option>Politics / Polity</option>
        <option>Culture & Anthropology</option>
        <option>Ethics & Morality</option>

        <option>Literature</option>
        <option>Books & Reading</option>
        <option>Arts</option>
        <option>Architecture & Design</option>
        <option>Linguistics / Language</option>

        <option>Biology</option>
        <option>Evolution & Ecology</option>
        <option>Neuroscience / Cognition</option>
        <option>Physics & Scientific Thought</option>
        <option>Mathematics & Logic</option>

        <option>Technology & Society</option>
        <option>Environment & Sustainability</option>
        <option>Education & Learning</option>
        <option>Media & Communication</option>
        <option>Work, Capital & Labour</option>
        <option>Urban Studies</option>

        <option>Mixed</option>
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
        <option value="500-600">500–600</option>
      </select>
    </div>

    <button
      onClick={generateNewRC}
      style={{
        padding: "10px 16px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontWeight: 600,
      }}
    >
      {genLoading ? "Generating…" : "Generate"}
    </button>

    <button
      onClick={() => setShowGenerator(false)}
      style={{
        marginLeft: 12,
        padding: "10px 16px",
        background: "#eee",
        border: "1px solid #ccc",
        borderRadius: 6,
      }}
    >
      Cancel
    </button>
  </div>
)}
{showProfile && (() => {
  const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
  const tests = raw.tests || [];

  if (!tests.length) {
    return (
      <div style={{ marginTop: 20, padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>RC Profile</h3>
        <p>No test data yet. Take at least one RC test to build your profile.</p>
        <button onClick={() => setShowProfile(false)}>Close</button>
      </div>
    );
  }

  const all = tests.flatMap(t => t.questions);
  const totalQ = all.length;
  const correct = all.filter(q => q.correct).length;
  const avgTime = Math.round(all.reduce((a, b) => a + b.time, 0) / totalQ);

  const byType = {};
  all.forEach(q => {
    if (!byType[q.type]) {
      byType[q.type] = { fastWrong: 0, slowWrong: 0, fastCorrect: 0, slowCorrect: 0 };
    }
    const expected = {
      "main-idea": 35,
      "tone": 25,
      "inference": 45,
      "detail": 15,
    }[q.type] || avgTime;

    if (!q.correct && q.time < expected * 0.6) byType[q.type].fastWrong++;
    if (!q.correct && q.time > expected * 1.4) byType[q.type].slowWrong++;
    if (q.correct && q.time > expected * 1.4) byType[q.type].slowCorrect++;
    if (q.correct && q.time < expected * 0.6) byType[q.type].fastCorrect++;
  });

  return (
    <div style={{ marginTop: 20, padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2>Your RC Profile</h2>
      <p><b>RCs Attempted:</b> {tests.length}</p>
      <p><b>Questions Solved:</b> {totalQ}</p>
      <p><b>Accuracy:</b> {Math.round((correct / totalQ) * 100)}%</p>
      <p><b>Avg Time / Q:</b> {avgTime}s</p>

      <h3 style={{ marginTop: 20 }}>Reading Patterns</h3>

      {Object.entries(byType).map(([type, d]) => (
        <div key={type} style={{ marginTop: 12 }}>
          <p style={{ fontWeight: 600, textTransform: "capitalize" }}>{type}</p>
          <p style={{ fontSize: 13, color: "#555" }}>
            Fast Wrong: {d.fastWrong} | Slow Wrong: {d.slowWrong} | Slow Correct: {d.slowCorrect} | Fast Correct: {d.fastCorrect}
          </p>
        </div>
      ))}

      <button
        onClick={() => setShowProfile(false)}
        style={{ marginTop: 20, padding: "10px 16px", borderRadius: 6 }}
      >
        Close
      </button>
    </div>
  );
})()}
      {/* Mentor Flow */}
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
                    <button key={i} onClick={() => choose(i)} style={{ display: "block", margin: "6px 0" }}>
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
                    <button key={i} onClick={() => choose(i)} style={{ display: "block", margin: "6px 0" }}>
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

      {/* Ready */}
      {phase === "ready" && (
        <div style={{ marginTop: 40, padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
          <p>You’ve now understood this passage in depth. Let’s test it.</p>
          <button
            onClick={startTest}
            style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Take Test
          </button>
        </div>
      )}
{/* Test Phase */}
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
           onClick={() => {
  const end = Date.now();
  const timeTaken = Math.round((end - questionStartTime) / 1000);

  setQuestionTimes(t => ({ ...t, [`test-${qi}`]: timeTaken }));
  setQuestionStartTime(Date.now());

  setTestAnswers(a => ({ ...a, [qi]: oi }));
}}
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

 <div style={{ marginTop: 12 }}>
  {loading ? (
    <p style={{ fontWeight: 600, color: "#2563eb" }}>
      Evaluating your responses and preparing a personalized diagnosis…
    </p>
  ) : (
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
  )}
</div>
</div>
)}

{/* Result Phase */}
{phase === "result" && result && (() => {
  const times = Object.values(questionTimes);
  const avgTime = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;

  const buckets = {};

  testQuestions.forEach((q, i) => {
    const t = questionTimes[`test-${i}`] || 0;
    const correct = testAnswers[i] === q.correctIndex;
    const type = (q.type || "inference").trim().toLowerCase();

    if (!buckets[type]) {
      buckets[type] = { fastWrong: 0, slowWrong: 0, fastCorrect: 0, slowCorrect: 0 };
    }

    const CAT_TIME = {
      "main-idea": 35,
      "tone": 25,
      "inference": 45,
      "detail": 15,
    };

    const expected = CAT_TIME[type] || avgTime;

    if (!correct && t < expected * 0.6) buckets[type].fastWrong++;
    if (!correct && t > expected * 1.4) buckets[type].slowWrong++;
    if (correct && t > expected * 1.4) buckets[type].slowCorrect++;
    if (correct && t < expected * 0.6) buckets[type].fastCorrect++;
  });

  return (
    <div style={{ marginTop: 40 }}>
      {/* Snapshot */}
      <div style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 10, background: "#f8fafc" }}>
        <h2>Performance Snapshot</h2>
        <p><b>Score:</b> {score} / {testQuestions.length}</p>
        <p><b>Accuracy:</b> {Math.round((score / testQuestions.length) * 100)}%</p>
        <p><b>Avg Time / Question:</b> {avgTime}s</p>
      </div>

      {/* Strengths */}
      <div style={{ marginTop: 20, padding: 20, borderRadius: 10, background: "#ecfeff", border: "1px solid #bae6fd" }}>
        <h3>Your Strengths</h3>
        <ul>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>

      {/* Friction Patterns */}
      <div style={{ marginTop: 20, padding: 20, borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa" }}>
        <h3>Where You Lose Marks</h3>

        {Object.entries(buckets).map(([type, d]) => (
          <div key={type} style={{ marginTop: 12 }}>
            <b style={{ textTransform: "capitalize" }}>{type}</b>
            <p style={{ fontSize: 13, color: "#444" }}>
              Fast Wrong: {d.fastWrong} | Slow Wrong: {d.slowWrong} | Slow Correct: {d.slowCorrect} | Fast Correct: {d.fastCorrect}
            </p>
          </div>
        ))}
      </div>

      {/* Reading Style */}
      <div style={{ marginTop: 20, padding: 20, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <h3>Your Reading Style</h3>
        <p>{result.summary}</p>
      </div>

      {/* Action Plan */}
      <div style={{ marginTop: 20, padding: 20, borderRadius: 10, background: "#eef2ff", border: "1px solid #c7d2fe" }}>
        <h3>Your Next Focus</h3>
        <p>{result.nextFocus}</p>
        <button
  onClick={() => setShowDetailed(true)}
  style={{
    marginTop: 12,
    padding: "10px 16px",
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontWeight: 600,
  }}
>
  Review This Test in Detail
</button>

       <button
  onClick={() => {
    setShowGenerator(true);
    setPhase("mentor");
  }}
  style={{
    marginTop: 12,
    padding: "12px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
  }}
>
  Start Next RC With This Focus
</button>
      </div>
    </div>
  );
})()}

  {showDetailed && (
  <div style={{ marginTop: 40 }}>
    <h3>Detailed Review</h3>

    {testQuestions.map((q, i) => {
      const qa = result.questionAnalysis.find(x => x.qIndex === i);
      const studentChoice = testAnswers[i];
      const status =
        studentChoice === undefined ? "unattempted" : qa?.status || "wrong";

      return (
        <div key={i} style={{ marginTop: 20, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <p style={{ fontWeight: 600 }}>Q{i + 1}. {q.prompt}</p>

          <p>
            <b>Status:</b>{" "}
            <span style={{ color: status === "correct" ? "green" : status === "unattempted" ? "#555" : "red" }}>
              {status.toUpperCase()}
            </span>
          </p>

          {questionTimes[`test-${i}`] !== undefined && (
            <p style={{ fontSize: 13, color: "#555" }}>
              ⏱ Time taken: {questionTimes[`test-${i}`]} seconds
            </p>
          )}

          <p><b>Why the correct option is correct:</b></p>
          <p>{qa?.correctExplanation}</p>
        </div>
      );
    })}
  </div>
)}
<button
  onClick={() => {
    setParas([]);
    setText("");
    setPhase("mentor");
    setShowProfile(true);
  }}
  style={{
    marginLeft: 12,
    padding: "12px 18px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  }}
>
  View RC Profile
</button>
   
      {/* New RC Choice */}
      {phase === "newRC" && generatedRC && (
        <div style={{ marginTop: 40, padding: 24, border: "1px solid #ddd", borderRadius: 8, textAlign: "center" }}>
          <h2>How would you like to approach the next passage?</h2>

          <button
            onClick={() => {
              setParas(generatedRC.passage.split(/\n\s*\n/));
              setTestQuestions(
  (generatedRC.questions || []).map(q => ({
    ...q,
    type: q.type || "inference",
  }))
);
              setTestAnswers({});
              setPhase("test");
            }}
            style={{ padding: "12px 18px", background: "green", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Take it as a Test
          </button>

          <button
            onClick={() => {
              const parts = generatedRC.passage
                .split(/\n\s*\n/)
                .map(p => p.trim())
                .filter(Boolean);

              setFlow("generated");
              setGeneratedRC(null);
              setParas(parts);
              setIndex(0);
              setData(null);
              setFeedback("");
              setMode("idle");
              setPhase("mentor");
            }}
            style={{ marginLeft: 12, padding: "12px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6 }}
          >
            View Detailed Explanation
          </button>
        </div>
      )}
    </main>
  );
}
