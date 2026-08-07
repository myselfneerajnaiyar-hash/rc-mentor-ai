"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AssessmentMode from "./assessment/AssessmentMode";

export default function SpeedGym() {
  const [phase, setPhase] = useState("loading");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [paragraphProgress, setParagraphProgress] = useState({});
  const [completedReading, setCompletedReading] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [readSeconds, setReadSeconds] = useState(0);
  const [paragraphReadSeconds, setParagraphReadSeconds] = useState(0);
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

    if (!data || !data.length) return { wpm: 180, level: "easy" };

    const averageEffectiveWPM = data.reduce(
      (sum, session) => sum + session.effective_wpm,
      0
    ) / data.length;
    const currentTarget = Math.round(Math.min(500, Math.max(100, averageEffectiveWPM)));
    const latestSession = data[0];
    const recentThree = data.slice(0, 3);
    const exceededTargetThreeTimes = recentThree.length === 3 && recentThree.every(
      (session) => session.effective_wpm > currentTarget
    );

    if (latestSession.accuracy_percent < 60) {
      return { wpm: Math.max(100, currentTarget - 10), level: "stabilize" };
    }

    if (latestSession.accuracy_percent < 70) {
      return { wpm: currentTarget, level: "maintain" };
    }

    if (exceededTargetThreeTimes) {
      return { wpm: Math.min(500, currentTarget + 20), level: "upgrade" };
    }

    return { wpm: currentTarget, level: "maintain" };
  }

  function beginParagraph(nextIndex, drill, target) {
    const words = drill[nextIndex].text.split(/\s+/).length;
    setIndex(nextIndex);
    setParagraphReadSeconds(0);
    setTimeLeft(Math.ceil((words / target.wpm) * 60));
    setPhase("reading");
  }

  async function start() {
    setResult(null);
    try {
      const target = await computeTarget();
      setMeta(target);
      setPhase("loading");

      const res = await fetch("/api/speed-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });
      const data = await res.json();

      if (!data.paragraphs || !data.questions) {
        throw new Error("Invalid API response");
      }

      const merged = data.paragraphs.map((text, paragraphIndex) => ({
        text,
        question: data.questions[paragraphIndex],
      }));

      setParas(merged);
      setAnswers({});
      setParagraphProgress({});
      setCompletedReading({});
      setReadSeconds(0);
      beginParagraph(0, merged, target);
    } catch {
      alert("Speed drill could not load.");
      setPhase("intro");
    }
  }

  useEffect(() => {
    if (phase !== "reading") return;
    if (timeLeft <= 0) {
      setCompletedReading((current) => ({ ...current, [index]: true }));
      setPhase("question");
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((seconds) => seconds - 1);
      setReadSeconds((seconds) => seconds + 1);
      setParagraphReadSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, timeLeft]);

  function moveToNextParagraph(nextProgress) {
    const nextIndex = index + 1;
    if (nextIndex >= paras.length) {
      finish(nextProgress);
      return;
    }
    beginParagraph(nextIndex, paras, meta);
  }

  function recordCurrentParagraph(status) {
    const nextProgress = {
      ...paragraphProgress,
      [index]: {
        status,
        readSeconds: paragraphReadSeconds,
      },
    };
    setParagraphProgress(nextProgress);
    moveToNextParagraph(nextProgress);
  }

  function skipCurrentStep() {
    if (phase === "reading") {
      setCompletedReading((current) => ({ ...current, [index]: false }));
      setPhase("question");
      return;
    }

    if (phase === "question") {
      recordCurrentParagraph("skipped");
    }
  }

  function completeQuestion() {
    if (phase !== "question" || answers[index] === undefined) return;
    recordCurrentParagraph("attempted");
  }

  async function finish(progress = paragraphProgress) {
    const details = paras.map((paragraph, paragraphIndex) => {
      const progressForParagraph = progress[paragraphIndex] || {
        status: "skipped",
        readSeconds: 0,
      };
      const answerIndex = answers[paragraphIndex];
      const attempted = progressForParagraph.status === "attempted";
      const correct = attempted && answerIndex === paragraph.question.correct;

      return {
        ...paragraph,
        paragraphNumber: paragraphIndex + 1,
        status: attempted ? "attempted" : "skipped",
        readSeconds: progressForParagraph.readSeconds,
        answerIndex,
        correct,
      };
    });

    const attempted = details.filter((item) => item.status === "attempted");
    const skipped = details.filter((item) => item.status === "skipped");
    const correct = attempted.filter((item) => item.correct).length;
    const incorrect = attempted.length - correct;
    const totalTime = readSeconds;
    const totalWordsRead = details.reduce(
      (sum, item) => item.readSeconds > 0 || item.status === "attempted"
        ? sum + item.text.split(/\s+/).length
        : sum,
      0
    );
    const calculatedRaw = totalTime > 0
      ? (totalWordsRead / totalTime) * 60
      : 0;
    const rawWPM = Math.round(
      Math.min(500, Math.max(100, calculatedRaw))
    );
    const accuracy = attempted.length ? Math.round((correct / attempted.length) * 100) : 0;
    const effectiveWPM = Math.round(rawWPM * (accuracy / 100));
    const performance = meta?.wpm > 0 ? Math.round((effectiveWPM / meta.wpm) * 100) : 0;
    const timePerParagraph = paras.length ? Math.round(totalTime / paras.length) : 0;

    const record = {
      date: Date.now(),
      rawWPM,
      accuracy,
      effectiveWPM,
      performance,
      level: meta.level,
      totalTime,
      attemptedCount: attempted.length,
      skippedCount: skipped.length,
      correct,
      incorrect,
      details,
    };

    const history = JSON.parse(localStorage.getItem("speedProfile") || "[]");
    history.push(record);
    localStorage.setItem("speedProfile", JSON.stringify(history));

    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { error } = await supabase.from("speed_sessions").insert([
        {
          user_id: authData.user.id,
          total_words: totalWordsRead,
          total_time_s: totalTime,
          raw_wpm: rawWPM,
          total_questions: attempted.length,
          correct_answers: correct,
          accuracy_percent: accuracy,
          effective_wpm: effectiveWPM,
          paragraph_count: paras.length,
          time_per_paragraph_s: timePerParagraph,
          difficulty_level: meta.level,
        },
      ]);
      console.log("Speed insert error:", error);
    }

    setResult(record);
    setPhase("result");
  }

  const totalAllowed = readSeconds + timeLeft;
  const elapsedRatio = totalAllowed > 0 ? readSeconds / totalAllowed : 0;
  let paceStatus = "";
  let paceColor = "#22c55e";
  if (phase === "reading") {
    if (elapsedRatio < 0.3) {
      paceStatus = "Push Faster";
      paceColor = "#facc15";
    } else if (elapsedRatio < 0.7) {
      paceStatus = "Good Momentum";
    } else if (elapsedRatio < 0.9) {
      paceStatus = "Speed Up Now";
      paceColor = "#f97316";
    } else {
      paceStatus = "Final Burst";
      paceColor = "#ef4444";
    }
  }

  return (
    <div style={wrap}>
      <AssessmentMode active={phase === "reading" || phase === "question"} />
      {phase === "loading" && <div style={panel}><h3>Preparing adaptive drill…</h3><p>Target: {meta?.wpm} WPM · {meta?.level}</p></div>}

      {phase === "reading" && (
        <div style={panel}>
          <div style={readingHeader}>
            <div>
              <div style={paragraphTitle}>Paragraph {index + 1}/{paras.length}</div>
              <div style={targetLabel}>🎯 Target: {meta?.wpm} WPM</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={timer}>{timeLeft}s</div>
              <div style={{ ...pace, color: paceColor }}>🔥 Pace: {paceStatus}</div>
            </div>
          </div>
          <div style={progressTrack}><div style={{ ...progressFill, width: `${(timeLeft / Math.max(timeLeft + paragraphReadSeconds, 1)) * 100}%` }} /></div>
          <p style={text}>{paras[index]?.text}</p>
          <div style={navigation}>
            <button type="button" style={skipBtn} onClick={skipCurrentStep}>Skip</button>
          </div>
        </div>
      )}

      {phase === "question" && (
        <div style={panel}>
          <div style={questionMeta}>Paragraph {index + 1}/{paras.length} · {paragraphReadSeconds}s read</div>
          <b style={questionText}>{paras[index].question.q}</b>
          {paras[index].question.options.map((option, optionIndex) => (
            <label key={optionIndex} style={{ ...optionStyle, borderColor: answers[index] === optionIndex ? "#38bdf8" : "#1f2937" }}>
              <input type="radio" name={`q${index}`} checked={answers[index] === optionIndex} style={{ marginRight: 8 }} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} />
              {option}
            </label>
          ))}
          <div style={navigation}>
            <button type="button" style={skipBtn} onClick={skipCurrentStep}>Skip Question</button>
            <button type="button" style={{ ...btn, opacity: answers[index] === undefined ? 0.5 : 1 }} disabled={answers[index] === undefined} onClick={completeQuestion}>Continue</button>
          </div>
        </div>
      )}

      {phase === "result" && result && <DetailedReport result={result} meta={meta} onRestart={start} />}
    </div>
  );
}

function DetailedReport({ result, meta, onRestart }) {
  return (
    <div style={reportWrap}>
      <section style={panel}>
        <div style={reportHeading}>
          <div><p style={eyebrow}>SPEED DRILL REVIEW</p><h2 style={{ margin: 0 }}>Your detailed report</h2></div>
          <div style={effectiveSpeedPill}><span>Effective Speed</span><b>{result.effectiveWPM} WPM</b></div>
        </div>
        <div style={metricGrid}>
          <Metric label="Raw Speed" value={`${result.rawWPM} WPM`} />
          <Metric label="Effective Speed" value={`${result.effectiveWPM} WPM`} />
          <Metric label="Accuracy" value={`${result.accuracy}%`} />
          <Metric label="Time" value={`${result.totalTime}s`} />
          <Metric label="Attempted" value={result.attemptedCount} />
          <Metric label="Skipped" value={result.skippedCount} />
          <Metric label="Correct" value={result.correct} tone="#4ade80" />
          <Metric label="Incorrect" value={result.incorrect} tone="#f87171" />
        </div>
        <p style={reportNote}>Raw Speed: {result.rawWPM} WPM · Effective Speed: {result.effectiveWPM} WPM · Performance: {result.performance}% of Target · Target Speed: {meta?.wpm} WPM · Difficulty: {meta?.level}</p>
      </section>

      <div style={reviewList}>
        {result.details.map((item) => {
          const skipped = item.status === "skipped";
          const userAnswer = item.answerIndex === undefined ? null : item.question.options[item.answerIndex];
          const correctAnswer = item.question.options[item.question.correct];
          return (
            <article key={item.paragraphNumber} style={reviewCard}>
              <div style={reviewHeader}>
                <div><p style={eyebrow}>PARAGRAPH {item.paragraphNumber}</p><h3 style={{ margin: 0 }}>{skipped ? "Not Attempted" : item.correct ? "Correct response" : "Review response"}</h3></div>
                <span style={{ ...badge, ...(skipped ? skippedBadge : attemptedBadge) }}>{skipped ? "Skipped" : "Attempted"}</span>
              </div>
              <div style={paragraphMetrics}><span>Accuracy: <b>{skipped ? "—" : item.correct ? "100%" : "0%"}</b></span><span>Time spent: <b>{item.readSeconds}s</b></span></div>
              <p style={reviewParagraph}>{item.text}</p>
              <div style={questionBox}>
                <p style={questionLabel}>QUESTION</p>
                <p style={questionText}>{item.question.q}</p>
                {skipped ? <>
                  <p style={notAttempted}>Not Attempted</p>
                  <ReviewRow label="Correct answer" value={correctAnswer} tone="#86efac" />
                </> : <>
                  <ReviewRow label="Your answer" value={userAnswer} tone={item.correct ? "#86efac" : "#fca5a5"} />
                  <ReviewRow label="Correct answer" value={correctAnswer} tone="#86efac" />
                  <p style={{ ...indicator, color: item.correct ? "#4ade80" : "#f87171" }}>{item.correct ? "✓ Correct" : "✕ Incorrect"}</p>
                </>}
                <div style={explanationBox}><b>Explanation</b><p>{item.question.explanation || "Review the paragraph's central idea and the evidence supporting the correct option."}</p></div>
              </div>
            </article>
          );
        })}
      </div>
      <button type="button" onClick={onRestart} className="mt-2 px-8 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20">Next Drill</button>
    </div>
  );
}

function Metric({ label, value, tone = "#f8fafc" }) { return <div style={metric}><b style={{ color: tone }}>{value}</b><span>{label}</span></div>; }
function ReviewRow({ label, value, tone }) { return <p style={answerRow}><span>{label}</span><b style={{ color: tone }}>{value}</b></p>; }

const wrap = { width: "100%" };
const panel = { width: "100%", maxWidth: 820, padding: "clamp(20px, 5vw, 32px)", borderRadius: 24, background: "#111827", border: "1px solid #1f2937", boxShadow: "0 25px 60px rgba(0,0,0,0.7)", color: "#e2e8f0", boxSizing: "border-box" };
const readingHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 };
const paragraphTitle = { fontSize: 18, fontWeight: 700, color: "#f1f5f9" };
const targetLabel = { marginTop: 6, fontSize: 14, fontWeight: 600, color: "#38bdf8" };
const timer = { fontSize: 30, fontWeight: 800, color: "#22c55e" };
const pace = { marginTop: 6, fontSize: 14, fontWeight: 700 };
const progressTrack = { height: 6, background: "#1f2937", borderRadius: 999, overflow: "hidden", marginBottom: 20 };
const progressFill = { height: "100%", background: "#22c55e", transition: "width 1s linear" };
const text = { marginTop: 18, lineHeight: 1.9, fontSize: 17, color: "#e5e7eb", letterSpacing: "0.2px" };
const questionMeta = { color: "#38bdf8", fontSize: 14, fontWeight: 700, marginBottom: 14 };
const questionText = { display: "block", lineHeight: 1.55, fontSize: 17, color: "#f8fafc" };
const optionStyle = { display: "block", marginTop: 10, padding: 12, borderRadius: 12, border: "1px solid #1f2937", background: "#0f172a", cursor: "pointer", transition: "0.2s", color: "#e2e8f0" };
const navigation = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 20 };
const btn = { padding: "12px 22px", borderRadius: 12, background: "#2563eb", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer" };
const skipBtn = { ...btn, background: "#334155" };
const reportWrap = { display: "grid", gap: 20, maxWidth: 920 };
const reportHeading = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" };
const eyebrow = { margin: "0 0 6px", color: "#38bdf8", fontWeight: 800, fontSize: 12, letterSpacing: "0.09em" };
const effectiveSpeedPill = { display: "grid", gap: 3, background: "#172554", color: "#93c5fd", border: "1px solid #1d4ed8", borderRadius: 16, padding: "10px 14px", fontWeight: 800 };
const metricGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 24 };
const metric = { display: "grid", gap: 4, background: "#0f172a", border: "1px solid #1e293b", padding: 14, borderRadius: 14 };
const reportNote = { margin: "18px 0 0", color: "#94a3b8", lineHeight: 1.6 };
const reviewList = { display: "grid", gap: 16 };
const reviewCard = { ...panel, maxWidth: 920, boxShadow: "none" };
const reviewHeader = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" };
const badge = { borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" };
const skippedBadge = { background: "#3f3f46", color: "#d4d4d8" };
const attemptedBadge = { background: "#052e16", color: "#86efac" };
const paragraphMetrics = { display: "flex", flexWrap: "wrap", gap: 18, margin: "18px 0", color: "#cbd5e1", fontSize: 14 };
const reviewParagraph = { color: "#cbd5e1", lineHeight: 1.75, padding: 16, background: "#0f172a", borderRadius: 14, border: "1px solid #1e293b" };
const questionBox = { marginTop: 16, padding: 16, background: "#172033", borderRadius: 16, border: "1px solid #26354d" };
const questionLabel = { margin: "0 0 8px", fontSize: 12, color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em" };
const answerRow = { display: "grid", gap: 4, margin: "14px 0 0", color: "#94a3b8", fontSize: 14 };
const indicator = { margin: "14px 0 0", fontWeight: 800 };
const explanationBox = { marginTop: 16, padding: 14, borderRadius: 12, background: "#0f172a", color: "#cbd5e1", lineHeight: 1.6 };
const notAttempted = { color: "#fbbf24", fontWeight: 800, margin: "16px 0 0" };
