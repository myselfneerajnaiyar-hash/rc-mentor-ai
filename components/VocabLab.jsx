"use client";
import { useState, useEffect } from "react";
import { vocabLessons, getTodayWords } from "../app/data/vocabLessons";
import VocabProfile from "../components/VocabProfile";
import { supabase } from "../lib/supabase";

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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eef2ff, #f8fafc)",
        color: "#1f2937",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 12 }}>Vocabulary Lab</h1>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { key: "bank", label: "WordBank" },
            { key: "drill", label: "Vocab Drills" },
            { key: "learn", label: "Learn" },
            { key: "profile", label: "Profile" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #c7d2fe",
                background: tab === t.key ? "#4f46e5" : "#eef2ff",
                color: tab === t.key ? "#fff" : "#1e293b",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 20,
            minHeight: 420,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          }}
        >
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
      <h2>WordBank</h2>
      {unenrichedCount > 0 && (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      background: "#fff7ed",
      border: "1px solid #fdba74",
    }}
  >
    <p style={{ fontWeight: 600 }}>
      ⚡ To unlock full vocab drills, enrich your saved words.
    </p>
    <p style={{ fontSize: 13, color: "#7c2d12" }}>
      {unenrichedCount} word(s) need enrichment.
    </p>

   <button
  onClick={async () => {
    setBulkLoading(true);
    await enrichAllWords();
    setBulkLoading(false);
  }}
  disabled={bulkLoading}
      style={{
        marginTop: 10,
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: "#ea580c",
        color: "#fff",
        fontWeight: 600,
        cursor: bulkLoading ? "not-allowed" : "pointer",
opacity: bulkLoading ? 0.7 : 1,
      }}
    >
     {bulkLoading ? "Enriching your wordbank..." : "Enrich All Words"}
    </button>
  </div>
)}
      <p style={{ color: "#555" }}>
        Your personal vocabulary memory. Words appear here automatically from RC,
        Speed Gym, or when you add them manually.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px dashed #c7d2fe",
          background: "#f8fafc",
        }}
      >
        <input
          placeholder="Type a word and press Enter"
          value={manualWord}
          onChange={e => setManualWord(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && manualWord.trim()) {
              handleManualAdd(manualWord.trim());
            }
          }}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 16,
          }}
        />

        {loading && <p style={{ marginTop: 12 }}>Looking up word…</p>}

       {lookup && (
  <div
    style={{
      marginTop: 16,
      padding: 18,
      borderRadius: 14,
      border: "1px solid #fed7aa",
      background: "linear-gradient(180deg, #fff7ed, #ffedd5)",
      boxShadow: "0 10px 24px rgba(251, 146, 60, 0.25)",
    }}
  >
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
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
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
        <h2>Vocab Drills</h2>
        <p>10 mixed MCQs: meaning, opposite, usage.</p>
        <button
          onClick={startDrill}
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
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
      <div>
        <h2>Drill Complete</h2>
        <p>
          Score: <b>{score}</b> / {questions.length} &nbsp;|&nbsp;
          Accuracy: <b>{accuracy}%</b> &nbsp;|&nbsp;
          Time: <b>{timeTaken}s</b>
        </p>

        <div style={{ marginTop: 20 }}>
          {history.map((h, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 8,
                background: h.isCorrect ? "#dcfce7" : "#fee2e2",
              }}
            >
              <b>{i + 1}. {h.word || "Fill in the blank"}</b>
              <div>Your answer: {h.chosen}</div>
              {!h.isCorrect && <div>Correct: {h.correct}</div>}
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
      <div style={{ marginBottom: 12, color: "#6b7280" }}>
        Q {index + 1} / {questions.length}
      </div>

      {q.type === "fill" ? (
        <h3 style={{ marginBottom: 16 }}>{q.prompt}</h3>
      ) : (
        <h3 style={{ marginBottom: 16 }}>
          {q.prompt} <span style={{ color: "#f97316" }}>{q.word}</span>
        </h3>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, i) => {
          let bg = "#ffffff";
          if (selected) {
            if (opt === q.correct) bg = "#dcfce7";
            else if (opt === selected) bg = "#fee2e2";
          }

          return (
            <button
              key={i}
              onClick={() => choose(opt)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: bg,
                textAlign: "left",
                cursor: "pointer",
                fontSize: 15,
              }}
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
        <button onClick={() => setMode("home")}>← Back</button>

        <h2 style={{ marginTop: 12 }}>{L.title}</h2>
        <p style={{ color: "#555", whiteSpace: "pre-wrap" }}>{L.concept}</p>

        <h3 style={{ marginTop: 20 }}>Word Cards</h3>

        {L.words.map((w, i) => (
          <div
            key={i}
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 12,
              border: "1px solid #fed7aa",
              background: "linear-gradient(180deg, #fff7ed, #ffedd5)",
            }}
          >
            <h4>{w.word}</h4>
            <p><b>Meaning:</b> {w.meaning}</p>
            <p><b>Usage:</b> {w.usage}</p>
            <p><b>Root:</b> {w.root}</p>
            <p><b>Synonyms:</b> {(w.synonyms || []).join(", ")}</p>
            <p><b>Antonyms:</b> {(w.antonyms || []).join(", ")}</p>
          </div>
        ))}
        <button
        onClick={() => startLessonTest(L)}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          borderRadius: 8,
          background: "#f97316",
          color: "#fff",
          border: "none",
          fontWeight: 600,
        }}
      >
        Take Mini Test
      </button>
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
      <div>
        <h3>
          Closest meaning of{" "}
          <span style={{ color: "#f97316" }}>{q.word}</span>
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
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
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
        <h2>Lesson Test Complete</h2>
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
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#22c55e",
            color: "#fff",
            border: "none",
            fontWeight: 600,
          }}
        >
          Mark Complete
        </button>
      </div>
    );
  }
  return (
    <div>
     <h2>Today’s Top Words</h2>

<div
  style={{
    display: "inline-flex",
    background: "#f1f5f9",
    padding: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 20,
  }}
>
  {[
    { key: "ALL", label: "All" },
    { key: "CAT", label: "CAT RC" },
    { key: "OMET", label: "OMET" },
  ].map(item => (
    <button
      key={item.key}
      onClick={() => setExamFilter(item.key)}
      style={{
        padding: "8px 18px",
        borderRadius: 10,
        border: "none",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        transition: "all 0.2s ease",
        background:
          examFilter === item.key ? "#4f46e5" : "transparent",
        color:
          examFilter === item.key ? "#ffffff" : "#475569",
        boxShadow:
          examFilter === item.key
            ? "0 6px 14px rgba(79,70,229,0.35)"
            : "none",
      }}
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
            style={{
              minWidth: 220,
              padding: 14,
              borderRadius: 14,
              background: "linear-gradient(180deg, #fff7ed, #ffedd5)",
              border: "1px solid #fed7aa",
              boxShadow: "0 6px 14px rgba(251,146,60,0.25)",
            }}
          >
            <h4>{w.word}</h4>
            <p style={{ fontSize: 13 }}>{w.meaning}</p>
            <p style={{ fontSize: 12, color: "#7c2d12" }}>
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
    style={{
      marginTop: 12,
      padding: 16,
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#f8fafc",
    }}
  >
    <h3>{l.title}</h3>
    <p style={{ color: "#555" }}>{l.goal}</p>

    <button
      onClick={() => {
        setActiveLesson(l);
        setMode("lesson");
      }}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        fontWeight: 600,
        cursor: "pointer",
        background: l.exam === "CAT" ? "#f97316" : "#22c55e",
color: "#fff",
      }}
    >
      Start Lesson
    </button>
  </div>
))}
    </div>
  );
}

