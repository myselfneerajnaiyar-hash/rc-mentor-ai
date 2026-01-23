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
        body: JSON.stringify({ word: w.word, meaning: w.meaning }),
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
              enriched: true,
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
                enriched: true,
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
    if (phase === "vocab") setShowMeaning(false);
  }, [phase]);

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
        },
      ]);
    }
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

  const showInitial =
    paras.length === 0 &&
    !showGenerator &&
    phase !== "newRC" &&
    !isAdaptive;

  const showGenPanel = showGenerator && !isAdaptive;
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
        body: JSON.stringify({
  passage: full,
  mode: "normal",
}),
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

      setParas([]);
      setIndex(0);
      setData(null);
      setFeedback("");
      setMode("idle");

      setPhase("loading-adaptive");

      const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
      const tests = raw.tests || [];

      if (!tests.length) {
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
        return;
      }

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

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
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

      {phase === "mentor" && showInitial && (
        <>
          <p>Paste a passage. Let’s read it together.</p>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            style={{
              width: "100%",
              minHeight: 180,
              padding: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />

          <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
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
              onClick={() => setShowGenerator(true)}
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
            <select value={genre} onChange={e => setGenre(e.target.value)}>
              <option>Psychology</option>
              <option>Economics</option>
              <option>Philosophy</option>
              <option>History</option>
              <option>Mixed</option>
            </select>

            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="moderate">Moderate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select value={lengthRange} onChange={e => setLengthRange(e.target.value)}>
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
        </div>
      )}
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
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
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
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      style={{ display: "block", margin: "6px 0" }}
                    >
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
        <div
          style={{
            marginTop: 40,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <p>You’ve now understood this passage in depth. Let’s test it.</p>
          <button
            onClick={startTest}
            style={{
              padding: "10px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
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
                    const timeTaken = Math.round(
                      (end - questionStartTime) / 1000
                    );
                    setQuestionTimes(t => ({
                      ...t,
                      [`test-${qi}`]: timeTaken,
                    }));
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
                Evaluating your responses…
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

        return (
          <div style={{ marginTop: 40 }}>
            <div
              style={{
                padding: 20,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f8fafc",
              }}
            >
              <h2>Performance Snapshot</h2>
              <p>
                <b>Score:</b> {score} / {testQuestions.length}
              </p>
              <p>
                <b>Accuracy:</b>{" "}
                {Math.round((score / testQuestions.length) * 100)}%
              </p>
              <p>
                <b>Avg Time / Question:</b> {avgTime}s
              </p>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 10,
                background: "#ecfeff",
                border: "1px solid #bae6fd",
              }}
            >
              <h3>Your Strengths</h3>
              <ul>
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 10,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              <h3>Your Reading Style</h3>
              <p>{result.summary}</p>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 10,
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
              }}
            >
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
                  setGeneratedRC(null);
                  setTestQuestions([]);
                  setTestAnswers({});
                  setResult(null);

                  setParas([]);
                  setText("");
                  setIndex(0);
                  setData(null);
                  setFeedback("");
                  setMode("idle");

                  if (isAdaptive) {
                    startAdaptiveRC();
                  } else {
                    setShowGenerator(true);
                    setPhase("mentor");
                  }
                }}
                style={{ marginLeft: 12 }}
              >
                Start Next RC
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
              studentChoice === undefined
                ? "unattempted"
                : qa?.status || "wrong";

            return (
              <div
                key={i}
                style={{
                  marginTop: 20,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              >
                <p style={{ fontWeight: 600 }}>
                  Q{i + 1}. {q.prompt}
                </p>

                <p>
                  <b>Status:</b>{" "}
                  <span
                    style={{
                      color:
                        status === "correct"
                          ? "green"
                          : status === "unattempted"
                          ? "#555"
                          : "red",
                    }}
                  >
                    {status.toUpperCase()}
                  </span>
                </p>

                <p>
                  <b>Correct Answer:</b>{" "}
                  {q.options[q.correctIndex]}
                </p>

                <p>{qa?.correctExplanation}</p>
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

      {phase === "newRC" && generatedRC && (
        <div
          style={{
            marginTop: 40,
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
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
            style={{
              padding: "12px 18px",
              background: "green",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
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
            style={{
              marginLeft: 12,
              padding: "12px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            View Detailed Explanation
          </button>
        </div>
      )}
    {phase === "profile" && (
  <div style={{ marginTop: 30 }}>
    {(() => {
      const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
      const tests = raw.tests || [];
      const all = tests.flatMap(t => t.questions || []);

      const byType = {};
      all.forEach(q => {
        const t = (q.type || "inference").toLowerCase();
        byType[t] = byType[t] || { total: 0, correct: 0, time: 0 };
        byType[t].total += 1;
        if (q.correct) byType[t].correct += 1;
        byType[t].time += q.time || 0;
      });

      const types = Object.keys(byType);
      const pct = (x, y) => (!y ? 0 : Math.round((x / y) * 100));

      const totalQ = all.length;
      const totalC = all.filter(q => q.correct).length;
      const overall = pct(totalC, totalQ);

      const weakest = Object.entries(byType)
        .sort((a, b) => pct(a[1].correct, a[1].total) - pct(b[1].correct, b[1].total))[0]?.[0];

      const donut = (value, label) => {
        const r = 54;
        const c = 2 * Math.PI * r;
        const dash = (value / 100) * c;
        return (
          <div style={{ textAlign: "center" }}>
            <svg width="140" height="140">
              <circle cx="70" cy="70" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle
                cx="70"
                cy="70"
                r={r}
                stroke={value >= 70 ? "#16a34a" : value >= 40 ? "#f59e0b" : "#dc2626"}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="76" textAnchor="middle" fontSize="20" fontWeight="700">
                {value}%
              </text>
            </svg>
            <div style={{ fontWeight: 600 }}>{label}</div>
          </div>
        );
      };

      const bar = (label, v) => (
        <div key={label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <b>{label.toUpperCase()}</b>
            <span>{v}%</span>
          </div>
          <div style={{ height: 8, background: "#e5e7eb", borderRadius: 6 }}>
            <div
              style={{
                height: "100%",
                width: `${v}%`,
                borderRadius: 6,
                background: v >= 70 ? "#16a34a" : v >= 40 ? "#f59e0b" : "#dc2626",
              }}
            />
          </div>
        </div>
      );

      const speedBuckets = { fast: 0, heavy: 0, impulsive: 0, confused: 0 };
      all.forEach(q => {
        if (q.time <= 20 && q.correct) speedBuckets.fast++;
        else if (q.time > 45 && q.correct) speedBuckets.heavy++;
        else if (q.time <= 20 && !q.correct) speedBuckets.impulsive++;
        else if (q.time > 45 && !q.correct) speedBuckets.confused++;
      });

      const sTotal =
        speedBuckets.fast +
        speedBuckets.heavy +
        speedBuckets.impulsive +
        speedBuckets.confused || 1;

      const sp = k => Math.round((speedBuckets[k] / sTotal) * 100);

      const dominant =
        Object.entries(speedBuckets).sort((a, b) => b[1] - a[1])[0]?.[0];

      let speedText =
        dominant === "impulsive"
          ? "You are reacting faster than you are thinking. CAT will punish speed without deliberation."
          : dominant === "confused"
          ? "You are spending time but not constructing meaning. You need paragraph-level clarity."
          : dominant === "heavy"
          ? "You are careful and correct, but time pressure will hurt you."
          : "You balance speed and accuracy well. Preserve this under pressure.";

      return (
        <>
          <h2>RC Profile</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["overview", "skills", "speed", "plan"].map(t => (
              <button
                key={t}
                onClick={() => setActiveProfileTab(t)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: activeProfileTab === t ? "#2563eb" : "#f3f4f6",
                  color: activeProfileTab === t ? "#fff" : "#111",
                  fontWeight: 600,
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {activeProfileTab === "overview" && (
            <div style={{ padding: 20, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
              <p>
                You have attempted <b>{totalQ}</b> questions across{" "}
                <b>{tests.length}</b> RC tests.
              </p>
              <p style={{ color: "#555" }}>
                {overall >= 65
                  ? "You are developing control over RC. The next leap is consistency under pressure."
                  : "You are still decoding more than interpreting. Growth will come from thinking in layers."}
              </p>

              <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                {donut(overall, "Overall Accuracy")}
                {donut(pct(byType[weakest]?.correct || 0, byType[weakest]?.total || 1), "Weakest Skill")}
              </div>
            </div>
          )}

          {activeProfileTab === "skills" && (
            <div style={{ padding: 20, borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb" }}>
              {types.map(t => bar(t, pct(byType[t].correct, byType[t].total)))}
            </div>
          )}

          {activeProfileTab === "speed" && (
            <div style={{ padding: 20, borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <p style={{ marginBottom: 12 }}>{speedText}</p>
              {bar("Fast & Accurate", sp("fast"))}
              {bar("Heavy but Correct", sp("heavy"))}
              {bar("Impulsive Errors", sp("impulsive"))}
              {bar("Slow & Confused", sp("confused"))}
            </div>
          )}

          {activeProfileTab === "plan" && (
            <div style={{ padding: 20, borderRadius: 12, background: "#ecfeff", border: "1px solid #bae6fd" }}>
              {totalQ === 0 ? (
                <p>Take at least one RC test to generate your plan.</p>
              ) : (
                <>
                  <p style={{ marginBottom: 12 }}>
                    Your 14-day adaptive plan (updates after every test):
                  </p>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} style={{ padding: 10, marginBottom: 6, background: "#fff", borderRadius: 8 }}>
                      <b>Day {i + 1}</b> — Focus on{" "}
                      <b>{weakest?.toUpperCase() || "INFERENCE"}</b> + one timed RC
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      );
    })()}
  </div>
)}
    </main>
  );
}
