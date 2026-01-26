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
 const [directTestMode, setDirectTestMode] = useState(false)
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
   const [fullPassage, setFullPassage] = useState("");
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

 useEffect(() => {
  if (!timerRunning) return;

  if (timeLeft <= 0) {
    setTimerRunning(false);
    submitTest();
    return;
  }

  const t = setInterval(() => {
    setTimeLeft(t => t - 1);
  }, 1000);

  return () => clearInterval(t);
}, [timerRunning, timeLeft]);
  
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

// Normalize API response into what RCView expects
const normalized = {
  summary: json.explanation || "",
  simpleExplanation: json.explanation || "",
  difficultWords: json.difficultWords || [],
  primaryQuestion: json.primaryQuestion || null,
  easierQuestion: json.easierQuestion || null,
};

setData(normalized);

if (normalized.primaryQuestion) {
  setMode("showingPrimary");
}
setData(normalized);

// Only enter question mode if a question exists
if (normalized.primaryQuestion) {
  setMode("showingPrimary");
}
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
setTimeLeft(6 * 60); // 6 minutes
setTimerRunning(true);
    setTestQuestions([]);
    setTestAnswers({});
    setQuestionTimes({});
    setResult(null);

    try {
      const full = fullPassage;
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
      setTimeLeft(6 * 60); // 6 minutes
setTimerRunning(true);
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
   {paras.length === 0 && phase === "mentor" && (
  <MentorView
    text={text}
    setText={setText}
    splitPassage={splitPassage}
    setShowGenerator={setShowGenerator}
  />
)}

  {paras.length > 0 && phase === "mentor" && (
  <div style={{ marginTop: 20, background: "#fff", padding: 20, borderRadius: 12 }}>

    <h3>Paragraph {index + 1}</h3>
    <div style={{ marginBottom: 12 }}>{paras[index]}</div>

    {!data && (
      <button onClick={explain} disabled={loading}>
        {loading ? "Thinking..." : "Explain this paragraph"}
      </button>
    )}

   {data && (
  <div style={{ marginTop: 16 }}>
    <h4>In simple words</h4>
    <p style={{ color: "#374151" }}>
      {data.simpleExplanation || data.summary}
    </p>
  {(data.difficultWords || data.vocab) && (data.difficultWords || data.vocab).length > 0 && (
  <>
    <h4>Difficult Words</h4>
    <ul style={{ paddingLeft: 20, color: "#374151" }}>
      {(data.difficultWords || data.vocab).map((w, i) => (
        <li key={i}>
          {typeof w === "string" ? (
            <b>{w}</b>
          ) : (
            <>
              <b>{w.word || w.term}</b>: {w.meaning || w.definition}
            </>
          )}
        </li>
      ))}
    </ul>
  </>
)}

    <h4>Main Idea</h4>
    <p><b>{data.summary}</b></p>

        {mode === "showingPrimary" && (
          <>
           <p style={{ fontWeight: 600 }}>
  {data.primaryQuestion.question ||
   data.primaryQuestion.prompt ||
   "Choose the correct option:"}
</p>
           {data.primaryQuestion.options.map((o, i) => (
  <button
    key={i}
    onClick={() => choose(i)}
    style={{
      display: "block",
      width: "100%",
      textAlign: "left",
      marginBottom: 8,
      padding: "10px 12px",
      borderRadius: 6,
      border: "1px solid #d1d5db",
      background: "#f9fafb",
    }}
  >
    {o}
  </button>
))}
          </>
        )}

        {mode === "showingEasier" && (
          <>
          <p style={{ fontWeight: 600 }}>
  {data.easierQuestion.question ||
   data.easierQuestion.prompt ||
   "Choose the correct option:"}
</p>
           {data.easierQuestion.options.map((o, i) => (
  <button
    key={i}
    onClick={() => choose(i)}
    style={{
      display: "block",
      width: "100%",
      textAlign: "left",
      marginBottom: 8,
      padding: "10px 12px",
      borderRadius: 6,
      border: "1px solid #d1d5db",
      background: "#f9fafb",
    }}
  >
    {o}
  </button>
))}
          </>
        )}

        {mode === "solved" && (
          <>
            <p>{feedback}</p>
            <button onClick={nextParagraph}>Next Paragraph</button>
          </>
        )}
      </div>
    )}
  </div>
)}
   {showGenerator && (
  <div
    style={{
      marginTop: 16,
      padding: 20,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
    }}
  >
    <h3>Generate a CAT-style RC Passage</h3>

    <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
      <select value={genre} onChange={e => setGenre(e.target.value)}>
        <option>Philosophy</option>
        <option>Psychology</option>
        <option>Economics</option>
        <option>Sociology</option>
        <option>History</option>
        <option>Political Theory</option>
        <option>Environmental Studies</option>
        <option>Technology & Society</option>
        <option>Ethics</option>
        <option>Literary Criticism</option>
        <option>Education</option>
        <option>Anthropology</option>
        <option>Behavioral Science</option>
        <option>Neuroscience</option>
        <option>Public Policy</option>
        <option>Culture Studies</option>
        <option>Media Studies</option>
        <option>Gender Studies</option>
        <option>Urban Studies</option>
        <option>Globalization</option>
        <option>Mixed (CAT-style)</option>
      </select>

      <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
        <option value="beginner">Beginner</option>
        <option value="moderate">Moderate</option>
        <option value="advanced">Advanced</option>
        <option value="pro">Pro (CAT Killer)</option>
      </select>

      <select value={lengthRange} onChange={e => setLengthRange(e.target.value)}>
        <option value="300-400">300–400</option>
        <option value="400-500">400–500</option>
        <option value="500-600">500–600</option>
        <option value="600-700">600–700</option>
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
      {genLoading ? "Generating…" : "Generate Passage"}
    </button>
  </div>
)}
    {phase === "newRC" && generatedRC && (
  <div
    style={{
      marginTop: 24,
      padding: 24,
      borderRadius: 12,
      background: "#f8fafc",
      border: "1px solid #e5e7eb",
      textAlign: "center",
    }}
  >
    <h2>Your passage is ready.</h2>
    <p style={{ color: "#555" }}>
      How would you like to approach it?
    </p>

    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16 }}>
      <button
        onClick={() => {
          const parts = generatedRC.passage
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(Boolean);
          setDirectTestMode(false);

          setParas(parts);
          setIndex(0);
          setData(null);
          setFeedback("");
          setMode("idle");
          setPhase("mentor");
        }}
        style={{
          padding: "12px 18px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        Guided Explanation Mode
      </button>

    <button
  onClick={() => {
  setDirectTestMode(true);
  setFullPassage(generatedRC.passage);
  setParas([]);
  setTestQuestions([]);
  setTestAnswers({});
  setPhase("test-loading");
  startTest();
}}
  style={{
    padding: "12px 18px",
    background: "green",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
  }}
>
  Take it as a Test
</button>
  </div>
  </div>
)}

  {phase === "test-loading" && (
  <div style={{ marginTop: 40, textAlign: "center" }}>
    <h3>Preparing your CAT RC Test…</h3>
    <p>Generating passage-based questions.</p>
  </div>
)
    
    {phase === "ready" && !directTestMode && (
  <div>
    <p>You’ve now understood this passage. Let’s test it.</p>
    <button onClick={startTest}>Take Test</button>
  </div>
)}

{phase === "ready" && directTestMode && (
  <div style={{ marginTop: 20 }}>
    <button onClick={startTest}>Start Test</button>
  </div>
)}
   {phase === "test" && (
  <div style={{ marginTop: 20 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <h2>Mini RC Test</h2>
      <div style={{ fontWeight: 600 }}>
        Time Left: {Math.floor(timeLeft / 60)}:
        {String(timeLeft % 60).padStart(2, "0")}
      </div>
    </div>

    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
        lineHeight: 1.6,
      }}
    >
      <h4>Passage</h4>
      <p style={{ whiteSpace: "pre-wrap" }}>{fullPassage}</p>
    </div>

    {testQuestions.map((q, qi) => (
      <div
        key={qi}
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <p style={{ fontWeight: 600 }}>
          Q{qi + 1}. {q.prompt}
        </p>

        {q.options.map((o, oi) => (
          <button
            key={oi}
            onClick={() =>
              setTestAnswers(a => ({ ...a, [qi]: oi }))
            }
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              marginBottom: 8,
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background:
                testAnswers[qi] === oi ? "#dbeafe" : "#f9fafb",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    ))}

    <button
      onClick={submitTest}
      style={{
        padding: "12px 20px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
      }}
    >
      Submit Test
    </button>
    {loading && (
  <p style={{ marginTop: 12, color: "#555" }}>
    Evaluating your responses and preparing your diagnosis report…
  </p>
)
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
