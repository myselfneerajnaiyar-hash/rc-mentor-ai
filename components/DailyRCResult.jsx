"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DailyRCResult() {

    const [resultData, setResultData] =
  useState(null);

useEffect(() => {

  const data =
    localStorage.getItem(
      "dailyRCResult"
    );

  if (data) {
    setResultData(
      JSON.parse(data)
    );
  }

}, []);

if (!resultData) {
  return (
    <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">
      Loading Result...
    </div>
  );
}

    const profile =
  resultData.correct === 4
    ? "🏆 RC Assassin"
    : resultData.correct === 3
    ? "🎯 Inference Hunter"
    : resultData.correct === 2
    ? "🧠 Scope Controller"
    : resultData.correct === 1
    ? "⚠️ Trap Survivor"
    : "💀 RC Casualty";

    let profileDescription = "";

if (resultData.correct === 4) {
  profileDescription =
    "Exceptional comprehension and option elimination. You are operating at an elite RC level.";
}
else if (resultData.correct === 3) {
  profileDescription =
    "Strong understanding with minor inference leakage. Focus on precision.";
}
else if (resultData.correct === 2) {
  profileDescription =
    "Average RC performance. Understanding exists but consistency is missing.";
}
else if (resultData.correct === 1) {
  profileDescription =
    "You are detecting some ideas correctly but still falling into option traps.";
}
else {
  profileDescription =
    "Current attempt suggests weak author tracking and premature option elimination.";
}
  const score =
    resultData?.catScore || 0;

  const accuracy =
    resultData?.accuracy || 0;

  const timeUsed =
    resultData?.timeUsed || 0;

  const composite =
    resultData?.compositeScore || 0;

  let badge = "RC Casualty";
  let badgeColor =
    "bg-red-500/10 border-red-500/30 text-red-300";

  if (score >= 12) {
    badge = "RC Assassin";
    badgeColor =
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
  } else if (score >= 8) {
    badge = "Inference Hunter";
    badgeColor =
      "bg-cyan-500/10 border-cyan-500/30 text-cyan-300";
  } else if (score >= 4) {
    badge = "Scope Controller";
    badgeColor =
      "bg-blue-500/10 border-blue-500/30 text-blue-300";
  } else if (score >= 1) {
    badge = "Trap Survivor";
    badgeColor =
      "bg-amber-500/10 border-amber-500/30 text-amber-300";
  }

  let mentorText =
    "Your attempt suggests premature option selection before establishing the author's central argument.";

  if (score >= 8) {
    mentorText =
      "Strong comprehension and selection discipline. Focus on improving speed while maintaining accuracy.";
  } else if (score >= 4) {
    mentorText =
      "You understand the passage reasonably well but lose marks through avoidable elimination mistakes.";
  }

 


  return (
    <main className="min-h-screen bg-[#071120] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/daily-challenge" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft size={16} />Back to Arena</Link>
          <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Analysis journey"><span className="text-cyan-300">Results</span><span>→</span><Link href="/cognition-diagnosis" className="hover:text-purple-300">Cognitive Diagnosis</Link><span>→</span><Link href="/detailed-review" className="hover:text-cyan-300">Detailed Review</Link></nav>
        </div>

        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/55 via-slate-900 to-slate-950 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Daily RC Arena</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">RC Diagnosis Report</h1><span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeColor}`}>{badge}</span></div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <SummaryMetric label="Score" value={score} tone={score < 0 ? "red" : "green"} />
              <SummaryMetric label="Accuracy" value={`${accuracy}%`} />
              <SummaryMetric label="Time" value={formatTime(timeUsed)} />
              <SummaryMetric label="Questions" value={(resultData?.correct || 0) + (resultData?.incorrect || 0) + (resultData?.unanswered || 0)} />
              <SummaryMetric label="Correct" value={resultData?.correct} tone="green" />
              <SummaryMetric label="Incorrect" value={resultData?.incorrect} tone="red" />
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InsightPanel label="Mentor Verdict" title={profile} body={mentorText} tone="amber" />
          <InsightPanel label="Performance Profile" title={profileDescription} body={`Composite score: ${composite} · Unanswered: ${resultData?.unanswered || 0}`} tone="cyan" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><p className="text-[11px] font-bold uppercase tracking-wide text-cyan-300">Leaderboard Impact</p><div className="mt-3 flex items-end gap-8"><div><p className="text-xs text-slate-500">CAT Score</p><p className="text-2xl font-black">{score}</p></div><div><p className="text-xs text-slate-500">Composite</p><p className="text-2xl font-black text-cyan-200">{composite}</p></div></div><p className="mt-3 text-xs leading-5 text-slate-500">Composite score combines CAT performance with completion speed for ranking.</p></section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">Today&apos;s Mission</p><ul className="mt-3 grid gap-2 text-sm text-slate-300"><li>✓ Read the author&apos;s conclusion before options</li><li>✓ Eliminate only after evidence</li><li>✓ Cap decision time at 90 seconds</li></ul></section>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/cognition-diagnosis" className="flex min-h-14 items-center justify-between rounded-xl border border-purple-500/25 bg-purple-500/10 px-5 font-bold text-purple-200 transition hover:bg-purple-500/15"><span>Cognitive Diagnosis</span><span>→</span></Link>
          <Link href="/detailed-review" className="flex min-h-14 items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-5 font-bold text-cyan-200 transition hover:bg-cyan-500/15"><span>Detailed Review</span><span>→</span></Link>
        </div>
      </div>
    </main>
  );
}

function SummaryMetric({ label, value, tone }) {
  const color = tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-white";
  return <div className="min-w-[88px] rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-lg font-black ${color}`}>{value ?? 0}</p></div>;
}

function InsightPanel({ label, title, body, tone }) {
  const labelColor = tone === "amber" ? "text-amber-300" : "text-cyan-300";
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><p className={`text-[11px] font-bold uppercase tracking-wide ${labelColor}`}>{label}</p><h2 className="mt-2 text-lg font-bold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></section>;
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
