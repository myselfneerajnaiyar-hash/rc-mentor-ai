"use client";
import { useState, useEffect } from "react";
import MentorView from "./MentorView";
import Navbar from "./Navbar";

export default function RCView({view,setView }) {
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
  // mentor | ready | test | result | newRC | profile | detailed | vocab | loading-adaptive
  
// home | rc | vocab | speed | cat

  const [generatedRC, setGeneratedRC] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("overview");
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [isAdaptive, setIsAdaptive] = useState(false);

  // ---- VOCAB STATE ----
  const [vocabDrill, setVocabDrill] = useState([]);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabTimer, setVocabTimer] = useState(0);
  const [vocabRunning, setVocabRunning] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [vocabBank, setVocabBank] = useState([]);
  const [learningWord, setLearningWord] = useState(null);
  
  function splitPassage() {
  const raw = text.trim();
  if (!raw) return;

  const parts = raw
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  setParas(parts);
  setIndex(0);
  }

  async function generateNewRC() {
  setGenLoading(true);

  try {
    const res = await fetch("/api/rc-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre,
        difficulty,
        lengthRange,
      }),
    });

    const data = await res.json();

    setGeneratedRC(data);     // store full RC package
    setShowGenerator(false);  // hide panel
    setPhase("newRC");        // show choice screen
  } catch (e) {
    alert("Failed to generate RC");
  } finally {
    setGenLoading(false);
  }
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

    setTestQuestions([]);
    setTestAnswers({});
    setQuestionTimes({});
    setResult(null);

    try {
      const full = paras.join("\n\n");
      const res = await fetch("/api/rc-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passage: full, mode: "normal" }),
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

  async function startAdaptiveRC() {
    try {
      setIsAdaptive(true);
      setShowGenerator(false);

      setParas([]);
      setIndex(0);
      setData(null);
      setFeedback("");
      setMode("idle");

      setPhase("loading-adaptive");

      const res = await fetch("/api/rc-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: "Mixed",
          difficulty: "moderate",
          lengthRange: "400-500",
        }),
      });

      const json = await res.json();

      const parts = json.passage
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

      setParas(parts);
      setIndex(0);
      setPhase("mentor");
    } catch (e) {
      setShowGenerator(true);
      setPhase("mentor");
    }
  }

  const score = testQuestions.reduce(
    (s, q, i) =>
      s + (Number(testAnswers[i]) === Number(q.correctIndex) ? 1 : 0),
    0
  );
  return (
    <div
    style={{
      minHeight: "100vh",
      fontFamily: "system-ui",
      background: "linear-gradient(180deg, #eef2ff, #f8fafc)",
      color: "#1f2937",
    }}
  >
     
 
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
  <Navbar view={view} setView={setView} />
        <h1
          style={{ cursor: "pointer", margin: 0 }}
          onClick={() => {
            setIsAdaptive(false);
            setParas([]);
            setText("");
            setIndex(0);
            setData(null);
            setFeedback("");
            setMode("idle");
            setGeneratedRC(null);
            setTestQuestions([]);
            setTestAnswers({});
            setResult(null);
            setShowGenerator(false);
            setPhase("mentor");
          }}
        >
          RC Mentor
        </h1>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              setIsAdaptive(false);
              setParas([]);
              setShowGenerator(false);
              setPhase("mentor");
            }}
          >
            Home
          </button>

          <button
            onClick={() => {
              setParas([]);
              setShowGenerator(false);
              setPhase("profile");
            }}
          >
            RC Profile
          </button>

          <button
            onClick={() => {
              setParas([]);
              setShowGenerator(false);
              setPhase("vocab");
            }}
            style={{
              background: "#fde68a",
              border: "1px solid #f59e0b",
              color: "#92400e",
              fontWeight: 600,
            }}
          >
            Vocabulary
          </button>
        </div>
      </div>

  {view === "rc" && (
  <>
    <MentorView
      text={text}
      setText={setText}
      splitPassage={splitPassage}
      setShowGenerator={setShowGenerator}
    />

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

        <button onClick={explain}>Explain this paragraph</button>
      </>
    )}

    {showGenerator && (
      <div>
        <h3>Generate a New Passage</h3>
        <button onClick={generateNewRC}>
          {genLoading ? "Generating…" : "Generate"}
        </button>
      </div>
    )}

    {phase === "ready" && (
      <div>
        <p>You’ve now understood this passage. Let’s test it.</p>
        <button onClick={startTest}>Take Test</button>
      </div>
    )}

    {phase === "test" && (
      <div>
        <h2>Mini RC Test</h2>
        {testQuestions.map((q, qi) => (
          <div key={qi}>
            <p>{q.prompt}</p>
            {q.options.map((o, oi) => (
              <button
                key={oi}
                onClick={() =>
                  setTestAnswers(a => ({ ...a, [qi]: oi }))
                }
              >
                {o}
              </button>
            ))}
          </div>
        ))}
        <button onClick={submitTest}>Submit</button>
      </div>
    )}

    {phase === "result" && result && (
      <div>
        <h2>Result</h2>
        <p>
          Score: {score}/{testQuestions.length}
        </p>
        <button onClick={() => setPhase("detailed")}>
          Detailed Review
        </button>
      </div>
    )}

    {phase === "detailed" && (
      <div>
        <h3>Detailed Review</h3>
        {testQuestions.map((q, i) => {
          const qa = result.questionAnalysis.find(
            x => x.qIndex === i
          );
          return (
            <div key={i}>
              <p>{q.prompt}</p>
              <p>
                Correct: {q.options[q.correctIndex]}
              </p>
              <p>{qa?.correctExplanation}</p>
            </div>
          );
        })}
        <button onClick={() => setPhase("result")}>
          Back
        </button>
      </div>
    )}
  </>
)}
    </div>
  );
}
