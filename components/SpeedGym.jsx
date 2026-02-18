"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function SpeedGym({ onBack }) {
  const [phase, setPhase] = useState("loading");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [readSeconds, setReadSeconds] = useState(0);
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
  start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

 async function computeTarget() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { wpm: 180, level: "easy" };

  const { data } = await supabase
    .from("speed_sessions")
    .select("effective_wpm, accuracy_percent")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data || !data.length) {
    return { wpm: 180, level: "easy" };
  }

  const avgEff =
    data.reduce((a, b) => a + b.effective_wpm, 0) / data.length;

  const avgAcc =
    data.reduce((a, b) => a + b.accuracy_percent, 0) / data.length;

  if (avgAcc < 60) {
    return { wpm: Math.max(avgEff - 20, 150), level: "stabilize" };
  }

  if (avgAcc > 75) {
    return { wpm: avgEff + 20, level: "upgrade" };
  }

  return { wpm: avgEff, level: "maintain" };
}
  async function start() {
    try {
      const target =await computeTarget();
      setMeta(target);
      setPhase("loading");

      const res = await fetch("/api/speed-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });

      const data = await res.json();

if (!data.paragraphs || !data.questions) {
  console.error("API error:", data);
  throw new Error("Invalid API response");
}
     

// Combine paragraph + question into one array
const merged = data.paragraphs.map((p, i) => ({
  text: p,
  question: data.questions[i],
}));

setParas(merged);
      setIndex(0);
      setAnswers({});
      setReadSeconds(0);

      const words = merged[0].text.split(/\s+/).length;
      const sec = Math.ceil((words / target.wpm) * 60);
      setTimeLeft(sec);
      setPhase("reading");
    } catch {
      alert("Speed drill could not load.");
      setPhase("intro");
    }
  }

  useEffect(() => {
    if (phase !== "reading") return;

    if (timeLeft <= 0) {
      setPhase("question");
      return;
    }
   

    const id = setInterval(() => {
      setTimeLeft(t => t - 1);
      setReadSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timeLeft]);

  function nextPara() {
    const next = index + 1;
    if (next >= paras.length) {
      finish();
      return;
    }

    setIndex(next);
    const words = paras[next].text.split(/\s+/).length;
    const sec = Math.ceil((words / meta.wpm) * 60);
    setTimeLeft(sec);
    setPhase("reading");
  }

  async function finish() {
    const totalWords = paras.reduce(
      (s, p) => s + p.text.split(/\s+/).length,
      0
    );

    const rawWPM = Math.round((totalWords / readSeconds) * 60);

    const correct = paras.reduce(
      (s, p, i) => s + (answers[i] === p.question.correct ? 1 : 0),
      0
    );

    const accuracy = Math.round((correct / paras.length) * 100);
    const effectiveWPM = Math.round(rawWPM * (accuracy / 100));
    const timePerParagraph = Math.round(readSeconds / paras.length);

    const record = {
      date: Date.now(),
      rawWPM,
      accuracy,
      effectiveWPM,
      level: meta.level,
    };

    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    history.push(record);
    localStorage.setItem("speedProfile", JSON.stringify(history));

    // 🔐 Get logged in user
const { data: authData, error: authError } = await supabase.auth.getUser();

if (authError || !authData?.user) {
  console.log("No logged in user for speed drill.");
  return;
}

const userId = authData.user.id;

console.log("Saving speed drill for:", userId);

const { error: insertError } = await supabase
  .from("speed_sessions")
  .insert([
    {
      user_id: userId,
      total_words: totalWords,
      total_time_s: readSeconds,
      raw_wpm: rawWPM,
      total_questions: paras.length,
      correct_answers: correct,
      accuracy_percent: accuracy,
      effective_wpm: effectiveWPM,
      paragraph_count: paras.length,
      time_per_paragraph_s: timePerParagraph,
      difficulty_level: meta.level,
    },
  ]);

console.log("Speed insert error:", insertError);

    setResult(record);
    setPhase("result");
  }

  

  return (
    <div style={wrap}>
     

      {phase === "loading" && (
        <div style={panel}>
          <h3>Preparing adaptive drill…</h3>
          <p>Target: {meta?.wpm} WPM · {meta?.level}</p>
        </div>
      )}

      {phase === "reading" && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Paragraph {index + 1}/4</b>
            <b>{timeLeft}s</b>
          </div>
          <p style={text}>{paras[index]?.text}</p>
        </div>
      )}

      {phase === "question" && (
        <div style={panel}>
          <b>{paras[index].question.q}</b>
          {paras[index].question.options.map((o, oi) => (
            <div key={oi}>
              <label>
                <input
                  type="radio"
                  name={"q" + index}
                  onChange={() =>
                    setAnswers(a => ({ ...a, [index]: oi }))
                  }
                />{" "}
                {o}
              </label>
            </div>
          ))}
          <button style={{ ...btn, marginTop: 12 }} onClick={nextPara}>
            Continue
          </button>
        </div>
      )}

      {phase === "result" && (
        <div style={panel}>
          <h2>Drill Result</h2>
          <p><b>Raw Speed:</b> {result.rawWPM} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>
          <p><b>Effective Speed:</b> {result.effectiveWPM} WPM</p>
          <button style={btn} onClick={() => setPhase("intro")}>
            Next Drill
          </button>
        </div>
      )}
    </div>
  );
}

const wrap = {
  width: "100%",
};

const panel = {
  width: "100%",
  maxWidth: 820,
  padding: 28,
  borderRadius: 20,
  background: "linear-gradient(180deg, #ecfeff, #f0fdfa)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
};

const btn = {
  padding: "12px 18px",
  borderRadius: 10,
  background: "#22c55e",
  color: "#fff",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

const text = {
  marginTop: 14,
  lineHeight: 1.8,
  fontSize: 16,
};
