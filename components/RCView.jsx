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
  const [testStartTime, setTestStartTime] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
const [currentQStart, setCurrentQStart] = useState(null);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("mentor");
   const [directTestMode, setDirectTestMode] = useState(false)
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
  0
  useEffect(() => {
  if (phase === "test" && testQuestions.length > 0) {
    setCurrentQStart(Date.now());
  }
}, [phase, testQuestions]);
  
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
  // 1. Move UI into loading mode immediately
  setPhase("test-loading");
  setTestLoading(true);
  setError("");

  // 2. Reset all test state
  setTimeLeft(6 * 60); // 6 minutes
  setTimerRunning(true);

  setTestQuestions([]);
  setTestAnswers({});
  setQuestionTimes({});
  setResult(null);

  // 3. Initialize timing anchors
  setTestStartTime(Date.now());
  setCurrentQIndex(0);
  setCurrentQStart(Date.now());

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

    // 4. Enter test screen
    setPhase("test");
  } catch {
    setError("Could not generate test.");
    setPhase("ready");
  } finally {
    setTestLoading(false);
  }
}

  function moveToQuestion(nextIndex) {
  const spent = Math.round((Date.now() - currentQStart) / 1000);

  setQuestionTimes(t => ({
    ...t,
    [currentQIndex]: (t[currentQIndex] || 0) + spent,
  }));

  setCurrentQIndex(nextIndex);
  setCurrentQStart(Date.now());
}
  
 async function submitTest() {
  // ⬇️ Capture time for the current active question
  if (currentQStart != null) {
    const spent = Math.round((Date.now() - currentQStart) / 1000);
    setQuestionTimes(t => ({
      ...t,
      [currentQIndex]: (t[currentQIndex] || 0) + spent,
    }));
  }

  setTimerRunning(false);
  setPhase("test-loading");
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
  times: questionTimes,
}),
    });

    if (!res.ok) throw new Error();

    const json = await res.json();
    setResult(json);
    setPhase("result");
  } catch {
    setError("Could not analyze your test.");
    setPhase("test");
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
  const score = testQuestions.reduce(
  (s, q, i) =>
    s + (Number(testAnswers[i]) === Number(q.correctIndex) ? 1 : 0),
  0
);

// ---- TIME ANALYSIS ----
const timeStats = result?.questionAnalysis?.map(q => q.timeSpent || 0) || [];

const totalTime = timeStats.reduce((a, b) => a + b, 0);
const avgTime = timeStats.length
  ? Math.round(totalTime / timeStats.length)
  : 0;

function timeBand(t) {
  if (t < 15) return "rushed";
  if (t <= 45) return "optimal";
  return "slow";
}

const bandCounts = {
  rushed: timeStats.filter(t => timeBand(t) === "rushed").length,
  optimal: timeStats.filter(t => timeBand(t) === "optimal").length,
  slow: timeStats.filter(t => timeBand(t) === "slow").length,
};

return (
  <div
    style={{
      minHeight: "100vh",
      fontFamily: "system-ui",
      background: "linear-gradient(180deg, #eef2ff, #f8fafc)",
      color: "#1f2937",
    }}
  >
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

    // DO NOT setPhase here
    startTest();   // startTest will handle test-loading → test
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
    {testQuestions.length === 0 ? (
      <>
        <h3>Preparing your CAT RC Test…</h3>
        <p>Generating passage-based questions.</p>
      </>
    ) : (
      <>
        <h3>Evaluating your responses…</h3>
        <p>Preparing your diagnosis report.</p>
      </>
    )}
  </div>
)}
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
  {phase === "test" && testQuestions.length > 0 && (
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

    {(() => {
      const q = testQuestions[currentQIndex];
      if (!q) return null;

      return (
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <p style={{ fontWeight: 600 }}>
            Q{currentQIndex + 1}. {q.prompt}
          </p>

          {q.options.map((o, oi) => (
            <button
              key={oi}
              onClick={() =>
                setTestAnswers(a => ({ ...a, [currentQIndex]: oi }))
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
                  testAnswers[currentQIndex] === oi ? "#dbeafe" : "#f9fafb",
              }}
            >
              {o}
            </button>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            {currentQIndex > 0 ? (
              <button onClick={() => moveToQuestion(currentQIndex - 1)}>
                Back
              </button>
            ) : (
              <div />
            )}

            {currentQIndex < testQuestions.length - 1 ? (
              <button onClick={() => moveToQuestion(currentQIndex + 1)}>
                Next
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      );
    })()}

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
  </div>
)}
   {phase === "result" && result && (
  <div style={{ marginTop: 24 }}>
    <h2>Test Summary</h2>

    <p><b>Score:</b> {score}/{testQuestions.length}</p>
    <p>
      <b>Accuracy:</b>{" "}
      {Math.round((score / testQuestions.length) * 100)}%
    </p>

   {result && (
  <div style={{ marginTop: 16 }}>
    <h4>Mentor’s Diagnosis</h4>
    <p>{result.summary}</p>

    {result.strengths && (
      <>
        <h4>Strengths</h4>
        <ul>
          {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </>
    )}

    {result.weaknesses && (
      <>
        <h4>Weaknesses</h4>
        <ul>
          {result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </>
    )}

    {result.nextFocus && (
      <>
        <h4>What to work on next</h4>
        <p>{result.nextFocus}</p>
      </>
    )}
  </div>
)}
    <button
      onClick={() => setPhase("detailed")}
      style={{
        marginTop: 12,
        padding: "10px 16px",
        borderRadius: 6,
        border: "1px solid #2563eb",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 600,
      }}
    >
      View Detailed Review
    </button>
  </div>
)}

   {phase === "detailed" && result && (
  <div style={{ marginTop: 24 }}>
    <h3>Detailed Review</h3>

    {testQuestions.map((q, i) => {
     const qa = result.questionAnalysis?.find(x => x.qIndex === i);
      const userAns = testAnswers[i];

      return (
        <div
          key={i}
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
         <p style={{ fontWeight: 600 }}>
  Q{i + 1}. {q.prompt}
</p>
<p style={{ fontSize: 12, color: "#6b7280" }}>
  Type: {q.type || "inference"}
</p>

          {q.options.map((o, oi) => {
            const isCorrect = oi === q.correctIndex;
            const isUser = oi === userAns;

            let bg = "#f9fafb";
            if (isCorrect) bg = "#dcfce7";
            if (isUser && !isCorrect) bg = "#fee2e2";

            return (
              <div
                key={oi}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  marginBottom: 6,
                  background: bg,
                  border: "1px solid #e5e7eb",
                }}
              >
                {o}
              </div>
            );
          })}

          <p style={{ marginTop: 8 }}>
            <b>Your Answer:</b>{" "}
            {userAns != null ? q.options[userAns] : "Not Attempted"}
          </p>

          <p>
            <b>Correct Answer:</b> {q.options[q.correctIndex]}
          </p>

         {qa && (
  <div style={{ marginTop: 10 }}>
    <b>Mentor’s Explanation:</b>
    <p>{qa.correctExplanation}</p>

    {qa.temptation && qa.temptation.trim() !== "" && (
      <>
        <b>Why your choice felt right:</b>
        <p style={{ color: "#7c2d12" }}>{qa.temptation}</p>
      </>
    )}

    {qa.whyWrong && (
      <>
        <b>Why the other options fail:</b>
        <ul>
          {Object.entries(qa.whyWrong).map(([k, v]) => (
            <li key={k}>
              <b>Option {String.fromCharCode(65 + Number(k))}:</b> {v}
            </li>
          ))}
        </ul>
      </>
    )}
  </div>
)}
        </div>
      );
    })}

    <button onClick={() => setPhase("result")}>
      Back to Summary
    </button>
  </div>
)}
  </>
)}
    </div>
  );
}
