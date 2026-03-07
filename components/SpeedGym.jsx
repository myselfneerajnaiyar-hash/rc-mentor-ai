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
  return { 
    wpm: Math.round(Math.max(avgEff - 20, 150)), 
    level: "stabilize" 
  };
}

if (avgAcc > 75) {
  return { 
    wpm: Math.round(avgEff + 20), 
    level: "upgrade" 
  };
}

return { 
  wpm: Math.round(avgEff), 
  level: "maintain" 
};
}
  async function start() {
    setResult(null);
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

  // ===== Pace Status Logic =====
const totalAllowed = readSeconds + timeLeft;
const elapsedRatio =
  totalAllowed > 0 ? readSeconds / totalAllowed : 0;

let paceStatus = "";
let paceColor = "#22c55e";

if (phase === "reading") {
  if (elapsedRatio < 0.3) {
    paceStatus = "Push Faster";
    paceColor = "#facc15";
  } else if (elapsedRatio < 0.7) {
    paceStatus = "Good Momentum";
    paceColor = "#22c55e";
  } else if (elapsedRatio < 0.9) {
    paceStatus = "Speed Up Now";
    paceColor = "#f97316";
  } else {
    paceStatus = "Final Burst";
    paceColor = "#ef4444";
  }
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

if (!authData?.user) {
  console.log("No logged in user for speed drill.");
} else {
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
}

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
          <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  }}
>
  {/* LEFT SIDE */}
  <div>
    <div
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#f1f5f9",
      }}
    >
      Paragraph {index + 1}/4
    </div>

    <div
      style={{
        marginTop: 6,
        fontSize: 14,
        fontWeight: 600,
        color: "#38bdf8",
      }}
    >
      🎯 Target: {meta?.wpm} WPM
    </div>
  </div>

  {/* RIGHT SIDE */}
  <div style={{ textAlign: "right" }}>
    <div
      style={{
        fontSize: 30,
        fontWeight: 800,
        color: "#22c55e",
      }}
    >
      {timeLeft}s
    </div>

    <div
  style={{
    marginTop: 6,
    fontSize: 14,
    fontWeight: 700,
    color: paceColor,
  }}
>
  🔥 Pace: {paceStatus}
</div>
  </div>
</div>

<div
  style={{
    height: 6,
    background: "#1f2937",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 20,
  }}
>
  <div
    style={{
      width: `${(timeLeft / (timeLeft + readSeconds)) * 100}%`,
      height: "100%",
      background: "#22c55e",
      transition: "width 1s linear",
    }}
  />
</div>
          <p style={text}>{paras[index]?.text}</p>
        </div>
      )}

      {phase === "question" && (
        <div style={panel}>
          <b>{paras[index].question.q}</b>
         {paras[index].question.options.map((o, oi) => (
  <label
    key={oi}
    style={{
      display: "block",
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      border: "1px solid #1f2937",
      background: "#0f172a",
      cursor: "pointer",
      transition: "0.2s",
    }}
  >
    <input
      type="radio"
      name={"q" + index}
      style={{ marginRight: 8 }}
      onChange={() =>
        setAnswers(a => ({ ...a, [index]: oi }))
      }
    />
    {o}
  </label>
))}
          <button style={{ ...btn, marginTop: 12 }} onClick={nextPara}>
            Continue
          </button>
        </div>
      )}

     {phase === "result" && result && (
        <div style={panel}>
          <h2>Drill Result</h2>
          <p><b>Raw Speed:</b> {result.rawWPM} WPM</p>
          <p><b>Accuracy:</b> {result.accuracy}%</p>
          <p><b>Effective Speed:</b> {result.effectiveWPM} WPM</p>

          <p style={{ 
            marginTop: 16, 
            fontWeight: 600,
            color:
              result.accuracy < 60
                ? "#dc2626"
                : result.effectiveWPM > meta.wpm
                ? "#16a34a"
                : "#2563eb"
          }}>
            {result.accuracy < 60
              ? "You rushed. Control first, speed later."
              : result.effectiveWPM > meta.wpm
              ? "Strong control. You're adapting upward."
              : "Stable base. Now push slightly beyond comfort."}
          </p>

          <button
  onClick={start}
  className="mt-6 px-8 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20"
>
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
  padding: 32,
  borderRadius: 24,
  background: "#111827",
  border: "1px solid #1f2937",
  boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
  color: "#e2e8f0",
};

const btn = {
  padding: "12px 22px",
  borderRadius: 12,
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 16,
};

const text = {
  marginTop: 18,
  lineHeight: 1.9,
  fontSize: 17,
  color: "#e5e7eb",
  letterSpacing: "0.2px",
};