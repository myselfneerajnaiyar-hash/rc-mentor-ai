"use client";
import { useState, useEffect } from "react";
import MentorView from "./MentorView";
import Navbar from "./Navbar";
import RCProfile from "./RCProfile";
import { supabase } from "../lib/supabase";
import RCHistory from "./RCHistory";
import TabGroup from "./TabGroup";
import BirbalMessage from "./BirbalMessage";
import { FileText, HelpCircle, Brain, Clock } from "lucide-react";
import PracticeSwitcher from "./PracticeSwitcher";

export default function RCView({view,setView }) {
  const [rcTab, setRcTab] = useState("paste");
  useEffect(() => {
  async function checkUser() {
   const { data, error } = await supabase.auth.getUser();
console.log("User check:", data, error);
  }

  checkUser();
}, []);

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
  const [birbalMessage, setBirbalMessage] = useState("");
  const [birbalChatQ, setBirbalChatQ] = useState(null);
const [birbalChatMessages, setBirbalChatMessages] = useState([]);
const [birbalInput, setBirbalInput] = useState("");

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
  // mentor | ready | test | result | newRC | profile | detailed | vocab | loading-adaptive | plan-complete
  
// home | rc | vocab | speed | cat

  const [generatedRC, setGeneratedRC] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
   const [fullPassage, setFullPassage] = useState("");
  const [activeProfileTab, setActiveProfileTab] = useState("overview");
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [planRCCount, setPlanRCCount] = useState(0);
  const [rcMode, setRcMode] = useState("free"); 
  const [autoPlanMode, setAutoPlanMode] = useState(false);
  const [planGenreIndex, setPlanGenreIndex] = useState(0);
// "free" | "plan"

  // ---- VOCAB STATE ----
  const [vocabDrill, setVocabDrill] = useState([]);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabTimer, setVocabTimer] = useState(0);
  const [vocabRunning, setVocabRunning] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [vocabBank, setVocabBank] = useState([]);
  const [learningWord, setLearningWord] = useState(null);
  const planGenres = [
  "Philosophy",
  "Economics",
  "Sociology",
  "Technology & Society",
  "Culture Studies",
  "Political Theory",
];

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
  
useEffect(() => {
  function handler() {
    const g = planGenres[planGenreIndex % planGenres.length];

    setRcMode("plan");
    setGenre(g);
    setDifficulty("pro");
    setLengthRange("500-600");

    setPlanGenreIndex(i => i + 1); // move to next genre for next RC
    setAutoPlanMode(false);   // important
setRcTab("generate");     // switch tab
setShowGenerator(true);
setPhase("mentor");       // prevent loading screen
  }

  window.addEventListener("start-plan-drill", handler);
  return () => window.removeEventListener("start-plan-drill", handler);
}, [planGenreIndex]);


  
 useEffect(() => {
  if (
    autoPlanMode &&
    rcMode === "plan" &&
    showGenerator &&
    phase === "mentor"
  ) {
    generateNewRC();
  }
}, [autoPlanMode, rcMode, showGenerator, phase]);
  
  useEffect(() => {
  if (phase === "test" && testQuestions.length > 0) {
    setCurrentQStart(Date.now());
  }
}, [phase, testQuestions]);

 useEffect(() => {
  if (
    autoPlanMode &&
    rcMode === "plan" &&
    showGenerator &&
    phase === "plan-loading"
  ) {
    generateNewRC();
  }
}, [autoPlanMode, rcMode, showGenerator, phase]);

useEffect(() => {
  function openRC() {
    setRcTab("generate");
  }

  window.addEventListener("open-rc-generate", openRC);
  return () =>
    window.removeEventListener("open-rc-generate", openRC);
}, []);
  
  function splitPassage() {
  const raw = text.trim();
  if (!raw) return;

  const parts = raw
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
    
  setFullPassage(raw);
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

  function generateTimeDiagnosis(qs) {
  const rushedWrong = qs.filter(q => q.timeSpent < 15 && q.status === "wrong");
  const slowWrong = qs.filter(q => q.timeSpent > 45 && q.status === "wrong");
  const slowCorrect = qs.filter(q => q.timeSpent > 45 && q.status === "correct");
  const fastCorrect = qs.filter(q => q.timeSpent <= 25 && q.status === "correct");

  let lines = [];

  if (rushedWrong.length)
    lines.push("You rushed through some questions and paid for it with accuracy.");

  if (slowWrong.length)
    lines.push("On a few questions, you spent a lot of time and still went wrong—this signals clarity gaps, not speed issues.");

  if (slowCorrect.length)
    lines.push("Even when correct, some answers took too long, indicating inefficient processing.");

  if (fastCorrect.length)
    lines.push("Your best answers came quickly, showing strong instinct when comprehension is clear.");

  if (!lines.length)
    lines.push("Your time distribution is balanced, but consistency will raise your ceiling.");

  return lines.join(" ");
}

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
setBirbalMessage(
  "Let's think through this paragraph carefully. Focus on what the author is trying to argue, not just what is being described."
);
// 🔹 AUTO SAVE DIFFICULT WORDS TO WORDBANK
if (normalized.difficultWords && normalized.difficultWords.length > 0) {

  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    console.log("No logged in user. Cannot save words.");
    return;
  }

  const wordsToInsert = normalized.difficultWords.map(w => ({
    user_id: authData.user.id,
    word: typeof w === "string" ? w : w.word || w.term,
    meaning: typeof w === "string" ? "" : w.meaning || w.definition || "",
    added_from: "rc-guided",
    difficulty_tag: "auto",
  }));

  const { error: saveError } = await supabase
    .from("user_words")
    .upsert(wordsToInsert, { onConflict: "user_id,word" });

  if (saveError) {
    console.log("WORD SAVE ERROR:", saveError);
  } else {
    console.log("Words saved successfully");
  }
}

if (normalized.primaryQuestion) {
  setMode("showingPrimary");
}


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
     setBirbalMessage(
  "Good. You caught the author's logic. Strong RC readers track the argument, not individual sentences."
);
        setMode("solved");
      } else {
       setFeedback("Not quite.");

setBirbalMessage(
  "Notice what the author is really emphasizing here. The trap option usually repeats words from the passage but misses the author's intent."
);
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

  function openBirbalChat(qIndex) {
  setBirbalChatQ(qIndex);

  setBirbalChatMessages([
    {
      role: "assistant",
      content:
        "I’m Birbal. Ask me anything about this question or the author's reasoning."
    }
  ]);
}

async function startTest(passageOverride = null) {
  setPhase("test-loading");
  setTestLoading(true);
  setError("");

  setTimeLeft(6 * 60);
  setTimerRunning(true);

  setTestQuestions([]);
  setTestAnswers({});
  setQuestionTimes({});
  setResult(null);

  setTestStartTime(Date.now());
  setCurrentQIndex(0);
  setCurrentQStart(Date.now());

  try {
    const full = passageOverride
      ? passageOverride
      : (fullPassage && fullPassage.trim().length > 0
          ? fullPassage
          : paras.join("\n\n"));

    const res = await fetch("/api/rc-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passage: full, mode: "normal" }),
    });

    if (!res.ok) throw new Error();

    const json = await res.json();

    const normalized = (json.questions || []).map(q => ({
      ...q,
     type: q.type
  ? q.type.trim().toLowerCase().replace(/\s+/g, "-")
  : "unknown"
    }));

    setTestQuestions(normalized);
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
  console.log("SUBMIT FUNCTION CALLED");
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
    const full =
  fullPassage && fullPassage.trim().length > 0
    ? fullPassage
    : paras.join("\n\n");
    const res = await fetch("/api/rc-diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  passage: full,
  questions: testQuestions,
  answers: testAnswers,
  times: questionTimes,
  difficulty:difficulty,
}),
    });

    if (!res.ok) throw new Error();

    const json = await res.json();
    console.log("FULL DIAGNOSE RESPONSE:", json);
    setResult(json);
    setPhase("result");
    // 🔐 Get logged in user
const { data: authData, error: authError } = await supabase.auth.getUser();
console.log("Auth data inside submit:", authData);

if (authError || !authData?.user) {
  console.log("No logged in user.");
  return;
}
const userId = authData.user.id;
console.log("Saving for user:", userId);
const totalQuestions = testQuestions.length;

const correctAnswers = testQuestions.reduce(
  (count, q, i) =>
    count + (Number(testAnswers[i]) === Number(q.correctIndex) ? 1 : 0),
  0
);

const totalTimeTaken = Math.round(
  (Date.now() - testStartTime) / 1000
);

console.log("About to insert:", {
  userId,
  totalQuestions,
  correctAnswers,
  totalTimeTaken,
});

const { data: sessionData, error: sessionError } =
  await supabase
    .from("rc_sessions")
    .insert([
      {
        user_id: userId,
        passage_id: fullPassage.slice(0, 50), // keep this if you want short identifier
        passage_text: full,                 // ⭐ THIS IS THE REAL FIX
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        time_taken_sec: totalTimeTaken,
        difficulty: difficulty,
      },
    ])
    .select()
    .single();
    if (sessionError || !sessionData) {
  console.log("Session insert failed:", sessionError);
  return;
}

const sessionId = sessionData.id;
console.log("Created session ID:", sessionId);

// 🔹 1. Insert analytics (keep this)
const analyticsRows = testQuestions.map((q, i) => ({
  session_id: sessionId,
  user_id: userId,
  question_type: (q.type || "inference").trim().toLowerCase(),
  is_correct: Number(testAnswers[i]) === Number(q.correctIndex),
  time_taken_sec: questionTimes[i] || 0,
}));

await supabase
  .from("rc_questions")
  .insert(analyticsRows);


// 🔹 2. Insert FULL QUESTION DATA (history table)
const fullRows = testQuestions.map((q, i) => {
 const qa = json.questionAnalysis?.find(x => x.qIndex === i);

 return {
  session_id: sessionId,

  question_text: q.prompt,
  options: q.options,

  // CORRECT ANSWER
  correct_answer: q.options[q.correctIndex],
  correct_answer_index: q.correctIndex,

  // USER ANSWER
  user_answer: testAnswers[i] != null
    ? q.options[testAnswers[i]]
    : null,
  user_answer_index: testAnswers[i] != null
    ? Number(testAnswers[i])
    : null,

  explanation: qa?.correctExplanation || "",
  temptation: qa?.temptation || "",
  why_wrong: qa?.whyWrong || null,

  question_type: (q.type || "inference").trim().toLowerCase(),
  time_taken_sec: questionTimes[i] || 0,

  is_correct:
    testAnswers[i] != null &&
    Number(testAnswers[i]) === Number(q.correctIndex),
};
});

const { error: fullError } = await supabase
  .from("rc_session_questions")
  .insert(fullRows);

if (fullError) {
  console.log("Full question insert error:", fullError);
}




    
    // ---- Save RC Profile ----
const existing = JSON.parse(localStorage.getItem("rcProfile") || "{}");

const record = {
  date: Date.now(),
  questions: testQuestions.map((q, i) => ({
    type: (q.type || "inference").trim().toLowerCase(),
    correct: Number(testAnswers[i]) === Number(q.correctIndex),
    time: questionTimes[i] || 0,
  })),
};

existing.tests = existing.tests || [];
existing.tests.push(record);
localStorage.setItem("rcProfile", JSON.stringify(existing));
    // ---- UPDATE DAILY & WEEKLY PLAN (ONLY IN PLAN MODE) ----
if (rcMode === "plan") {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  // DAILY RC COUNT
  const daily = JSON.parse(localStorage.getItem("rcDailyProgress") || "{}");
  daily[todayKey] = Math.min(3, (daily[todayKey] || 0) + 1); // cap at 3
  localStorage.setItem("rcDailyProgress", JSON.stringify(daily));

  // WEEKLY PLAN UPDATE
  function getWeekId(d) {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = (d - start) / 86400000;
    return d.getFullYear() + "-W" + Math.ceil((diff + start.getDay() + 1) / 7);
  }

  const weekId = getWeekId(today);
  const plans = JSON.parse(localStorage.getItem("rcWeeklyPlan") || "{}");

  if (plans[weekId]) {
    const dayIndex = (today.getDay() + 6) % 7;
    const day = plans[weekId].days[dayIndex];

    day.rcDone = Math.min(3, day.rcDone + 1);

    const focus = plans[weekId].skills;
    record.questions.forEach(q => {
      if (focus.includes(q.type)) {
        day.skillQs = Math.min(10, day.skillQs + 1);
      }
    });

    localStorage.setItem("rcWeeklyPlan", JSON.stringify(plans));
  }
}
 
    } catch (e) {
  setError("Could not submit test.");
} finally {
  setTestLoading(false);
}

} // <-- closes submitTest
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

const birbalHints = {
  inference:
    "The author rarely states the answer directly. Ask yourself: what must logically follow from the passage?",

  "main-idea":
    "Ignore the details and focus on the author's central claim. What is the passage trying to prove?",

  tone:
    "Tone questions depend on attitude. Look for subtle approval, criticism, or skepticism in the language.",

  detail:
    "Detail questions are not about memory alone. Revisit the exact part of the passage where this idea appears.",

  purpose:
    "Ask why the author introduced this idea or example. What role does it play in the argument?",

  assumption:
    "An assumption is something the argument depends on but does not explicitly state. What must be true for the author's reasoning to work?",

  strengthen:
    "A strengthening option adds support to the author's claim. Look for evidence that makes the argument more convincing.",

  weaken:
    "A weakening option introduces doubt in the author's reasoning or evidence.",

  paradox:
    "Paradox questions involve two facts that seem contradictory. The correct answer resolves the tension between them.",

  application:
    "Application questions ask you to extend the author's logic to a new situation.",

  default:
    "Look closely at what the author is trying to prove rather than focusing only on isolated facts."
};

async function sendBirbalMessage() {

  if (!birbalInput.trim()) return;

  const q = testQuestions[birbalChatQ];
  console.log("Birbal question:", q);

  const newMessages = [
    ...birbalChatMessages,
    { role: "user", content: birbalInput }
  ];

  setBirbalChatMessages(newMessages);
  setBirbalInput("");

  const res = await fetch("/api/birbal-question", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
 body: JSON.stringify({
  passage: fullPassage,

  question: {
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex
  },

  chat: newMessages
})
});
  const json = await res.json();

  setBirbalChatMessages([
    ...newMessages,
    { role: "assistant", content: json.reply }
  ]);
}

function formatBirbal(text) {
  if (!text) return text;

  return text
    .replace(/Correct Logic:/gi, "\n\n🧠 Correct Logic\n")
    .replace(/Trap Logic:/gi, "\n\n⚠ Trap Logic\n")
    .replace(/Passage Proof:/gi, "\n\n📖 Passage Proof\n")
    .replace(/Quick Lesson:/gi, "\n\n🎯 Quick Lesson\n");
}

return (
  <div className="min-h-screen text-white">
     
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>

{/* MOBILE PRACTICE SWITCHER */}
<div className="flex gap-2 md:hidden mb-4">

</div>
    {view === "rc" && (
  <div style={{ marginTop: 16, marginBottom: 16 }}>
    <div style={{ marginBottom: 32 }}>
  <TabGroup
    tabs={[
      { label: "Paste your passage", value: "paste" },
      { label: "Generate Passage", value: "generate" },
      { label: "RC Profile", value: "profile" },
      { label: "RC History", value: "history" },
    ]}
    active={rcTab}
    onChange={(value) => {
  setRcTab(value);

  // RESET RC STATE
  setParas([]);
  setIndex(0);
  setData(null);
  setFeedback("");
  setMode("idle");

  setGeneratedRC(null);
  setTestQuestions([]);
  setTestAnswers({});
  setResult(null);

  setDirectTestMode(false);
  setFullPassage("");

  setPhase("mentor");
}}
  />
  </div>
</div>
)}
 
       
   </div>

  {view === "rc" && (
  <>
  {rcTab === "paste" &&
  paras.length === 0 &&
  phase === "mentor" &&
  rcMode !== "plan" && (
   <MentorView
  text={text}
  setText={setText}
  splitPassage={splitPassage}
/>
)}
  {paras.length > 0 && phase === "mentor" && (
 <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

    <h3 className="text-xl font-semibold mb-4">
  Paragraph {index + 1}
</h3>
    <div className="mb-4 text-slate-300 leading-relaxed">
  {paras[index]}
</div>

    {!data && (
      <button
  onClick={explain}
  disabled={loading}
  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white"
>
  {loading ? "Thinking..." : "Explain this paragraph"}
</button>
    )}

   {data && (
  <div style={{ marginTop: 16 }}>
   <h4 className="text-lg font-semibold mt-6 mb-2">
  In simple words
</h4>
<p className="text-slate-300 leading-relaxed mb-6">
  {data.simpleExplanation || data.summary}
</p>

{birbalMessage && (
  <div className="mb-6">
    <BirbalMessage text={birbalMessage} />
  </div>
)}

  {(data.difficultWords || data.vocab) && (data.difficultWords || data.vocab).length > 0 && (
  <>
    <h4 className="mt-6 mb-2 font-semibold text-slate-200">
  Difficult Words
</h4>
   <ul className="pl-6 text-slate-300 space-y-1 mb-6">
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

   

        {mode === "showingPrimary" && (
          <>
          <p className="font-semibold text-lg mt-6 mb-3">
  {data.primaryQuestion.question ||
   data.primaryQuestion.prompt ||
   "Choose the correct option:"}
</p>
           {data.primaryQuestion.options.map((o, i) => (
 <button
  key={i}
  onClick={() => choose(i)}
  className="w-full text-left mb-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all"
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
   className={`block w-full text-left mb-2 px-3 py-2 rounded-lg border border-slate-700 transition ${
 i === data.easierQuestion.correctIndex
    ? "bg-indigo-900"
    : "bg-slate-800 hover:bg-slate-700"
}`}
  >
    {o}
  </button>
))}
          </>
        )}

        {mode === "solved" && (
          <>
            <p>{feedback}</p>
           <button
  onClick={nextParagraph}
  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-white mt-4"
>
  Next Paragraph
</button>
          </>
        )}
      </div>
    )}
  </div>
)}
  {rcTab === "generate" && paras.length === 0 && !generatedRC && (
  <div className="mt-6">
    {/* INTRO SECTION */}
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold mb-4">
        CAT-Level Reading Comprehension Generator
      </h2>

      <p className="text-slate-400 text-lg leading-relaxed">
        Train on AI-generated passages designed to simulate real CAT difficulty.
        Each passage is structured to test inference depth, logical clarity,
        and conceptual understanding — not surface reading.
      </p>

     <div className="mt-6">
        <h4 className="font-semibold mb-3 text-slate-200">
          What you get:
        </h4>

       <ul className="space-y-4 mt-4">

  <li className="flex items-start gap-3 text-slate-300">
    <FileText className="w-5 h-5 text-indigo-400 mt-1" />
    <span><b>4 structured paragraphs</b> — layered, argument-driven content</span>
  </li>

  <li className="flex items-start gap-3 text-slate-300">
    <HelpCircle className="w-5 h-5 text-emerald-400 mt-1" />
    <span><b>4 CAT-style questions</b> — inference-heavy and trap-based</span>
  </li>

  <li className="flex items-start gap-3 text-slate-300">
    <Brain className="w-5 h-5 text-purple-400 mt-1" />
    <span><b>Detailed mentor explanations</b> — conceptual clarity + traps decoded</span>
  </li>

  <li className="flex items-start gap-3 text-slate-300">
    <Clock className="w-5 h-5 text-amber-400 mt-1" />
    <span><b>Accuracy + time diagnosis</b> — speed vs comprehension insights</span>
  </li>

</ul>
      </div>
    </div>

    {/* GENERATOR CARD */}
   {/* GENERATOR SECTION */}
<div className="max-w-3xl">
<h3 className="text-xl font-semibold text-white mt-10 mb-4">
  Generate a CAT-style RC Passage
</h3>

<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">


    <div className="flex gap-4 mb-4 flex-wrap">
     <select
  value={genre}
  onChange={e => setGenre(e.target.value)}
 className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
>
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

      <select
  value={difficulty}
  onChange={e => setDifficulty(e.target.value)}
 className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
>
        <option value="beginner">Beginner</option>
        <option value="moderate">Moderate</option>
        <option value="advanced">Advanced</option>
        <option value="pro">Pro (CAT Killer)</option>
      </select>

     <select
  value={lengthRange}
  onChange={e => setLengthRange(e.target.value)}
  className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
>
        <option value="300-400">300–400</option>
        <option value="400-500">400–500</option>
        <option value="500-600">500–600</option>
        <option value="600-700">600–700</option>
      </select>
    </div>

   <button
  onClick={generateNewRC}
  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white mt-4"
>
      {genLoading ? "Generating…" : "Generate Passage"}
    </button>
  </div>
  </div>
  </div>
)}
    {phase === "newRC" && generatedRC && (
  <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
    <h2>Your passage is ready.</h2>
    <p className="text-slate-400">
      How would you like to approach it?
    </p>

    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16 }}>
      <button
       onClick={() => {
  const parts = generatedRC.passage
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  setFullPassage(generatedRC.passage); // 🔧 CRITICAL
  setDirectTestMode(false);

  setParas(parts);
  setIndex(0);
  setData(null);
  setFeedback("");
  setMode("idle");
  setPhase("mentor");
}}
       className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white"
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
    startTest(generatedRC.passage);   // pass directly
  }}
 className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-white"
>
  Take it as a Test
</button>
  </div>
  </div>
)}
    

    {phase === "plan-loading" && (
  <div style={{ marginTop: 40, textAlign: "center" }}>
    <h3>Preparing your CAT-style RC…</h3>
    <p>Setting up today’s drill.</p>
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
   {phase === "plan-complete" && (
  <div style={{ marginTop: 40, textAlign: "center" }}>
    <h2>🎉 Bravo!</h2>
    <p>You’ve completed today’s RC target.</p>
    <p><b>RCs:</b> 3 / 3</p>
    <p>
      You can return tomorrow for the next drill or continue in free mode.
    </p>

    <button
      onClick={() => {
        setRcMode("free");
        setPlanRCCount(0);
        setPhase("mentor");
        setShowGenerator(false);
      }}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white"
    >
      Continue in Free Mode
    </button>
  </div>
)}
    
    {phase === "ready" && !directTestMode && (
  <div>
    <p>You’ve now understood this passage. Let’s test it.</p>
    <button onClick={() => startTest(fullPassage)}>
  Take Test
</button>
  </div>
)}

{phase === "ready" && directTestMode && (
  <div style={{ marginTop: 20 }}>
    <button onClick={startTest}>Start Test</button>
  </div>
)}
   
   {rcTab === "profile" && (
  <RCProfile
    activeTab={activeProfileTab}
    setActiveTab={setActiveProfileTab}
    onBack={() => setRcTab("paste")}
    setView={setView}   // ✅ ADD THIS
  />
)}

{rcTab === "history" && (
  <RCHistory
    onBack={() => setRcTab("paste")}
  />
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
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6"
    >
      <h4>Passage</h4>
      <p style={{ whiteSpace: "pre-wrap" }}>{fullPassage}</p>
    </div>

    {(() => {
      const q = testQuestions[currentQIndex];
      if (!q) return null;

      return (
        <div
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6"
        >
         <p className="font-semibold text-lg mb-2">
  Q{currentQIndex + 1}. {q.prompt}
</p>

          {q.options.map((o, oi) => (
            <button
              key={oi}
              onClick={() =>
                setTestAnswers(a => ({ ...a, [currentQIndex]: oi }))
              }
             className={`block w-full text-left mb-2 px-4 py-3 rounded-xl border transition-all
  ${
    testAnswers[currentQIndex] === oi
      ? "bg-indigo-600 border-indigo-500 text-white"
      : "bg-slate-800 border-slate-700 hover:bg-slate-700"
  }`}
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
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white"
    >
      Submit Test
    </button>
  </div>
)}
   {phase === "result" && result && (
  <div className="mt-10 space-y-8">
    <h2 className="text-2xl font-bold mb-4">
  Test Summary
</h2>



   <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
  <div className="text-lg">
    <span className="text-slate-400">Score:</span>{" "}
    <span className="font-semibold">
      {score}/{testQuestions.length}
    </span>
  </div>

  <div className="text-lg mt-2">
    <span className="text-slate-400">Accuracy:</span>{" "}
    <span className="font-semibold">
      {Math.round((score / testQuestions.length) * 100)}%
    </span>
  </div>
</div>
   <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
 <h4 className="text-lg font-semibold mb-3">
  ⏱ Time Analysis
</h4>

  <p><b>Average time / question:</b> {avgTime}s</p>
  <p><b>Total time:</b> {totalTime}s</p>
  <p style={{ color: "#555" }}>CAT benchmark: 40–45s per RC question</p>

  <ul className="space-y-1 mt-3 text-slate-300">
    <li>⚡ Rushed (&lt;15s): {bandCounts.rushed}</li>
    <li>🎯 Optimal (15–45s): {bandCounts.optimal}</li>
    <li>🐢 Overthinking (&gt;45s): {bandCounts.slow}</li>
  </ul>
</div>

   {result && (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6 space-y-4">
   <h4 className="text-lg font-semibold mb-3">
  Mentor’s Diagnosis
</h4>

<div className="mb-6">
  <BirbalMessage text={result.summary} />
</div>
   <div>
  <h5 className="font-semibold mb-1">
    Mentor’s Time Diagnosis
  </h5>
  <p className="text-slate-400 leading-relaxed">
    {generateTimeDiagnosis(result.questionAnalysis)}
  </p>
</div>

    {result.strengths && (
      <>
        <h4>Strengths</h4>
        <ul className="space-y-2 mt-2">
  {result.strengths.map((s, i) => (
    <li
      key={i}
      className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-2 text-green-200"
    >
      ✓ {s}
    </li>
  ))}
</ul>
      </>
    )}

    {result.weaknesses && (
      <>
        <h4>Weaknesses</h4>
        <ul className="space-y-2 mt-2">
  {result.weaknesses.map((w, i) => (
    <li
      key={i}
      className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-red-200"
    >
      ⚠ {w}
    </li>
  ))}
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
<div style={{ display: "flex", gap: 12, marginTop: 12 }}>
  <button
    onClick={() => setPhase("detailed")}
   className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white"
  >
    View Detailed Review
  </button>

 <button
 onClick={() => {
  if (rcMode === "plan") {
    if (planRCCount + 1 < 3) {
      setPlanRCCount(c => c + 1);

      setGeneratedRC(null);
      setParas([]);
      setIndex(0);
      setData(null);
      setFeedback("");
      setMode("idle");
      setShowGenerator(true);
      setPhase("plan-loading");
   } else {
  setPlanRCCount(3);
  setPhase("plan-complete");

  const todayKey = new Date().toISOString().slice(0, 10);
  localStorage.setItem("rcPlanDone-" + todayKey, "true");
}
  } else {
    // Free mode behaviour
    setParas([]);
    setIndex(0);
    setData(null);
    setFeedback("");
    setMode("idle");
    setGeneratedRC(null);
    setTestQuestions([]);
    setTestAnswers({});
    setResult(null);
    setDirectTestMode(false);
    setFullPassage("");
    setShowGenerator(true);
    setPhase("mentor");
  }
}}
>
  {rcMode === "plan" ? "Start Next RC" : "Generate New Passage"}
</button>
</div>
  </div>
)}
    {phase === "plan-loading" && (
  <div style={{ marginTop: 40, textAlign: "center" }}>
    <h3>Preparing your CAT-style RC…</h3>
    <p>Generating a high-difficulty passage.</p>
  </div>
)}

  {phase === "detailed" && result && (
  <div style={{ marginTop: 24 }}>
    <h3>Detailed Review</h3>

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
      <h4 className="font-semibold mb-2">Passage</h4>
      <p style={{ whiteSpace: "pre-wrap" }}>{fullPassage}</p>
    </div>

    {testQuestions.map((q, i) => {
     const qa = result.questionAnalysis?.find(x => x.qIndex === i);
      const userAns = testAnswers[i];

      return (
        <div
  key={i}
  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6"
>
        <p style={{ fontWeight: 600 }}>
  Q{i + 1}. {q.prompt}
</p>

{qa?.timeSpent != null && (
  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
    ⏱ Time taken: {qa.timeSpent}s
  </p>
)}
<p style={{ fontSize: 12, color: "#6b7280" }}>
  Type: {q.type || "inference"}
</p>

        {q.options.map((o, oi) => {
  const isCorrect = oi === q.correctIndex;
  const isUser = oi === userAns;

  let classes =
    "px-4 py-3 rounded-xl mb-2 border transition-all ";

  if (isCorrect) {
    classes +=
      "bg-emerald-900/40 border-emerald-600 text-emerald-200";
  } else if (isUser && !isCorrect) {
    classes +=
      "bg-red-900/40 border-red-600 text-red-200";
  } else {
    classes +=
      "bg-slate-800 border-slate-700 text-slate-200";
  }

  return (
    <div key={oi} className={classes}>
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
   <p className="mb-4">{qa.correctExplanation}</p>

<div className="mb-6">
  <BirbalMessage
    text={birbalHints[q.type] || birbalHints.default}
  />
</div>

<button
  onClick={() => openBirbalChat(i)}
  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
>
  Still confused? Ask Birbal
</button>

   {qa?.temptation && qa.temptation.trim() !== "" && (
  <>
    <h5 className="font-semibold text-amber-300 mt-4 mb-1">
      Why this option looked tempting
    </h5>
    <p className="text-amber-200 leading-relaxed">
      {qa.temptation}
    </p>
  </>
)}

    {qa?.whyWrong && Object.keys(qa.whyWrong).length > 0 && (
  <>
    <h5 className="font-semibold text-slate-200 mt-4 mb-2">
      Why the other options fail
    </h5>
    <ul className="space-y-2 text-slate-300">
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

{birbalChatQ !== null && (
 <div className="
fixed bottom-0 left-0 right-0
md:bottom-6 md:right-6 md:left-auto md:w-[420px]

bg-slate-900 border-t border-slate-700
md:border md:rounded-xl

p-4 shadow-xl
h-[60vh] md:h-auto
overflow-y-auto
">
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-semibold">Ask Birbal</h4>

      <button
        onClick={() => setBirbalChatQ(null)}
        className="text-slate-400 hover:text-white"
      >
        ✕
      </button>
    </div>
    
   

    <div className="h-64 overflow-y-auto text-sm mb-3 space-y-4 pr-2">
  {birbalChatMessages.map((m, i) => (
    <div
      key={i}
      className={`mb-3 flex ${
        m.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] px-3 py-2 rounded-lg leading-relaxed whitespace-pre-wrap ${
          m.role === "user"
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-slate-200"
        }`}
      >
      {formatBirbal(m.content)}
      </div>
    </div>
  ))}
</div>

  <input
  value={birbalInput}
  onChange={(e) => setBirbalInput(e.target.value)}
  className="w-full p-2 bg-slate-800 rounded text-sm border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder="Ask Birbal..."
/>

    <button
      onClick={sendBirbalMessage}
      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white"
    >
      Ask
    </button>

  </div>
)}
    </div>
  );
}
