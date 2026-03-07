"use client";
import { useState, useEffect } from "react";
import { vocabLessons, getTodayWords } from "../app/data/vocabLessons";
import VocabProfile from "../components/VocabProfile";
import { supabase } from "../lib/supabase";
import TabGroup from "../components/TabGroup";
import PracticeSwitcher from "./PracticeSwitcher";

export default function VocabLab() {
  const [tab, setTab] = useState("bank");
  const [manualWord, setManualWord] = useState("");
  const [lookup, setLookup] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [bank, setBank] = useState([]);
  const [mode, setMode] = useState("home"); // home | lesson | test | result


 useEffect(() => {
  fetchBank();
}, []);

async function fetchBank() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;


  const { data, error } = await supabase
    .from("user_words")
    .select("*")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

 if (!error && data) {
  const formatted = data.map(w => ({
    ...w,
    partOfSpeech: w.part_of_speech,
    synonyms:
  typeof w.synonyms === "string"
    ? w.synonyms.split(",").map(s => s.trim())
    : w.synonyms || [],

antonyms:
  typeof w.antonyms === "string"
    ? w.antonyms.split(",").map(s => s.trim())
    : w.antonyms || [],
  }));

  setBank(formatted);
}
}

async function enrichAllWords() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  const unenriched = bank.filter(
    w => !w.meaning || !w.synonyms || w.synonyms.length === 0
  );

  if (unenriched.length === 0) return;

  await fetch("/api/enrich-bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      words: unenriched.map(w => w.word),
      userId: authData.user.id,
    }),
  });

  await fetchBank(); // reload updated words
}

  async function handleManualAdd(word) {
    setManualWord("");
    setLookup(null);
    setLoadingLookup(true);

   const { data: authData } = await supabase.auth.getUser();
if (!authData?.user) return;

const res = await fetch("/api/enrich-word", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    word,
    userId: authData.user.id,
  }),
});

    const data = await res.json();
    setLoadingLookup(false);

    

// Check if word already exists
const { data: existing } = await supabase
  .from("user_words")
  .select("id")
  .eq("user_id", authData.user.id)
  .eq("word", word);

if (!existing || existing.length === 0) {
  await supabase.from("user_words").insert([
    {
      user_id: authData.user.id,
      word,
      meaning: data.meaning,
      part_of_speech: data.partOfSpeech,
      added_from: "manual",
    },
  ]);
}

// Refresh bank from database
await fetchBank();
  setLookup({
  word,
  ...data,
});
  }

  

  async function openWord(w) {
  // If already enriched in DB, just show
  if (w.part_of_speech && w.synonyms && w.synonyms.length) {
    setLookup(w);
    return;
  }

  setLoadingLookup(true);

 const { data: authData } = await supabase.auth.getUser();
if (!authData?.user) return;

const res = await fetch("/api/enrich-word", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    word: w.word,
    userId: authData.user.id,
  }),
});

  const data = await res.json();
  setLoadingLookup(false);

  // 🔥 UPDATE SUPABASE (NOT LOCALSTORAGE)
 await supabase
  .from("user_words")
  .update({
    part_of_speech: data.partOfSpeech || null,
    usage: data.usage || null,
    root: data.root || null,
    synonyms: (data.synonyms || []).join(", "),
    antonyms: (data.antonyms || []).join(", "),
  })
  .eq("id", w.id);
  // Reload fresh data from DB
  await fetchBank();

  // Show enriched data
  setLookup({
    ...w,
    ...data,
  });
}


  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 style={{ marginBottom: 12 }}>Vocabulary Lab</h1>

       <TabGroup
  active={tab}
  onChange={setTab}
  tabs={[
    { value: "bank", label: "WordBank" },
    { value: "drill", label: "Vocab Drills" },
    { value: "learn", label: "Learn" },
    { value: "profile", label: "Profile" },
  ]}
/>

       <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[420px]">
          {tab === "bank" && (
           <WordBank
  manualWord={manualWord}
  setManualWord={setManualWord}
  lookup={lookup}
  loading={loadingLookup}
  handleManualAdd={handleManualAdd}
  bank={bank}
  openWord={openWord}
  enrichAllWords={enrichAllWords}
/>
          )}
          {tab === "drill" && <VocabDrill />}
          {tab === "learn" && <VocabLearn />}
          {tab === "profile" && <VocabProfile />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function WordBank({
  manualWord,
  setManualWord,
  lookup,
  loading,
  handleManualAdd,
  bank,
  openWord,
  enrichAllWords
}) {
  const [bulkLoading, setBulkLoading] = useState(false);

   const unenrichedCount = bank.filter(
  w => !w.meaning || !w.synonyms || w.synonyms.length === 0
).length;
  return (
    <div>
     <h2 className="text-2xl font-semibold text-slate-100">
  WordBank
</h2>
      {unenrichedCount > 0 && (
 <div className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700">
    <p style={{ fontWeight: 600 }}>
      ⚡ To unlock full vocab drills, enrich your saved words.
    </p>
   <p className="text-sm text-slate-400">
      {unenrichedCount} word(s) need enrichment.
    </p>

   <button
  onClick={async () => {
    setBulkLoading(true);
    await enrichAllWords();
    setBulkLoading(false);
  }}
  disabled={bulkLoading}
      className="mt-3 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition disabled:opacity-50"
    >
     {bulkLoading ? "Enriching your wordbank..." : "Enrich All Words"}
    </button>
  </div>
)}
      <p className="text-slate-400">
        Your personal vocabulary memory. Words appear here automatically from RC,
        Speed Gym, or when you add them manually.
      </p>

     <div className="mt-6 p-4 rounded-xl border border-slate-700 bg-slate-800">
        <input
          placeholder="Type a word and press Enter"
          value={manualWord}
          onChange={e => setManualWord(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && manualWord.trim()) {
              handleManualAdd(manualWord.trim());
            }
          }}
          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {loading && <p style={{ marginTop: 12 }}>Looking up word…</p>}

       {lookup && (
 <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-slate-700">
            <h3>{lookup.word}</h3>
            <p><b>Meaning:</b> {lookup.meaning || "—"}</p>
            <p><b>Part of Speech:</b> {lookup.partOfSpeech || "—"}</p>
            <p><b>Usage:</b> {lookup.usage || "—"}</p>
            <p><b>Root:</b> {lookup.root || "—"}</p>
            <p><b>Synonyms:</b> {(lookup.synonyms || []).join(", ") || "—"}</p>
            <p><b>Antonyms:</b> {(lookup.antonyms || []).join(", ") || "—"}</p>
          </div>
        )}

       

        {bank.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4>Saved Words</h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {bank.map((w, i) => (
                <button
                  key={i}
                  onClick={() => openWord(w)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-left hover:bg-slate-700 transition"
                >
                  <b>{w.word}</b>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {w.partOfSpeech || ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VocabDrill() {
  const [stage, setStage] = useState("start"); // start | run | result
  const [bank, setBank] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
  loadDrillWords();
}, []);

async function loadDrillWords() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  const { data } = await supabase
    .from("user_words")
    .select("*")
    .eq("user_id", authData.user.id);

  if (!data) return;

  const formatted = data.map(w => ({
    ...w,
    synonyms:
  typeof w.synonyms === "string"
    ? w.synonyms.replace(/[\[\]"]/g, "").split(",").map(s => s.trim())
    : Array.isArray(w.synonyms)
      ? w.synonyms
      : [],

antonyms:
  typeof w.antonyms === "string"
    ? w.antonyms.replace(/[\[\]"]/g, "").split(",").map(s => s.trim())
    : Array.isArray(w.antonyms)
      ? w.antonyms
      : [],
  }));

  const enriched = formatted.filter(
    w =>
      (w.synonyms && w.synonyms.length > 0) ||
      (w.antonyms && w.antonyms.length > 0) ||
      w.usage
  );

  setBank(enriched);
}

function cleanOptions(arr) {
  const cleaned = arr
    .flat()
    .map(o => Array.isArray(o) ? o[0] : o)
    .filter(Boolean);

  return [...new Set(cleaned)];
}
  function makeSynonymQ(word) {
    const correct = word.synonyms?.[0];
    if (!correct) return null;

    const distractors = bank
      .filter(w => w.word !== word.word && w.synonyms?.length)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.synonyms[0]);

    if (distractors.length < 3) return null;

   const options = cleanOptions([...distractors, correct]);

if (options.length < 4) return null;

return {
  id: word.id,
  type: "synonym",
  prompt: `Closest meaning of`,
  word: word.word,
  correct,
  options: options.sort(() => Math.random() - 0.5),
};
  }

  function makeAntonymQ(word) {
    const correct = word.antonyms?.[0];
    if (!correct) return null;

    const distractors = bank
      .filter(w => w.word !== word.word && w.antonyms?.length)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.antonyms[0]);

    if (distractors.length < 3) return null;

   const options = cleanOptions([...distractors, correct]);

if (options.length < 4) return null;

return {
  id: word.id,
  type: "antonym",
  prompt: `Opposite of`,
  word: word.word,
  correct,
  options: options.sort(() => Math.random() - 0.5),
};
  }

  function makeFillBlankQ(word) {
    if (!word.usage) return null;

    const sentence = word.usage.replace(new RegExp(word.word, "i"), "___");
    const correct = word.word;

    const distractors = bank
      .filter(w => w.word !== word.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.word);

    if (distractors.length < 3) return null;

   const options = cleanOptions([...distractors, correct]);

if (options.length < 4) return null;

return {
  id: word.id,
  type: "fill",
  prompt: sentence,
  word: word.word,
  correct,
  options: options.sort(() => Math.random() - 0.5),
};
  }

  function buildQuestion(word) {
    const makers = [makeSynonymQ, makeAntonymQ, makeFillBlankQ].sort(
      () => Math.random() - 0.5
    );
    for (let fn of makers) {
      const q = fn(word);
      if (q) return q;
    }
    return null;
  }

 function startDrill() {
  if (bank.length < 10) {
    alert("Please enrich your words from WordBank first.");
    return;
  }

  // Proper shuffle
  const shuffled = [...bank]
    .sort(() => 0.5 - Math.random());

  const selectedWords = shuffled.slice(0, 10);

  const qs = selectedWords
    .map(w => buildQuestion(w))
    .filter(Boolean);

 if (qs.length === 0) {
  alert("Not enough enriched words yet.");
  return;
}

  setQuestions(qs.slice(0, 10));
  setIndex(0);
  setScore(0);
  setSelected(null);
  setHistory([]);
  setStartTime(Date.now());
  setEndTime(null);
  setStage("run");
}

  async function choose(opt) {
  if (selected) return;

  const q = questions[index];
  const correct = opt === q.correct;

  setSelected(opt);

  // Update score immediately
  if (correct) {
    setScore(prev => prev + 1);
  }

  // Push to history immediately
  setHistory(prev => [
    ...prev,
    { ...q, chosen: opt, isCorrect: correct }
  ]);

  // 🔥 Safe DB update (non-blocking)
  try {
    const { data: authData } = await supabase.auth.getUser();
   if (authData?.user) {
  await supabase.rpc("increment_word_progress", {
    p_user_id: authData.user.id,
    p_word_id: q.id,
    p_correct: correct,
  });
}
  } catch (e) {
    console.log("Progress update skipped");
  }

  const isLastQuestion = index + 1 >= questions.length;

if (isLastQuestion) {
  const end = Date.now();
  setEndTime(end);

  try {
    const { data: authData } = await supabase.auth.getUser();

    if (authData?.user) {
      const totalQuestions = questions.length;

      const finalHistory = [
        ...history,
        { ...q, chosen: opt, isCorrect: correct }
      ];

      const correctAnswers = finalHistory.filter(h => h.isCorrect).length;

      const accuracy = Math.round(
        (correctAnswers / totalQuestions) * 100
      );

      const timeTaken = Math.round((end - startTime) / 1000);

      await supabase.from("vocab_sessions").insert([
        {
          user_id: authData.user.id,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          accuracy: accuracy,
          time_taken_s: timeTaken,
          drill_type: "mixed",
        },
      ]);
    }
  } catch (e) {
    console.log("Vocab session not saved");
  }

  setTimeout(() => {
    setStage("result");
  }, 700);

} else {
  setTimeout(() => {
    setIndex(prev => prev + 1);
    setSelected(null);
  }, 700);
}
}
  if (stage === "start") {
    return (
      <div>
  <h2 className="text-2xl font-semibold text-slate-100">
    Vocab Drills
  </h2>
  <p className="text-slate-400 mt-2">
    10 mixed MCQs: meaning, opposite, usage.
  </p>
        <button
          onClick={startDrill}
          className="mt-8 w-full sm:w-auto px-8 py-3 rounded-2xl 
bg-gradient-to-r from-orange-500 to-orange-600 
hover:from-orange-400 hover:to-orange-500
text-white font-semibold tracking-wide
shadow-lg shadow-orange-900/30
transition-all duration-200
active:scale-[0.98]"
>
          Start Drill
        </button>
      </div>
    );
  }

  if (stage === "result") {
    const timeTaken = Math.round((endTime - startTime) / 1000);
    const accuracy = Math.round(
  (history.filter(h => h.isCorrect).length / questions.length) * 100
);
    return (

      <div className="space-y-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
  <h2 className="text-2xl font-semibold text-slate-100">
    Drill Complete
  </h2>

  <div className="mt-4 flex flex-wrap gap-6 text-slate-300 text-sm">
    <div>
      <span className="text-slate-400">Score</span>
      <div className="text-lg font-semibold text-slate-100">
        {score} / {questions.length}
      </div>
    </div>

    <div>
      <span className="text-slate-400">Accuracy</span>
      <div className="text-lg font-semibold text-orange-400">
        {accuracy}%
      </div>
    </div>

    <div>
      <span className="text-slate-400">Time</span>
      <div className="text-lg font-semibold text-slate-100">
        {timeTaken}s
      </div>
    </div>
  </div>
</div>

        <div className="space-y-3">
          {history.map((h, i) => (
           <div
  key={i}
  className={`p-4 rounded-xl border ${
    h.isCorrect
      ? "bg-emerald-900/30 border-emerald-700"
      : "bg-red-900/30 border-red-700"
  }`}
>
  <div className="font-semibold text-slate-100">
    {i + 1}. {h.word || "Fill in the blank"}
  </div>

  <div className="mt-2 text-sm text-slate-300">
    Your answer: <span className="font-medium">{h.chosen}</span>
  </div>

  {!h.isCorrect && (
    <div className="text-sm text-red-300">
      Correct answer: <span className="font-medium">{h.correct}</span>
    </div>
  )}
</div>
          ))}
        </div>

        <button
          onClick={startDrill}
          style={{
            marginTop: 16,
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #f97316",
            background: "#fff7ed",
            color: "#c2410c",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Start Next Drill
        </button>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div>
      <div className="mb-4 text-slate-400">
        Q {index + 1} / {questions.length}
      </div>

      {q.type === "fill" ? (
        <h3 style={{ marginBottom: 16 }}>{q.prompt}</h3>
      ) : (
       <h3 className="mb-4 text-lg font-semibold text-slate-100">
          {q.prompt} <span style={{ color: "#f97316" }}>{q.word}</span>
        </h3>
      )}

      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          

         return (
  <button
    key={i}
    onClick={() => choose(opt)}
    className={`px-4 py-3 rounded-xl border transition text-left ${
      selected
        ? opt === q.correct
          ? "bg-emerald-900/40 border-emerald-600 text-emerald-200"
          : opt === selected
          ? "bg-red-900/40 border-red-600 text-red-200"
          : "bg-slate-800 border-slate-700 text-slate-300"
        : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
    }`}
  >
    {opt}
  </button>
);
        })}
      </div>
    </div>
  );
}
function VocabLearn() {
  const [mode, setMode] = useState("home"); // home | lesson | test | result
const [activeLesson, setActiveLesson] = useState(null);
  const [progress, setProgress] = useState(() => {
  return JSON.parse(localStorage.getItem("vocabProgress") || '{"completed": []}');
});
const [testQs, setTestQs] = useState([]);
const [testIndex, setTestIndex] = useState(0);
const [testScore, setTestScore] = useState(0);
  const [examFilter, setExamFilter] = useState("ALL"); 
// ALL | CAT | OMET
 

  if (mode === "lesson" && activeLesson) {
    const L = activeLesson;
    return (
      <div>
       <button
  onClick={() => setMode("home")}
  className="text-slate-400 hover:text-slate-200 text-sm mb-4 transition"
>
  ← Back
</button>

        <h2 style={{ marginTop: 12 }}>{L.title}</h2>
        <p style={{ color: "#555", whiteSpace: "pre-wrap" }}>{L.concept}</p>

        <h3 style={{ marginTop: 20 }}>Word Cards</h3>

     <div className="space-y-4 mt-6">
  {L.words.map((w, i) => (
    <div
      key={i}
      className="p-6 rounded-2xl bg-slate-900 border border-slate-800"
    >
      <h4 className="text-lg font-semibold text-slate-100">
        {w.word}
      </h4>

      <p className="text-slate-300 text-sm mt-3">
        <span className="text-slate-400 font-medium">Meaning:</span> {w.meaning}
      </p>

      <p className="text-slate-300 text-sm mt-2">
        <span className="text-slate-400 font-medium">Usage:</span> {w.usage}
      </p>

      <p className="text-slate-300 text-sm mt-2">
        <span className="text-slate-400 font-medium">Root:</span> {w.root}
      </p>

      <p className="text-slate-300 text-sm mt-2">
        <span className="text-slate-400 font-medium">Synonyms:</span>{" "}
        {(w.synonyms || []).join(", ")}
      </p>

      <p className="text-slate-300 text-sm mt-2">
        <span className="text-slate-400 font-medium">Antonyms:</span>{" "}
        {(w.antonyms || []).join(", ")}
      </p>
    </div>
  ))}

  <div className="pt-4">
    <button
      onClick={() => startLessonTest(L)}
      className="mt-4 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition"
    >
      Take Mini Test
    </button>
  </div>
</div>
</div>
    );
  }
  

  function startLessonTest(lesson) {
    const words = lesson.words;

  const usable = words.filter(w => w.synonyms && w.synonyms.length);

const qs = usable.slice(0, 5).map(w => {
  const correct = w.synonyms[0];

  const distractors = usable
    .filter(x => x.word !== w.word)
    .map(x => x.synonyms[0])
    .slice(0, 3);

  return {
    word: w.word,
    correct,
    options: [...distractors, correct].sort(() => Math.random() - 0.5),
  };
});

    setTestQs(qs);
    setTestIndex(0);
    setTestScore(0);
    setMode("test");
  }
  if (mode === "test") {
    const q = testQs[testIndex];

   return (
  <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8">
       <h3 className="text-xl font-semibold text-slate-100 mb-6">
  Closest meaning of{" "}
  <span className="text-orange-400">{q.word}</span>
</h3>

        {q.options.map((o, i) => (
          <button
            key={i}
            onClick={() => {
              if (o === q.correct) setTestScore(s => s + 1);

              if (testIndex + 1 < testQs.length) {
                setTestIndex(i => i + 1);
              } else {
                setMode("result");
              }
            }}
            className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition"
          >
            {o}
          </button>
        ))}
      </div>
    );
  }

  if (mode === "result") {
    return (
      <div>
       <h2 className="text-2xl font-semibold text-slate-100">
  Lesson Test Complete
</h2>
        <p>
          Score: <b>{testScore}</b> / {testQs.length}
        </p>

        <button
          onClick={() => {
            const updated = {
              ...progress,
              completed: [
                ...new Set([...progress.completed, activeLesson.id]),
              ],
            };
            localStorage.setItem("vocabProgress", JSON.stringify(updated));
            setProgress(updated);
            setMode("home");
          }}
         className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
        >
          Mark Complete
        </button>
      </div>
    );
  }
  return (
    <div>
    <h2 className="text-xl font-semibold text-slate-100 mb-4">
  Today’s Top Words
</h2>

<div className="inline-flex bg-slate-800 border border-slate-700 p-1 rounded-xl gap-1 mb-6">
  {[
    { key: "ALL", label: "All" },
    { key: "CAT", label: "CAT RC" },
    { key: "OMET", label: "OMET" },
  ].map(item => (
    <button
      key={item.key}
      onClick={() => setExamFilter(item.key)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
  examFilter === item.key
    ? "bg-blue-600 text-white"
    : "text-slate-400 hover:text-slate-200"
}`}
    >
      {item.label}
    </button>
  ))}
</div>
      

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 12,
        }}
      >
       {getTodayWords().map((w, i) => (
          <div
            key={i}
           className="min-w-[220px] p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition"
          >
            <h4>{w.word}</h4>
       <p className="text-sm text-slate-300">
           <p className="text-xs text-slate-400"></p>
             {(w.synonyms || []).join(", ")}
            </p>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 24 }}>Vocabulary Lessons</h2>

     {Array.from(
  new Map(
    vocabLessons
      .filter(l => {
        if (examFilter === "ALL") return true;
        return l.exam === examFilter;
      })
      .map(l => [l.id, l])
  ).values()
).map(l => (
  <div
    key={l.id}
    className="mt-4 p-6 rounded-2xl bg-slate-900 border border-slate-800"
  >
    <h3>{l.title}</h3>
    <p style={{ color: "#555" }}>{l.goal}</p>

    <button
      onClick={() => {
        setActiveLesson(l);
        setMode("lesson");
      }}
     className="mt-4 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition"
    >
      Start Lesson
    </button>
  </div>
))}
    </div>
  );
}

