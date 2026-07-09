"use client";
import { useState, useEffect } from "react";
import { vocabLessons, getTodayWords } from "../app/data/vocabLessons";
import VocabProfile from "../components/VocabProfile";
import { supabase } from "../lib/supabase";
import TabGroup from "../components/TabGroup";
import PracticeSwitcher from "./PracticeSwitcher";
import WordDrawer from "../components/WordDrawer";

export default function VocabLab() {
  const [tab, setTab] = useState("bank");
  const [manualWord, setManualWord] = useState("");
  const [lookup, setLookup] = useState(null);
  const [drawerWords, setDrawerWords] = useState([]);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [bank, setBank] = useState({
  master: [],
  user: [],
});
  const [mode, setMode] = useState("home"); // home | lesson | test | result


 useEffect(() => {
  fetchBank();
}, []);

async function fetchBank() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;


  const { data: master } = await supabase
  .from("master_vocab")
  .select("*")
  .order("frequency_rank");

const { data: user } = await supabase
  .from("user_words")
  .select("*")
  .eq("user_id", authData.user.id)
  .order("created_at", { ascending: false });

 const masterFormatted = (master || []).map(w => ({
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

const userFormatted = (user || []).map(w => ({
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

setBank({
  master: masterFormatted,
  user: userFormatted,
});
}

async function enrichAllWords() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

 const unenriched = bank.user.filter(
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
    <>
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
  setLookup={setLookup}
  loading={loadingLookup}
  handleManualAdd={handleManualAdd}
  masterWords={bank.master}
userWords={bank.user}
  openWord={openWord}
  enrichAllWords={enrichAllWords}
  setDrawerWords={setDrawerWords}
/>
          )}
          {tab === "drill" && <VocabDrill />}
          {tab === "learn" && <VocabLearn />}
          {tab === "profile" && <VocabProfile />}
        </div>
      </div>
    </div>
     <WordDrawer
  lookup={lookup}
  setLookup={setLookup}
  words={drawerWords}
 
/>
</>
  );
}

/* ---------------- COMPONENTS ---------------- */
function WordBank({
  manualWord,
  setManualWord,
  lookup,
  setLookup,
  loading,
  handleManualAdd,
  masterWords,
  userWords,
  openWord,
  enrichAllWords,
  setDrawerWords
}) {
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeList, setActiveList] = useState("core");

  const unenrichedCount = userWords.filter(
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


       

    <div className="mt-8">

  {/* Tabs */}
  <div className="flex gap-2 mb-6">

    <button
      onClick={() => setActiveList("core")}
      className={`px-4 py-2 rounded-xl transition ${
        activeList === "core"
          ? "bg-orange-500 text-white"
          : "bg-slate-800 text-slate-400 hover:text-white"
      }`}
    >
      📘 Core Words ({masterWords.length})
    </button>

    <button
      onClick={() => setActiveList("saved")}
      className={`px-4 py-2 rounded-xl transition ${
        activeList === "saved"
          ? "bg-emerald-600 text-white"
          : "bg-slate-800 text-slate-400 hover:text-white"
      }`}
    >
      🧠 Saved Words ({userWords.length})
    </button>

  </div>

  {/* Word Grid */}

  <div
    className="grid gap-3 max-h-[650px] overflow-y-auto"
    style={{
      gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
    }}
  >

    {activeList === "core"
      ? masterWords.map((w) => (
          <button
            key={w.word}
            onClick={() => {
              setDrawerWords(masterWords);
              setLookup(w);
            }}
            className="group px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-left hover:border-orange-500 transition"
          >
            <h3 className="font-semibold">{w.word}</h3>

            <p className="text-xs text-slate-400">
              Rank #{w.frequency_rank}
            </p>
          </button>
        ))

      : userWords.map((w) => (
          <button
            key={w.id}
            onClick={() => {
              setDrawerWords(userWords);
              openWord(w);
            }}
            className="group px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-left hover:border-emerald-500 transition"
          >
            <h3 className="font-semibold">{w.word}</h3>

            <p className="text-xs text-slate-400">
              {w.partOfSpeech || "Tap to enrich"}
            </p>
          </button>
        ))}

  </div>

</div>
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
  const [streak, setStreak] = useState(0);
const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
  loadDrillWords();
}, []);

async function loadDrillWords() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return;

  const { data: master } = await supabase
  .from("master_vocab")
  .select("*")
  .order("frequency_rank");

const { data: user } = await supabase
  .from("user_words")
  .select("*")
  .eq("user_id", authData.user.id);

if (!master || !user) return;

const combined = [...master, ...user];

  const formatted = combined.map(w => ({
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

  console.log("Combined:", combined.length);
console.log("Formatted:", formatted.length);
console.log("Enriched:", enriched.length);

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
  setStreak(0);
setBestStreak(0);
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

  setStreak(prev => {
    const next = prev + 1;
    setBestStreak(best => Math.max(best, next));
    return next;
  });

} else {
  setStreak(0);
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
    <div className="max-w-2xl mx-auto">

      <h2 className="text-3xl font-bold text-white">
        Vocabulary Training
      </h2>

      <p className="text-slate-400 mt-2">
        Sharpen your vocabulary through a personalized mixed drill.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">

        <h3 className="text-lg font-semibold text-white mb-5">
          🎯 Today's Session
        </h3>

        <div className="grid grid-cols-2 gap-y-4 text-sm">

          <div>
            <p className="text-slate-500">Questions</p>
            <p className="font-semibold text-white">10</p>
          </div>

          <div>
            <p className="text-slate-500">Estimated Time</p>
            <p className="font-semibold text-white">3 minutes</p>
          </div>

          <div>
            <p className="text-slate-500">Question Types</p>
            <p className="font-semibold text-white">
              Synonym • Antonym • Usage
            </p>
          </div>

          <div>
            <p className="text-slate-500">Vocabulary Source</p>
            <p className="font-semibold text-emerald-400">
              Core + Saved Words
            </p>
          </div>

        </div>

      </div>

      <button
        onClick={startDrill}
        className="mt-8 w-full py-4 rounded-2xl
        bg-gradient-to-r from-orange-500 to-orange-600
        hover:from-orange-400 hover:to-orange-500
        text-lg font-semibold text-white
        shadow-lg shadow-orange-900/40
        transition-all duration-200"
      >
        🚀 Start Training
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
       <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8">

  <div className="text-center">

    <div className="text-5xl mb-3">
      🏆
    </div>

    <h2 className="text-3xl font-bold text-white">
      Drill Complete
    </h2>

    <p className="text-slate-400 mt-2">
      Great work! Here's your performance.
    </p>

  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">

    <div className="rounded-2xl bg-slate-800 p-5 text-center">
      <div className="text-3xl font-bold text-white">
        {score}
      </div>
      <div className="text-slate-400 text-sm">
        Correct
      </div>
    </div>

    <div className="rounded-2xl bg-slate-800 p-5 text-center">
      <div className="text-3xl font-bold text-orange-400">
        {accuracy}%
      </div>
      <div className="text-slate-400 text-sm">
        Accuracy
      </div>
    </div>

    <div className="rounded-2xl bg-slate-800 p-5 text-center">
      <div className="text-3xl font-bold text-emerald-400">
        🔥 {bestStreak}
      </div>
      <div className="text-slate-400 text-sm">
        Best Streak
      </div>
    </div>

    <div className="rounded-2xl bg-slate-800 p-5 text-center">
      <div className="text-3xl font-bold text-blue-400">
        {timeTaken}s
      </div>
      <div className="text-slate-400 text-sm">
        Time
      </div>
    </div>

  </div>

</div>

<div className="mt-8">

  <div className="flex justify-between text-sm text-slate-400 mb-2">
    <span>Overall Performance</span>
    <span>{accuracy}%</span>
  </div>

  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">

    <div
      className="h-full bg-gradient-to-r from-emerald-500 to-orange-400"
      style={{
        width: `${accuracy}%`,
      }}
    />

  </div>

</div>

        <div className="mt-8 space-y-8">

  {/* REVIEW AGAIN */}
  {history.some(h => !h.isCorrect) && (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          ↻ Review Again
        </h3>

        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-300 text-sm">
          {history.filter(h => !h.isCorrect).length} words
        </span>
      </div>

      <div className="space-y-3">
        {history
          .filter(h => !h.isCorrect)
          .map((h, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-red-950/20 border border-red-800/60"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-white text-lg">
                  {h.word || "Fill in the blank"}
                </div>

                <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300">
                  {h.type === "synonym"
                    ? "Synonym"
                    : h.type === "antonym"
                    ? "Antonym"
                    : "Usage"}
                </span>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">

                <div className="rounded-xl bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-500 mb-1">
                    Your answer
                  </p>
                  <p className="text-red-300 font-medium">
                    {h.chosen}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-500 mb-1">
                    Correct answer
                  </p>
                  <p className="text-emerald-300 font-medium">
                    {h.correct}
                  </p>
                </div>

              </div>
            </div>
          ))}
      </div>
    </div>
  )}


  {/* CORRECT ANSWERS */}
  {history.some(h => h.isCorrect) && (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          ✓ Correct Answers
        </h3>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-sm">
          {history.filter(h => h.isCorrect).length} words
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {history
          .filter(h => h.isCorrect)
          .map((h, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/50"
            >
              <div className="font-semibold text-white">
                {h.word || "Fill in the blank"}
              </div>

              <div className="mt-2 text-sm text-slate-400">
                <span className="text-emerald-300 font-medium">
                  {h.correct}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )}

</div>

       <button
  onClick={startDrill}
  className="mt-6 px-6 py-3 rounded-xl
    bg-gradient-to-r from-orange-500 to-orange-600
    hover:from-orange-400 hover:to-orange-500
    text-white font-semibold
    shadow-lg shadow-orange-900/30
    transition-all duration-200
    hover:-translate-y-0.5
    active:scale-[0.98]"
>
  Start Next Drill →
</button>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div>
     <div className="mb-6">

  <div className="flex justify-between items-center mb-2">

  <div className="text-sm text-slate-400">
    Question {index + 1} of {questions.length}
  </div>

  <div className="flex items-center gap-4">

    <span className="text-orange-400 font-semibold">
      🔥 {streak}
    </span>

    <span className="text-sm text-slate-400">
      {Math.round(((index + 1) / questions.length) * 100)}%
    </span>

  </div>

</div>
  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
      style={{
        width: `${((index + 1) / questions.length) * 100}%`,
      }}
    />
  </div>

</div>

     <div className="mb-5 flex items-center gap-3">

  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold
      ${
        q.type === "synonym"
          ? "bg-blue-600/20 text-blue-300"
          : q.type === "antonym"
          ? "bg-red-600/20 text-red-300"
          : "bg-emerald-600/20 text-emerald-300"
      }`}
  >
    {q.type === "synonym"
      ? "Synonym"
      : q.type === "antonym"
      ? "Antonym"
      : "Usage"}
  </span>

</div>

{q.type === "fill" ? (
  <h3 className="text-xl font-semibold text-slate-100 mb-6">
    {q.prompt}
  </h3>
) : (
  <h3 className="text-xl font-semibold text-slate-100 mb-6">
    {q.prompt}{" "}
    <span className="text-orange-400">{q.word}</span>
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
    { key: "CAT", label: "Passage Words" },
    { key: "OMET", label: "Everyday Words" },
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

