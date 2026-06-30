"use client";
import {
  Trophy,
 AlertTriangle ,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TestResultView({
  attempt,
  onViewDiagnosis,
  onExit,
}) {
    const router = useRouter();
 const score = attempt.score ?? 0;

  const accuracy =
  attempt.accuracy ?? 0;

 const analysis =
  attempt.analysis || {};

const rcStats =
  analysis.rcStats || {};

const vaStats =
  analysis.vaStats || {};

const fastestCorrect =
  analysis.timeStats?.fastestCorrect || 0;

const slowestQuestion =
  analysis.timeStats?.slowestQuestion || 0;

const timeOnWrongs =
  analysis.timeStats?.timeOnWrongs || 0;

const passages =
  analysis.passages || [];

const questionTypes =
  analysis.questionTypes || [];

const strongestArea =
  analysis.strongestArea;

const weakestArea =
  analysis.weakestArea;

const verdict =
  analysis.mentorVerdict?.headline || "";

const avgTime =
  analysis.timeStats?.average || 0;

const totalTime =
  analysis.timeStats?.totalTime || 0

  const getBarColor = (accuracy) => {
  if (accuracy >= 75)
    return "bg-green-400";

  if (accuracy >= 50)
    return "bg-yellow-400";

  if (accuracy >= 25)
    return "bg-orange-400";

  return "bg-red-400";
};

const getScoreColor = (accuracy) => {
  if (accuracy >= 75)
    return "text-green-400";

  if (accuracy >= 50)
    return "text-yellow-400";

  if (accuracy >= 25)
    return "text-orange-400";

  return "text-red-400";
};

  return (
  <div className="min-h-screen bg-[#071120] text-white">
    <div className="max-w-7xl mx-auto px-8 py-10">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-8">

        <div className="flex items-center gap-3">

          <img
            src="/logo.png"
            className="w-8 h-8"
          />

          <div>

            <div className="font-bold text-white">
              Auctor RC
            </div>

            <div className="text-xs text-slate-400">
              CAT Arena
            </div>

          </div>

        </div>

      </div>

      <div className="max-w-5xl mx-auto">

  <div className="rounded-3xl rounded-3xl
border border-orange-500/20
bg-slate-900/60
backdrop-blur-xl
p-10 border border-orange-500/30 p-10">

    <div className="text-sm uppercase tracking-widest text-orange-400">
      CAT Arena Result
    </div>

    <h1 className="text-5xl font-black mt-3">
      Test Completed
    </h1>

    <div className="mt-10 flex items-end gap-4">

 <div
  className="
  text-8xl
  font-black
  bg-gradient-to-r
  from-orange-300
  to-yellow-300
  bg-clip-text
  text-transparent
"
>
        {score}
      </div>

      <div className="pb-3 text-zinc-400">
        Marks
      </div>

    </div>

  </div>


     <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5 mt-8">

  <div
  className="
  bg-slate-900/60
  border
  border-cyan-500/20
  backdrop-blur-xl
  rounded-3xl
  p-6
"
>
    <div className="text-zinc-400">
      Accuracy
    </div>
    <div className="text-4xl font-bold mt-2">
      {accuracy}%
    </div>
  </div>

  <div
  className="
  bg-slate-900/60
  border
  border-cyan-500/20
  backdrop-blur-xl
  rounded-3xl
  p-6
"
>
    <div className="text-zinc-400">
      Correct
    </div>
    <div className="text-4xl font-bold mt-2 text-green-400">
      {attempt.correct}
    </div>
  </div>

  <div
  className="
  bg-slate-900/60
  border
  border-cyan-500/20
  backdrop-blur-xl
  rounded-3xl
  p-6
"
>
    <div className="text-zinc-400">
      Wrong
    </div>
    <div className="text-4xl font-bold mt-2 text-red-400">
      {attempt.wrong}
    </div>
  </div>

<div
  className="
  bg-slate-900/60
  border
  border-cyan-500/20
  backdrop-blur-xl
  rounded-3xl
  p-6
"
>
    <div className="text-zinc-400">
      Attempted
    </div>
    <div className="text-4xl font-bold mt-2">
      {attempt.attempted}
    </div>
  </div>

  <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6">
  <div className="text-slate-400">
    Avg Time / Q
  </div>

  <div className="text-4xl font-black mt-2 text-cyan-300">
  {avgTime}s
</div>
</div>

<div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-6">
  <div className="text-slate-400">
    Time Usage
  </div>

 <div className="text-4xl font-black mt-2 text-purple-300">
  {Math.round((totalTime / 2400) * 100)}%
</div>
</div>
</div>



<div
  className="
  mt-8
  rounded-3xl
  border
  border-purple-500/20
  bg-slate-900/60
  backdrop-blur-xl
  p-8
"
>

 <div className="mt-10 rounded-3xl border border-amber-500/20 bg-slate-900/60 p-8">

  <div className="text-xl font-black text-amber-300">
    Birbal's Verdict
  </div>

 <p className="mt-5 text-slate-300 leading-8">
  {verdict}
</p>

</div>
</div>

{/* RC VS VA */}

<div className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl p-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
    RC vs VA Breakdown
  </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

   <div className="
rounded-2xl
border border-cyan-400/30
bg-cyan-500/10
p-6
">
      <div className="text-cyan-300 font-black text-xl">
        Reading Comprehension
      </div>

      <div className="mt-4 text-5xl font-black text-cyan-300">
{rcStats.accuracy || 0}%
</div>

      <div className="mt-3 text-slate-400">
       {rcStats.correct || 0} Correct out of {rcStats.total || 0}
      </div>

    </div>

   <div className="
rounded-2xl
border border-violet-400/30
bg-violet-500/10
p-6
">
      <div className="text-purple-300 font-black text-xl">
        Verbal Ability
      </div>

     <div className="mt-4 text-5xl font-black text-violet-300">
{vaStats.accuracy || 0}%
</div>

      <div className="mt-3 text-slate-400">
       {vaStats.correct || 0} Correct out of {vaStats.total || 0}
      </div>

    </div>

  </div>

</div>

{/* PASSAGE PERFORMANCE */}

<div className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl p-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
    Passage Performance
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">

    {passages.map((p) => (

  <div
    key={p.passageNumber}
    className="
    rounded-2xl
    border
    border-cyan-500/20
    bg-cyan-500/5
    p-5
    "
  >

    <div className="text-slate-400">
      Passage {p.passageNumber}
    </div>

    <div className="text-xs text-slate-500 mt-1">
      {p.title}
    </div>

   <div
  className="text-4xl font-black mt-3"
  style={{
    color:
      p.accuracy >= 75
        ? "#4ade80"
        : p.accuracy >= 50
        ? "#facc15"
        : p.accuracy >= 25
        ? "#fb923c"
        : "#f87171",
  }}
>
  {p.correct}/{p.total}
  <div className="text-sm text-slate-400 mt-2">
  {p.accuracy}% Accuracy
</div>
</div>

  <div className="mt-4 h-4 rounded-full bg-slate-700 overflow-hidden">

  <div
    style={{
      width: `${p.accuracy}%`,
      height: "100%",
      backgroundColor:
        p.accuracy >= 75
          ? "#4ade80"
          : p.accuracy >= 50
          ? "#facc15"
          : p.accuracy >= 25
          ? "#fb923c"
          : "#f87171",
    }}
  />

</div>

  </div>

))}
</div>
</div>

<div className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl p-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
    Question Type Performance
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">

   {questionTypes.map((q) => (

  <div
    key={q.type}
    className="
    rounded-2xl
    border
    border-cyan-500/20
    bg-cyan-500/5
    p-5
    "
  >

   
  
   <div className="text-slate-400">
  {q.type}
</div>

<div
  className="text-4xl font-black mt-3"
  style={{
    color:
      q.accuracy >= 75
        ? "#4ade80"
        : q.accuracy >= 50
        ? "#facc15"
        : q.accuracy >= 25
        ? "#fb923c"
        : "#f87171",
  }}
>
  {q.correct}/{q.total}
</div>

<div className="text-sm text-slate-400 mt-2">
  {q.accuracy}% Accuracy
</div>

<div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">

  <div
    style={{
      width: `${q.accuracy}%`,
      height: "100%",
      backgroundColor:
        q.accuracy >= 75
          ? "#4ade80"
          : q.accuracy >= 50
          ? "#facc15"
          : q.accuracy >= 25
          ? "#fb923c"
          : "#f87171",
    }}
  />

</div>

  </div>

))}

</div>
</div>

<div className="mt-8 grid md:grid-cols-2 gap-6">

 <div className="
relative overflow-hidden
rounded-3xl
border border-green-500/30
bg-gradient-to-br
from-green-500/20
via-emerald-500/10
to-transparent
p-8
">

<div className="flex items-center gap-2">

  <div className="
  w-8 h-8
  rounded-lg
  bg-green-500/15
  flex items-center justify-center
  ">
    <Trophy
      className="w-4 h-4 text-green-400"
      strokeWidth={2.5}
    />
  </div>

  <div className="
  text-green-300
  text-sm
  uppercase
  tracking-widest
  font-black
  ">
    Strongest Area
  </div>

</div>
 

  <div className="mt-4 text-4xl font-black">
  {strongestArea?.type || "N/A"}
</div>

  <div className="mt-2 text-green-200">
  {strongestArea?.accuracy || 0}% Accuracy
</div>

  <div className="mt-5 h-2 rounded-full bg-black/30 overflow-hidden">
    <div
      className="h-full bg-green-400"
     style={{
  width: `${strongestArea?.accuracy || 0}%`
}}
    />
  </div>

</div>
  <div className="
relative overflow-hidden
rounded-3xl
border border-red-500/30
bg-gradient-to-br
from-red-500/20
via-orange-500/10
to-transparent
p-8
">

 
  <div className="flex items-center gap-2">

  <div className="
  w-8 h-8
  rounded-lg
  bg-red-500/15
  flex items-center justify-center
  ">
    <AlertTriangle
      className="w-4 h-4 text-red-400"
      strokeWidth={2.5}
    />
  </div>

  <div className="
  text-red-300
  text-sm
  uppercase
  tracking-widest
  font-black
  ">
    Weakest Area
  </div>

</div>

 <div className="mt-4 text-4xl font-black">
  {weakestArea?.type || "N/A"}
</div>

 <div className="mt-2 text-red-200">
  {weakestArea?.accuracy || 0}% Accuracy
</div>

  <div className="mt-5 h-2 rounded-full bg-black/30 overflow-hidden">
    <div
      className="h-full bg-red-400"
      style={{
  width: `${weakestArea?.accuracy || 0}%`
}}
    />
  </div>

</div>

</div>

<div className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl p-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
    Time Analysis
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">

    <div className="rounded-2xl border border-cyan-500/20 p-5">
      <div className="text-slate-400">Average Time</div>
      <div className="text-4xl font-black mt-2 text-cyan-300">
  {avgTime}s
</div>
    </div>

    <div className="rounded-2xl border border-cyan-500/20 p-5">
      <div className="text-slate-400">Fastest Correct</div>
      <div className="text-4xl font-black mt-3">{
analysis.timeStats
 ?.fastestCorrect || 0
}s</div>
    </div>

    <div className="rounded-2xl border border-cyan-500/20 p-5">
      <div className="text-slate-400">Slowest Question</div>
      <div className="text-4xl font-black mt-3">{
analysis.timeStats
 ?.slowestQuestion || 0
}s</div>
    </div>

    <div className="rounded-2xl border border-red-500/20 p-5">
      <div className="text-slate-400">Time On Wrongs</div>
      <div className="text-4xl font-black mt-3 text-red-300">
        {Math.round(
 (
  analysis.timeStats
   ?.timeOnWrongs || 0
 ) / 60
)}m
      </div>
    </div>

  </div>

</div>

{/* BUTTONS */}

<div className="flex flex-wrap gap-4 mt-10">

  <button
    onClick={onViewDiagnosis}
    className="
      px-8 py-4
      rounded-2xl
      bg-orange-500
      hover:bg-orange-400
      font-bold
      transition
    "
  >
    Detailed Analysis
  </button>

  

  <button
  onClick={() => {
    window.location.href = "/?view=cat";
  }}
  className="
px-8
py-4
rounded-2xl
bg-emerald-600
hover:bg-emerald-500
text-white
font-bold
transition-all
duration-200
shadow-lg
shadow-emerald-500/20
"
>
  Back to Dashboard
</button>

</div>
</div>

    </div>
    </div>
  
  );
}