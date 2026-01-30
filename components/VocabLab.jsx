"use client";
import { useState, useEffect } from "react";
import { vocabLessons, getTodayWords } from "../app/data/vocabLessons";
import VocabProfile from "../components/VocabProfile";

export default function VocabLab() {
  const [tab, setTab] = useState("bank");
  const [manualWord, setManualWord] = useState("");
  const [lookup, setLookup] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [bank, setBank] = useState([]);
  const [mode, setMode] = useState("home"); // home | lesson | test | result


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vocabBank") || "[]");
    setBank(saved);
  }, []);

  async function handleManualAdd(word) {
    setManualWord("");
    setLookup(null);
    setLoadingLookup(true);

    const res = await fetch("/api/enrich-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });

    const data = await res.json();
    setLoadingLookup(false);

    const existing = JSON.parse(localStorage.getItem("vocabBank") || "[]");

    if (!existing.some(w => w.word.toLowerCase() === word.toLowerCase())) {
      const updated = [
        ...existing,
        { word, ...data, correctCount: 0, enriched: true },
      ];
      localStorage.setItem("vocabBank", JSON.stringify(updated));
      setBank(updated);
    }

    setLookup({ word, ...data });
  }

  async function openWord(w) {
    // If already enriched, just show it
    if (w.partOfSpeech || w.enriched) {
      setLookup(w);
      return;
    }

    setLoadingLookup(true);

    const res = await fetch("/api/enrich-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: w.word }),
    });

    const data = await res.json();
    setLoadingLookup(false);

    const upgraded = bank.map(item =>
      item.word.toLowerCase() === w.word.toLowerCase()
        ? { ...item, ...data, enriched: true }
        : item
    );

    localStorage.setItem("vocabBank", JSON.stringify(upgraded));
    setBank(upgraded);

    const fresh = upgraded.find(x => x.word === w.word);
    setLookup(fresh);
  }

  async function openWord(w) {
  // If already enriched, just show
  if (w.partOfSpeech) {
    setLookup(w);
    return;
  }

  // Otherwise enrich
  setLoadingLookup(true);

  const res = await fetch("/api/enrich-word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: w.word }),
  });

  const data = await res.json();
  setLoadingLookup(false);

  const updated = bank.map(x =>
    x.word.toLowerCase() === w.word.toLowerCase()
      ? { ...x, ...data, enriched: true }
      : x
  );

  localStorage.setItem("vocabBank", JSON.stringify(updated));
  setBank(updated);

  setLookup({ ...w, ...data });
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
}) {
  return (
    <div>
      <h2>WordBank</h2>
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
    const saved = JSON.parse(localStorage.getItem("vocabBank") || "[]");
    setBank(saved.filter(w => w.synonyms || w.antonyms || w.usage));
  }, []);

  function makeSynonymQ(word) {
    const correct = word.synonyms?.[0];
    if (!correct) return null;

    const distractors = bank
      .filter(w => w.word !== word.word && w.synonyms?.length)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.synonyms[0]);

    if (distractors.length < 3) return null;

    return {
      type: "synonym",
      prompt: `Closest meaning of`,
      word: word.word,
      correct,
      options: [...distractors, correct].sort(() => Math.random() - 0.5),
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

    return {
      type: "antonym",
      prompt: `Opposite of`,
      word: word.word,
      correct,
      options: [...distractors, correct].sort(() => Math.random() - 0.5),
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

    return {
      type: "fill",
      prompt: sentence,
      word: null,
      correct,
      options: [...distractors, correct].sort(() => Math.random() - 0.5),
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
    if (bank.length < 6) {
      alert("Add more enriched words to enable full drills.");
      return;
    }

    const pool = [...bank].sort(() => Math.random() - 0.5);
    const qs = [];

    let i = 0;
    while (qs.length < 10 && i < pool.length * 3) {
      const w = pool[i % pool.length];
      const q = buildQuestion(w);
      if (q) qs.push(q);
      i++;
    }

    if (qs.length < 10) {
      alert("Not enough rich data yet to build 10 questions.");
      return;
    }

    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setHistory([]);
    setStartTime(Date.now());
    setEndTime(null);
    setStage("run");
  }

  function choose(opt) {
    if (selected) return;
    const q = questions[index];

    setSelected(opt);
   const correct = opt === q.correct;

const stored = JSON.parse(localStorage.getItem("vocabBank") || "[]");

const updated = stored.map(w => {
  const testedWord = q.word || q.correct;

if (w.word.toLowerCase() === testedWord.toLowerCase()) {
    return {
      ...w,
      attempts: (w.attempts || 0) + 1,
      correctCount: (w.correctCount || 0) + (correct ? 1 : 0),
      lastTested: Date.now(),
    };
  }
  return w;
});

localStorage.setItem("vocabBank", JSON.stringify(updated));
    if (correct) setScore(s => s + 1);

    setHistory(h => [
      ...h,
      { ...q, chosen: opt, isCorrect: correct },
    ]);

    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(i => i + 1);
        setSelected(null);
     } else {
  const end = Date.now();
  setEndTime(end);

  // 🔥 SAVE DAILY PERFORMANCE SNAPSHOT
  const timeline =
    JSON.parse(localStorage.getItem("vocabTimeline") || "[]");

  timeline.push({
    date: new Date().toISOString().slice(0, 10),
    accuracy: Math.round((score / questions.length) * 100),
  });

  localStorage.setItem("vocabTimeline", JSON.stringify(timeline));

  setStage("result");
}
    }, 700);
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
    const accuracy = Math.round((score / questions.length) * 100);

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

<div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
  <button onClick={() => setExamFilter("ALL")}>All</button>
  <button onClick={() => setExamFilter("CAT")}>CAT RC</button>
  <button onClick={() => setExamFilter("OMET")}>OMET</button>
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

