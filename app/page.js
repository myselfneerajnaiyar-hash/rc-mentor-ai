"use client";
import { useState, useEffect } from "react";

export default function Page() {
  // ---- CORE RC STATE ----
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

  // ---- VOCAB HELPERS ----
  function loadVocab() {
    return JSON.parse(localStorage.getItem("vocabBank") || "[]");
  }

  function saveVocab(words) {
    localStorage.setItem("vocabBank", JSON.stringify(words));
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
      refreshFromBank();
    } catch (e) {
      console.error("Enrichment failed", e);
    }
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
    if (vocabRunning) {
      if (vocabTimer <= 0) {
        setVocabRunning(false);
        return;
      }
      const id = setInterval(() => {
        setVocabTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(id);
    }
  }, [vocabRunning, vocabTimer]);
  // ---- RC HELPERS ----
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
        setFeedback("Not quite. Let’s try a simpler question.");
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

  useEffect(() => {
    if (phase === "test") {
      setTimeLeft(6 * 60);
      setTimerRunning(true);
      setQuestionStartTime(Date.now());
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
    } catch {
      setError("Could not analyze your test.");
    } finally {
      setLoading(false);
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

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1 style={{ cursor: "pointer" }} onClick={() => {
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
      }}>
        RC Mentor
      </h1>

      {phase === "mentor" && showInitial && (
        <>
          <p>Paste a passage. Let’s read it together.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", minHeight: 180, padding: 12 }}
          />
          <button onClick={splitPassage} style={{ marginTop: 12 }}>
            Split Passage
          </button>
        </>
      )}

      {paras.length > 0 && phase === "mentor" && (
        <>
          <h3>
            Paragraph {index + 1} of {paras.length}
          </h3>

          <div style={{ padding: 14, border: "1px solid #ccc" }}>
            {current}
          </div>

          <button onClick={explain} style={{ marginTop: 12 }}>
            Explain this paragraph
          </button>

          {data && (
            <div style={{ marginTop: 20 }}>
              <p>{data.explanation}</p>

              <ul>
                {data.difficultWords.map((d, i) => (
                  <li key={i}>
                    <b>{d.word}</b>: {d.meaning}
                    <button onClick={() => addToVocab(d)} style={{ marginLeft: 6 }}>
                      + Save
                    </button>
                  </li>
                ))}
              </ul>

              {mode === "showingPrimary" &&
                data.primaryQuestion.options.map((o, i) => (
                  <button key={i} onClick={() => choose(i)}>
                    {o}
                  </button>
                ))}

              {mode === "solved" && (
                <button onClick={nextParagraph} style={{ marginTop: 12 }}>
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {phase === "ready" && (
        <div style={{ marginTop: 40 }}>
          <button onClick={startTest}>Take Test</button>
        </div>
      )}

      {phase === "test" && (
        <div>
          {testQuestions.map((q, qi) => (
            <div key={qi}>
              <p>{q.prompt}</p>
              {q.options.map((o, oi) => (
                <button
                  key={oi}
                  onClick={() => setTestAnswers(a => ({ ...a, [qi]: oi }))}
                >
                  {o}
                </button>
              ))}
            </div>
          ))}
          <button onClick={submitTest}>Submit Test</button>
        </div>
      )}

      {phase === "result" && result && (
        <div>
          <h2>Score: {score}</h2>
          <p>{result.summary}</p>
        </div>
      )}

      {phase === "vocab" && (
        <div style={{ marginTop: 40 }}>
          <h2>Vocabulary Builder</h2>

          {vocabBank.length === 0 ? (
            <p>No saved words yet.</p>
          ) : (
            <>
              <ul>
                {vocabBank.map((w, i) => (
                  <li key={i} onClick={() => setLearningWord(w)}>
                    <b>{w.word}</b> – {w.meaning}
                    {!w.enriched && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        enrichWord(w);
                      }}>
                        Enrich
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {learningWord && (
            <div style={{ marginTop: 20 }}>
              <h3>{learningWord.word}</h3>
              <p>{learningWord.meaning}</p>
              {learningWord.usage && <p>{learningWord.usage}</p>}
              <button onClick={() => setLearningWord(null)}>Close</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
