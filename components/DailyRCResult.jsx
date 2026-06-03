"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-[#071120] text-white">

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
  <Link href="/daily-challenge">
    <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
      <ArrowLeft size={18} />
      Back to Arena
    </button>
  </Link>
</div>

        {/* HERO */}

        <div className="rounded-[36px] border border-cyan-500/20 bg-gradient-to-br from-cyan-950 via-slate-900 to-black p-10">

          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300 font-bold">
            Daily RC Arena
          </div>

          <h1 className="text-6xl font-black mt-4">
            RC Diagnosis Report
          </h1>

          <div className="grid md:grid-cols-2 gap-12 mt-10">

            {/* LEFT */}

            <div>

              <div className="text-slate-400 text-sm uppercase">
                CAT Score
              </div>

             <div
  className={`
    text-8xl
    font-black
    mt-2
    ${score < 0
      ? "text-red-400"
      : "text-emerald-400"}
  `}
>
  {score}
</div>

              <div
                className={`inline-flex mt-6 px-5 py-2 rounded-full border font-bold ${badgeColor}`}
              >
                {badge}
              </div>

            </div>

            {/* RIGHT */}

            <div className="grid grid-cols-2 gap-5">

              <MetricCard
  title="Accuracy"
  value={`${accuracy}%`}
/>

<MetricCard
  title="Time Used"
  value={`${Math.floor(
    timeUsed / 60
  )}m ${timeUsed % 60}s`}
/>

<MetricCard
  title="CAT Score"
  value={score}
/>

<MetricCard
  title="Composite Score"
  value={composite}
/>

            </div>

          </div>

        </div>

       

        {/* STATS */}

        <div className="grid md:grid-cols-4 gap-5 mt-8">

          <StatCard
            title="Attempted"
            value={resultData?.attempted}
          />

          <StatCard
            title="Correct"
            value={resultData?.correct}
          />

          <StatCard
            title="Incorrect"
            value={resultData?.incorrect}
          />

          <StatCard
            title="Unanswered"
            value={resultData?.unanswered}
          />

        </div>

        {/* MENTOR */}

        <Card className="mt-8 bg-orange-500/10 border-orange-500/30">

          <CardContent className="p-8">

            <div className="text-orange-300 font-black text-xl">
              Strategic Mentor Insight
            </div>

            <p className="mt-4 text-slate-200 leading-8 text-lg">
              {mentorText}
            </p>

          </CardContent>

        </Card>

        <Card className="rounded-3xl border border-cyan-500/20 bg-slate-900/50 p-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em]">
    Performance Profile
  </div>

  <div className="mt-4 text-4xl font-black text-white">
    {profile}
  </div>

  <div className="mt-4 text-slate-300 leading-7">
    {profileDescription}
  </div>

</Card>

        {/* LEADERBOARD */}

        <Card className="mt-8 bg-cyan-500/10 border-cyan-500/30">

          <CardContent className="p-8">

            <div className="text-cyan-300 text-xl font-black">
              Leaderboard Impact
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">

              <div>

                <div className="text-slate-400">
                  CAT Score
                </div>

                <div className="text-5xl font-black mt-2 text-white">
                  {score}
                </div>

              </div>

             <div>
  <div className="text-sm text-slate-300">
    Composite Score
  </div>

  <div className="text-6xl font-black text-cyan-200 mt-3">
    {composite}
    <p className="mt-4 text-orange-400 text-sm">
Composite Score contributes to your RC Arena Championship Points.
</p>
  </div>
</div>
            </div>

            <p className="mt-6 text-slate-300 leading-7">
              Students are ranked first by CAT Score.
If CAT Scores are equal, faster completion results in a higher rank.
            </p>

          </CardContent>

        </Card>

        <Card className="mt-10 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-8">

<h3 className="text-purple-300 font-black text-xl">
Today's Mission
</h3>

<ul className="mt-4 space-y-3 text-slate-200">

<li>✓ Read author's conclusion before options</li>

<li>✓ Eliminate only after evidence</li>

<li>✓ Cap decision time at 90 seconds</li>

</ul>

</Card>

        {/* CTA */}

       <div className="grid md:grid-cols-2 gap-4 mt-10">

      <Link href="/cognition-diagnosis" className="w-full">
  <Button
    className="
      h-16
      w-full
      rounded-2xl
      bg-gradient-to-r
      from-violet-500
      to-pink-500
      text-white
      font-black
      text-lg
    "
  >
    Open Cognitive Diagnosis →
  </Button>
</Link>

<Link href="/detailed-review" className="w-full">
  <Button
    className="
      h-16
      w-full
      rounded-2xl
      bg-slate-900
      border
      border-cyan-500/30
      hover:bg-slate-800
      text-cyan-300
      font-black
      text-lg
    "
  >
    Open Detailed Review →
  </Button>
</Link>


        </div>

      </div>

    </div>
  );
}

function MetricCard({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-5">
      <div className="text-slate-400 text-sm">
        {title}
      </div>

      <div className="text-3xl font-black mt-2 text-white">
        {value}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}) {
  return (
    <Card className="bg-slate-900 border-slate-700">

      <CardContent className="p-6">

        <div className="text-slate-400 text-sm">
          {title}
        </div>

        <div className="text-5xl font-black mt-2 text-white">
          {value}
        </div>

      </CardContent>

    </Card>
  );
}