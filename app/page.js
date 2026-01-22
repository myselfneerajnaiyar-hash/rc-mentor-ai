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
 // mentor | ready | test | result | newRC | profile | detailed | vocab

  const [generatedRC, setGeneratedRC] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("overview");
  const [questionStartTime, setQuestionStartTime] = useState(null);
const [questionTimes, setQuestionTimes] = useState({});
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [vocabDrill, setVocabDrill] = useState([]);
const [vocabIndex, setVocabIndex] = useState(0);
const [vocabTimer, setVocabTimer] = useState(0);
const [vocabRunning, setVocabRunning] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [vocabBank, setVocabBank] = useState([]);
  const [learningWord, setLearningWord] = useState(null);
  
  function loadVocab() {
  return JSON.parse(localStorage.getItem("vocabBank") || "[]");
}

function saveVocab(words) {
  localStorage.setItem("vocabBank", JSON.stringify(words));
}


  function addToVocab(d) {
  const bank = loadVocab();

  if (bank.some(w => w.word.toLowerCase() === d.word.toLowerCase())) return;

  const stub = {
    word: d.word,
    meaning: d.meaning || "",
    partOfSpeech: "",
    usage: "",
    synonyms: [],
    antonyms: [],
    root: "",
    correctCount: 0,
    enriched: false,
  };

  const updated = [...bank, stub];
saveVocab(updated);
refreshFromBank();
enrichWord(stub);
}
  async function enrichWord(w) {
  try {
    const res = await fetch("/api/enrich-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: w.word,
        meaning: w.meaning
      })
    });

    const data = await res.json();

    const bank = loadVocab();
    const updated = bank.map(x =>
      x.word.toLowerCase() === w.word.toLowerCase()
        ? {
            ...x,
            partOfSpeech: data.partOfSpeech || "",
            usage: data.usage || "",
            synonyms: data.synonyms || [],
            antonyms: data.antonyms || [],
            root: data.root || "",
            enriched: true
          }
        : x
    );

    saveVocab(updated);
    
    setVocabDrill(prev =>
  prev.map(x =>
    x.word.toLowerCase() === w.word.toLowerCase()
      ? {
          ...x,
          partOfSpeech: data.partOfSpeech || "",
          usage: data.usage || "",
          synonyms: data.synonyms || [],
          antonyms: data.antonyms || [],
          root: data.root || "",
          enriched: true
        }
      : x
  )
);
  } catch (e) {
    console.error("Enrichment failed", e);
  }
}
function computeStatus(w) {
  if (w.correctCount >= 3) return "mastered";
  if (w.correctCount >= 1) return "learning";
  return "new";
}
  function refreshFromBank() {
  const bank = loadVocab();
  setVocabBank(bank);

  setVocabDrill([]);
  setVocabIndex(0);
  setShowMeaning(false);
  setVocabRunning(false);
}
function startVocabDrill() {
  const bank = loadVocab();
  if (!bank || bank.length === 0) return;

  const sorted = [...bank].sort((a, b) => {
    const sa = computeStatus(a);
    const sb = computeStatus(b);
    const rank = { new: 0, learning: 1, mastered: 2 };
    return rank[sa] - rank[sb];
  });

  const drill = sorted.slice(0, 10);

  // 🔴 Enrich all missing words immediately
  drill.forEach(w => {
    if (!w.enriched) enrichWord(w);
  });

  setVocabDrill(drill);
  setVocabIndex(0);
  setVocabTimer(120);
  setShowMeaning(false);
  setVocabRunning(true);
}
useEffect(() => {
  setVocabBank(loadVocab());
}, []);

  useEffect(() => {
  if (phase === "vocab") {
    setShowMeaning(false);
  }
}, [phase]);
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
  useEffect(() => {
  if (!vocabRunning) return;
  if (vocabTimer <= 0) {
    setVocabRunning(false);
    return;
  }

  const id = setInterval(() => {
    setVocabTimer(t => t - 1);
  }, 1000);

  return () => clearInterval(id);
}, [vocabRunning, vocabTimer]);
  
 useEffect(() => {
  const existing = loadVocab();
  if (!existing.length) {
    saveVocab([
      {
        word: "Obscure",
        meaning: "Hard to understand",
        partOfSpeech: "Adjective",
        synonyms: ["unclear", "vague", "cryptic"],
        antonyms: ["clear", "obvious"],
        usage: "The author’s argument was obscure and difficult to follow.",
        root: "Latin: obscurus (dark, hidden)",
        correctCount: 0,
        enriched: true,
      },
      {
        word: "Pragmatic",
        meaning: "Practical and realistic",
        partOfSpeech: "Adjective",
        synonyms: ["practical", "realistic", "down-to-earth"],
        antonyms: ["idealistic", "impractical"],
        usage: "She took a pragmatic approach to solving the problem.",
        root: "Greek: pragma (deed, action)",
        correctCount: 0,
        enriched: true,
      },
      {
        word: "Ambiguous",
        meaning: "Open to more than one interpretation",
        partOfSpeech: "Adjective",
        synonyms: ["unclear", "vague"],
        antonyms: ["definite", "clear"],
        usage: "His reply was deliberately ambiguous.",
        root: "Latin: ambiguus (uncertain)",
        correctCount: 0,
        enriched: true,
      },
      {
        word: "Conundrum",
        meaning: "A confusing problem",
        partOfSpeech: "Noun",
        synonyms: ["puzzle", "dilemma"],
        antonyms: ["solution"],
        usage: "Choosing between the two offers was a real conundrum.",
        root: "Unknown / playful English origin",
        correctCount: 0,
        enriched: true,
      },
      {
        word: "Nuance",
        meaning: "A subtle difference",
        partOfSpeech: "Noun",
        synonyms: ["subtlety", "shade"],
        antonyms: ["obviousness"],
        usage: "He missed the nuance in her tone.",
        root: "French: nuance (shade)",
        correctCount: 0,
        enriched: true,
      },
    ]);
  }
   
// 🔧 ADD THIS
  setVocabBank(loadVocab());
}, []);

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
 async function startAdaptiveRC() {
   try {
  setIsAdaptive(true);
setShowGenerator(false);

// 🔴 HARD RESET OLD RC VIEW
setParas([]);
setIndex(0);
setData(null);
setFeedback("");
setMode("idle");

// show intentional loading screen
setPhase("loading-adaptive")
    const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
    const tests = raw.tests || [];


   if (!tests.length) {
  // bootstrap adaptive mode for first-time user
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
     localStorage.setItem("lastGenre", json.genreHint || "");

  const parts = json.passage
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  setParas(parts);
  setIndex(0);
  setData(null);
  setFeedback("");
  setMode("idle");
  setShowGenerator(false);
  setPhase("mentor");
  return;
}
    const all = tests.flatMap(t => t.questions);

    const byType = {};
    all.forEach(q => {
      if (!byType[q.type]) {
        byType[q.type] = { correct: 0, wrong: 0, fastWrong: 0, slowWrong: 0 };
      }
      if (q.correct) byType[q.type].correct++;
      else byType[q.type].wrong++;
      if (!q.correct && q.time < 20) byType[q.type].fastWrong++;
      if (!q.correct && q.time > 45) byType[q.type].slowWrong++;
    });

    const weakest = Object.entries(byType)
      .map(([type, d]) => ({ type, wrong: d.wrong }))
      .sort((a, b) => b.wrong - a.wrong)[0]?.type || "inference";

    let fast = 0, slow = 0;
    Object.values(byType).forEach(d => {
      fast += d.fastWrong;
      slow += d.slowWrong;
    });

    const style = fast >= slow ? "impulsive" : "overthinking";

   const last = localStorage.getItem("lastGenre") || "";

const profile = JSON.parse(localStorage.getItem("rcProfile") || "{}");

const res = await fetch("/api/rc-generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    genre: "Mixed",
    difficulty: "adaptive",
    lengthRange: "400-500",
    bias: {
      weakest,
      style,
      avoidTopic: profile.lastTopic || "",
    },
  }),
});

    if (!res.ok) throw new Error();

    const json = await res.json();
    localStorage.setItem("lastGenre", json.genreHint || "");

    const parts = json.passage
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

   // store last topic so next adaptive RC can avoid it
profile.lastTopic = json.topic || "education";
localStorage.setItem("rcProfile", JSON.stringify(profile));
    setGeneratedRC(null);
    setParas(parts);
    setIndex(0);
    setData(null);
    setFeedback("");
    setMode("idle");
    setShowGenerator(false);
    setPhase("mentor");
  } catch (e) {
    console.error(e);
    setShowGenerator(true);
    setPhase("mentor");
  }
}

const score = testQuestions.reduce(
  (s, q, i) =>
    s + (Number(testAnswers[i]) === Number(q.correctIndex) ? 1 : 0),
  0
);

 const showInitial =
  paras.length === 0 &&
  !showGenerator &&
  phase !== "newRC" &&
  !isAdaptive;

const showGenPanel = showGenerator && !isAdaptive;
  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
  <h1
  style={{ cursor: "pointer", margin: 0 }}
  onClick={() => {
    setIsAdaptive(false);   // 👈 ADD THIS LINE

    // universal home reset
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
    setIsAdaptive(false);   // 👈 ADD THIS
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
      style={{ padding: "6px 12px", borderRadius: 6 }}
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
    padding: "6px 12px",
    borderRadius: 6,
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
    
      {/* Initial Paste Screen */}
     {phase === "mentor" && showInitial && (
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
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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
          setPhase("profile");
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
  </>
)}
 {showGenPanel && (
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
{phase === "profile" && (() => {
  const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
  const tests = raw.tests || [];

  if (!tests.length) {
    return (
      <div style={{ marginTop: 20, padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>RC Profile</h3>
        <p>No test data yet. Take at least one RC test to build your profile.</p>
        <button onClick={() => setPhase("mentor")}>Back</button>
      </div>
    );
  }

  const all = tests.flatMap(t => t.questions);
  const totalQ = all.length;
  const correct = all.filter(q => q.correct).length;
  const avgTime = Math.round(all.reduce((a, b) => a + b.time, 0) / totalQ);
  const accuracy = Math.round((correct / totalQ) * 100);

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
    <div style={{ marginTop: 20 }}>
      <h2>RC Profile</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["overview", "skills", "speed", "plan"].map(t => (
          <button
            key={t}
            onClick={() => setActiveProfileTab(t)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: activeProfileTab === t ? "#2563eb" : "#f3f4f6",
              color: activeProfileTab === t ? "#fff" : "#111",
              fontWeight: 600,
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
     {activeProfileTab === "overview" && (
  <div style={{ display: "grid", gap: 16 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {[
        { label: "Accuracy", value: accuracy + "%" },
        { label: "Avg Time / Q", value: avgTime + "s" },
        { label: "RCs Attempted", value: tests.length },
        { label: "Total Questions", value: totalQ },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: "#555" }}>{c.label}</div>
        </div>
      ))}
    </div>

    <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 10 }}>
      <p style={{ margin: 0, fontStyle: "italic" }}>
        Your RC profile is stabilizing into a recognizable pattern.  
        This dashboard will sharpen with every test you take.
      </p>
    </div>
  </div>
)}

      {/* SKILLS */}
    {activeProfileTab === "skills" && (
  <div style={{ display: "grid", gap: 20 }}>
    {Object.entries(byType).map(([type, d]) => {
      const correct = d.fastCorrect + d.slowCorrect;
      const wrong = d.fastWrong + d.slowWrong;
      const total = correct + wrong || 1;

      const pctCorrect = Math.round((correct / total) * 100);
      const pctWrong = 100 - pctCorrect;

      const diagnosis = {
        "main-idea": {
          text: "You often sense the topic but miss the author’s real argument.",
          habit: "Before answering, ask: “What is the author really trying to prove?”",
        },
        tone: {
          text: "You rely on isolated words instead of the passage’s emotional arc.",
          habit: "Re-read the final paragraph before choosing.",
        },
        inference: {
          text: "You jump to conclusions before implications fully mature.",
          habit: "Pause and ask: “Is this stated or merely suggested?”",
        },
        detail: {
          text: "You react to familiar phrases instead of verifying the exact line.",
          habit: "Re-locate the exact sentence in the passage before answering.",
        },
      }[type] || {
        text: "Pattern emerging in this area.",
        habit: "Slow down and anchor each answer in the passage.",
      };

      return (
        <div
          key={type}
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fafafa",
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 20,
            alignItems: "center",
          }}
        >
          {/* Donut */}
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: `conic-gradient(
                #22c55e 0deg ${pctCorrect * 3.6}deg,
                #ef4444 ${pctCorrect * 3.6}deg 360deg
              )`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              color: "#111",
              backgroundColor: "#fff",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {pctCorrect}%
            </div>
          </div>

          {/* Text */}
          <div>
            <h3 style={{ margin: 0, textTransform: "capitalize" }}>
              {type.replace("-", " ")}
            </h3>

            <p style={{ margin: "6px 0", color: "#444" }}>
              🟢 {correct} correct &nbsp; | &nbsp; 🔴 {wrong} wrong
            </p>

            <p style={{ margin: "6px 0", fontSize: 14 }}>
              {diagnosis.text}
            </p>

            <p style={{ marginTop: 8, fontStyle: "italic", fontSize: 13 }}>
              Habit: {diagnosis.habit}
            </p>
          </div>
        </div>
      );
    })}
  </div>
)}
      {/* SPEED MAP */}
     
{activeProfileTab === "speed" && (() => {
  // Build dominant insight
  let worst = { type: "", mode: "", value: -1 };

  const labels = [
    { key: "fastCorrect", label: "Fast & Right", color: "34,197,94" },
    { key: "slowCorrect", label: "Slow & Right", color: "59,130,246" },
    { key: "slowWrong", label: "Slow & Wrong", color: "251,146,60" },
    { key: "fastWrong", label: "Fast & Wrong", color: "239,68,68" },
  ];

  Object.entries(byType).forEach(([type, d]) => {
    const map = {
      fastCorrect: d.fastCorrect,
      slowCorrect: d.slowCorrect,
      slowWrong: d.slowWrong,
      fastWrong: d.fastWrong,
    };

    Object.entries(map).forEach(([k, v]) => {
      if (v > worst.value) {
        worst = { type, mode: k, value: v };
      }
    });
  });

  const modeText = {
    fastCorrect: "answer quickly and correctly",
    slowCorrect: "get it right but spend too much time",
    slowWrong: "think long and still get it wrong",
    fastWrong: "answer too fast and lose marks",
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ fontSize: 13, color: "#444" }}>
        Each row is a question type.  
        Each column shows <b>how</b> you behave under time for that type.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 6 }}>Type</th>
              {labels.map(l => (
                <th key={l.key} style={{ padding: 6, fontSize: 13 }}>
                  {l.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.entries(byType).map(([type, d]) => {
              const row = {
                fastCorrect: d.fastCorrect,
                slowCorrect: d.slowCorrect,
                slowWrong: d.slowWrong,
                fastWrong: d.fastWrong,
              };

              return (
                <tr key={type}>
                  <td style={{ padding: 6, fontWeight: 600 }}>
                    {type.replace("-", " ")}
                  </td>

                  {labels.map(l => {
                    const v = row[l.key];
                    const alpha = Math.min(0.15 + v * 0.08, 0.85);
                    return (
                      <td
                        key={l.key}
                        style={{
                          padding: 6,
                          textAlign: "center",
                          background: `rgba(${l.color}, ${alpha})`,
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {worst.value > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 8,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        >
          🔍 You lose most marks in{" "}
          <b>{worst.type.replace("-", " ")}</b> questions because you{" "}
          <b>{modeText[worst.mode]}</b>.
        </div>
      )}
    </div>
  );
})()}

     {/* ACTION PLAN */}
{activeProfileTab === "plan" && (() => {
  const weakness = Object.entries(byType).map(([type, d]) => {
    const wrong = d.fastWrong + d.slowWrong;
    const total = d.fastCorrect + d.slowCorrect + d.fastWrong + d.slowWrong;
    return { type, wrong, total };
  });

  weakness.sort((a, b) => b.wrong - a.wrong);

  const primary = weakness[0];
  const secondary = weakness[1];

  let modes = { fastWrong: 0, slowWrong: 0 };
  Object.values(byType).forEach(d => {
    modes.fastWrong += d.fastWrong;
    modes.slowWrong += d.slowWrong;
  });

  const dominantMode =
    modes.fastWrong >= modes.slowWrong ? "impulsive" : "confused";

  const modeAdvice = {
    impulsive: {
      label: "Impulsive Answering",
      text: "You are losing marks by answering too fast before clarity forms.",
      habit: "Enforce a 3–5 second pause before clicking any option.",
    },
    confused: {
      label: "Overthinking",
      text: "You spend time but still lose accuracy due to fuzzy comprehension.",
      habit: "After each paragraph, whisper a one-line summary.",
    },
  };

  const m = modeAdvice[dominantMode];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          padding: 18,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Your RC Training Plan</h3>

        <p>
          Your biggest leakage is in{" "}
          <b>{primary.type.replace("-", " ")}</b> questions.
        </p>

        {secondary && (
          <p>
            Secondary weak zone:{" "}
            <b>{secondary.type.replace("-", " ")}</b>
          </p>
        )}
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#fff7ed",
        }}
      >
        <h4 style={{ marginTop: 0 }}>Core Behaviour Pattern</h4>
        <p>
          <b>{m.label}:</b> {m.text}
        </p>
        <p style={{ fontStyle: "italic" }}>
          Daily Habit → {m.habit}
        </p>
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
        }}
      >
        <h4 style={{ marginTop: 0 }}>What the System Will Do</h4>
        <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14 }}>
          <li>Increase {primary.type} questions</li>
          {secondary && <li>Inject {secondary.type} drills</li>}
          <li>Track your habit compliance</li>
          <li>Re-balance when errors drop</li>
        </ul>
      </div>

      <button
       onClick={startAdaptiveRC}
        style={{
          marginTop: 8,
          padding: "14px 20px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Start Adaptive RC
      </button>
    </div>
  );
})()}
 
  {phase === "vocab" && (
  <div style={{ marginTop: 40 }}>
    <div
      style={{
        background: "#fffbeb",
        border: "1px solid #fde68a",
        padding: 24,
        borderRadius: 12,
      }}
    >
      <h2 style={{ color: "#92400e" }}>📘 Vocabulary Builder</h2>
      <p style={{ color: "#78350f" }}>
        Build a personal word-bank that grows with your reading.
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
       <button
  onClick={() => {
    setPhase("vocab");
    startVocabDrill();
  }}
  style={{
    background: "#f59e0b",
    color: "white",
    padding: "10px 16px",
    borderRadius: 6,
    fontWeight: 600,
  }}
>
  Start Today’s 10-Word Drill
</button>

        <button
          style={{
            border: "1px solid #f59e0b",
            color: "#92400e",
            padding: "10px 16px",
            borderRadius: 6,
            background: "transparent",
          }}
        >
          Add Custom Word
        </button>
      </div>
<div style={{ marginTop: 24 }}>
  <h3>Your Word Bank</h3>

{vocabBank.length === 0 ? (
  <p style={{ color: "#a16207" }}>
    No saved words yet. Words you save during RC will appear here.
  </p>
) : (
  <>
    <p style={{ fontSize: 13, color: "#78350f", marginBottom: 8 }}>
      Enriching a word adds usage, synonyms, antonyms, and roots using AI.
    </p>

    <ul>
      {vocabBank.map((w, i) => (
        <li
          key={i}
          style={{ marginBottom: 8, cursor: "pointer" }}
          onClick={() => setLearningWord(w)}
        >
          <b>{w.word}</b> – {w.meaning}
          <span style={{ marginLeft: 8, fontSize: 12, color: "#555" }}>
            ({computeStatus(w)})
          </span>

          {!w.enriched && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                enrichWord(w);
              }}
              style={{
                marginLeft: 10,
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 4,
                border: "1px solid #f59e0b",
                background: "#fff7ed",
                color: "#92400e",
              }}
            >
              Enrich
            </button>
          )}

          {w.enriched && (
            <span style={{ marginLeft: 10, fontSize: 11, color: "green" }}>
              ✓ Enriched
            </span>
          )}
        </li>
      ))}
    </ul>
  </>
)}

{learningWord && (
  <div
    style={{
      marginTop: 24,
      padding: 16,
      border: "1px solid #fde68a",
      borderRadius: 10,
      background: "#fffbeb",
    }}
  >
    <h2>{learningWord.word}</h2>
    <p><b>Meaning:</b> {learningWord.meaning}</p>

    {learningWord.partOfSpeech && (
      <p><b>Part of Speech:</b> {learningWord.partOfSpeech}</p>
    )}

    {learningWord.usage && (
      <p><b>Usage:</b> {learningWord.usage}</p>
    )}

    {learningWord.synonyms?.length > 0 && (
      <p><b>Synonyms:</b> {learningWord.synonyms.join(", ")}</p>
    )}

    {learningWord.antonyms?.length > 0 && (
      <p><b>Antonyms:</b> {learningWord.antonyms.join(", ")}</p>
    )}

    {learningWord.root && (
      <p><b>Root:</b> {learningWord.root}</p>
    )}

    {!learningWord.enriched && (
      <>
        <p style={{ fontSize: 12, color: "#92400e" }}>
          Enriching adds usage, synonyms, antonyms, and roots using AI.
        </p>
        <button
          onClick={() => enrichWord(learningWord)}
          style={{
            marginTop: 6,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #f59e0b",
            background: "#fff7ed",
            color: "#92400e",
            fontWeight: 600,
          }}
        >
          Enrich this word
        </button>
      </>
    )}

    <button
      onClick={() => setLearningWord(null)}
      style={{ marginTop: 12, display: "block" }}
    >
      Close
    </button>
  </div>
)}
{vocabRunning && vocabDrill.length > 0 && (
  <div style={{ marginTop: 24 }}>
    <div style={{ fontWeight: 600 }}>
      ⏱ {Math.floor(vocabTimer / 60)}:
      {(vocabTimer % 60).toString().padStart(2, "0")}
    </div>

   {(() => {
  const w = vocabDrill[vocabIndex];
  return (
    <div>
      <h2>{w.word}</h2>

   {!showMeaning && (
  <button onClick={() => setShowMeaning(true)}>
    Reveal Meaning
  </button>
)}

{showMeaning && (
  <div style={{ marginTop: 12 }}>
    <p><b>Meaning:</b> {w.meaning}</p>

    {w.partOfSpeech && (
      <p><b>Part of Speech:</b> {w.partOfSpeech}</p>
    )}

    {w.usage && (
      <p><b>Usage:</b> {w.usage}</p>
    )}

    {w.synonyms?.length > 0 && (
      <p><b>Synonyms:</b> {w.synonyms.join(", ")}</p>
    )}

    {w.antonyms?.length > 0 && (
      <p><b>Antonyms:</b> {w.antonyms.join(", ")}</p>
    )}

    {w.root && (
      <p><b>Root:</b> {w.root}</p>
    )}
  </div>
)}
  );
})()}
     <button
  style={{ marginTop: 16 }}
  onClick={() => {
    if (vocabIndex + 1 >= vocabDrill.length) {
      setVocabRunning(false);
      setVocabDrill([]);
    } else {
      setVocabIndex(i => i + 1);
      setShowMeaning(false);
    }
  }}
>
  Next →
</button>
  </div>
);
     {!vocabRunning && vocabDrill.length === 0 && (
  <div style={{ marginTop: 24, textAlign: "center" }}>
    <h3>🎉 Drill Complete</h3>
    <p>You’ve revised today’s words.</p>
   <button
  onClick={() => {
    refreshFromBank();
    startVocabDrill();
  }}
  style={{
    marginTop: 12,
    background: "#f59e0b",
    color: "white",
    padding: "8px 14px",
    borderRadius: 6,
    fontWeight: 600,
  }}
>
  Restart Drill
</button>
  </div>
)}
    </div>


  {phase === "loading-adaptive" && (
  <div style={{ padding: 40, textAlign: "center", fontSize: 18 }}>
    Preparing your next adaptive passage…
  </div>
)}
  
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
      <button
        onClick={() => addToVocab(d)}
        style={{
          marginLeft: 8,
          fontSize: 12,
          padding: "2px 6px",
          borderRadius: 4,
        }}
      >
        + Save
      </button>
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
      {phase === "ready" && !testLoading && (
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
{testLoading && (
  <div style={{ padding: 40, textAlign: "center", fontSize: 18 }}>
    Generating your CAT-style RC test…
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
  onClick={() => setPhase("detailed")}
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
    // wipe old RC session completely
    setGeneratedRC(null);
    setTestQuestions([]);
    setTestAnswers({});
    setResult(null);

    // reset reading state
    setParas([]);
    setText("");
    setIndex(0);
    setData(null);
    setFeedback("");
    setMode("idle");

    if (isAdaptive) {
      // 🔁 Continue adaptive loop
      startAdaptiveRC();
    } else {
      // 🧭 Manual mode → open generator
      setShowGenerator(true);
      setPhase("mentor");
    }
  }}
>
  Start Next RC With This Focus
</button>
      </div>
    </div>
  );
})()}

 {phase === "detailed" && (
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

         <p><b>Correct Answer:</b> {q.options[q.correctIndex]}</p>

<p><b>Why the correct option is correct:</b></p>
<p>{qa?.correctExplanation}</p>

<p><b>Why the other options are wrong:</b></p>
<ul>
  {q.options.map((opt, oi) => (
    <li key={oi}>
      <b>Option {String.fromCharCode(65 + oi)}:</b>{" "}
      {qa?.whyWrong?.[String(oi)] ||
        qa?.optionExplanations?.[oi] ||
        "This option does not align with the passage’s logic."}
      {studentChoice === oi && status === "wrong" && (
        <span style={{ color: "#b45309" }}> ← You chose this</span>
      )}
    </li>
  ))}
</ul>

{status === "wrong" && (qa?.temptation || qa?.chosenExplanation) && (
  <>
    <p><b>Why this option felt tempting:</b></p>
    <p>{qa?.temptation || qa?.chosenExplanation}</p>
  </>
)}
        </div>
      );
    })}

    <button
      onClick={() => setPhase("result")}
      style={{ marginTop: 20, padding: "10px 16px" }}
    >
      Back to Result
    </button>
  </div>
)}

   
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
