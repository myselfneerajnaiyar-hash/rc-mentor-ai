"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link"


import {
  Brain,
  Clock3,
  FileText,
  ShieldAlert,
  Target,
  Flame,
  Trophy,
  ChevronRight,
} from "lucide-react";

export default function DailyChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyAttempted,
  setAlreadyAttempted] =
  useState(false);

  useEffect(() => {

  async function loadChallenge() {

    try {

      const response =
        await fetch(
          "/api/get-daily-rc"
        );

      const data =
        await response.json();

      setChallenge(
        data.challenge
      );

      const user =
        await supabase.auth.getUser();

      if (
        user.data.user &&
        data.challenge
      ) {

        const { data: attempt } =
          await supabase
            .from(
              "daily_rc_attempts"
            )
            .select("id")
            .eq(
              "user_id",
              user.data.user.id
            )
            .eq(
              "daily_rc_set_id",
              data.challenge.id
            )
            .maybeSingle();

        if (attempt) {
          setAlreadyAttempted(
            true
          );
        }
      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  }

  loadChallenge();

}, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071120] flex items-center justify-center text-white">
        <div className="text-3xl font-black animate-pulse">
          Loading Daily RC...
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#071120] flex items-center justify-center text-red-400 text-2xl font-bold">
        Failed to load challenge
      </div>
    );
  }

  const title = challenge.title || "CAT 2023 Slot 3 RC";

  const timer = challenge.timer_minutes || 8;

  const source = challenge.source_year || "CAT 2023";

  const questionCount = challenge.questions?.length || 4;

  return (
    <div className="min-h-screen bg-[#071120] text-white px-4 md:px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* TOP BAR */}

        <div className="flex items-center justify-between">

          <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 backdrop-blur-xl">
            <div className="text-sm font-semibold text-cyan-100 tracking-wide">
              DAILY RC ARENA
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

            <span className="text-sm text-white font-semibold">
              Built for 99%ilers
            </span>
          </div>

        </div>

        <div className="flex items-center justify-between mb-8">
  <Link href="/">
    <div className="flex items-center gap-3 cursor-pointer">
      <img
        src="/logo.png"
        className="w-8 h-8"
      />

      <div>
        <div className="font-bold text-white">
          Auctor RC
        </div>

        <div className="text-xs text-slate-400">
          Daily Arena
        </div>
      </div>
    </div>
  </Link>

  <Link href="/">
    <button
      className="
      px-4 py-2
      rounded-xl
      bg-slate-800
      text-white
      hover:bg-slate-700
      "
    >
      Dashboard
    </button>
  </Link>
</div>

        {/* HERO */}

        <Card className="overflow-hidden rounded-[34px] border border-cyan-500/20 bg-gradient-to-br from-cyan-950 via-slate-900 to-black shadow-[0_0_120px_rgba(34,211,238,0.20)]">

          <CardContent className="p-8 md:p-10">

            {/* BADGE */}

            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-5 py-2 backdrop-blur-xl">
              <div className="w-2 h-2 rounded-full bg-cyan-300" />

              <span className="text-sm font-semibold text-cyan-100">
                Elite CAT RC Simulation
              </span>
            </div>

            {/* TITLE */}

            <div className="mt-8 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">

  <div className="flex-1">

    <h1 className="text-5xl md:text-7xl font-black leading-none text-white">
      {title}
    </h1>

    <p className="mt-4 max-w-3xl text-slate-200 text-lg leading-relaxed">
      Elite reading comprehension training engineered to simulate
      CAT-level pressure, inference traps and comprehension
      breakdowns.
    </p>

    <div className="mt-4 flex items-center gap-6">

      <div>
        <div className="text-slate-400 text-sm">
          Avg completion
        </div>

        <div className="text-2xl font-black text-white">
          6m 48s
        </div>
      </div>

    </div>

  </div>

  <div className="flex flex-col items-end gap-4 w-auto">

{
  alreadyAttempted ? (

   <div className="flex gap-3">

  <Link href="/daily-challenge/result">

    <button
      className="
      h-20
      px-10
      rounded-2xl
      bg-emerald-600
      text-white
      font-black
      text-2xl
      "
    >
      View Report →
    </button>

  </Link>

  <Link href="/rc-history">

    <button
      className="
      h-20
      px-8
      rounded-2xl
      border
      border-cyan-400/30
      bg-cyan-500/10
      text-cyan-300
      font-black
      text-xl
      "
    >
      📚 History
    </button>

  </Link>

</div>
  ) : (

    <Link
      href="/daily-challenge/instructions"
    >

      <button
        className="
        h-20
        w-full
        rounded-2xl
        bg-gradient-to-r
        from-violet-500
        via-blue-500
        to-cyan-400
        text-white
        font-black
        text-3xl
        shadow-[0_0_50px_rgba(59,130,246,0.55)]
        hover:scale-105
        transition-all
        duration-300
        flex
        items-center
        justify-center
        shrink-0
        "
      >
        Enter Arena →
      </button>

    </Link>

  )
}
    <div className="text-right">
      <div className="text-lg font-bold text-white">
        Inference-heavy RC challenge
      </div>

      <div className="text-slate-400 text-sm">
        Built for pressure-tested reading
      </div>
    </div>

  </div>

</div>

            <Card className="rounded-[32px] border border-orange-500/30 bg-gradient-to-r from-orange-500/15 to-amber-500/10 shadow-xl">

<CardContent className="p-8">

<div className="text-orange-300 text-sm uppercase tracking-[0.25em] font-black">
Today's Mission
</div>

<div className="mt-4 text-3xl font-black text-white">
Avoid Scope Distortion Traps
</div>

<p className="mt-4 text-slate-300 leading-8 text-lg">
Track the author's actual position before touching the options.
Most students lose marks by choosing an option that sounds correct
but falls outside the author's scope.
</p>

</CardContent>

</Card>

            {/* STATS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">

              {/* QUESTIONS */}

              <Card className="rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/15 backdrop-blur-xl shadow-xl">

                <CardContent className="p-6 space-y-5">

                  <div className="flex items-center justify-between">

                    <div className="text-cyan-200 text-xs uppercase tracking-[0.2em] font-bold">
                      Questions
                    </div>

                    <FileText className="w-5 h-5 text-cyan-300" />

                  </div>

                  <div className="text-5xl font-black text-white">
                    {questionCount}
                  </div>

                </CardContent>

              </Card>

              {/* TIME */}

              <Card className="rounded-3xl border border-violet-400/10 bg-gradient-to-br from-violet-500/20 to-indigo-500/15 backdrop-blur-xl shadow-xl">

                <CardContent className="p-6 space-y-5">

                  <div className="flex items-center justify-between">

                   <div className="text-white text-xs uppercase tracking-[0.2em] font-bold">
                      Time
                    </div>

                    <Clock3 className="w-5 h-5 text-white" />

                  </div>

                  <div className="text-5xl font-black text-white drop-shadow-lg">
                    {timer}
                    <span className="text-2xl ml-2 text-slate-400">
                      min
                    </span>
                  </div>

                </CardContent>

              </Card>

              {/* SOURCE */}

              <Card className="rounded-3xl border border-emerald-400/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/15 backdrop-blur-xl shadow-xl">

                <CardContent className="p-6 space-y-5">

                  <div className="flex items-center justify-between">

                    <div className="text-emerald-200 text-xs uppercase tracking-[0.2em] font-bold">
                      Source
                    </div>

                    <Trophy className="w-5 h-5 text-emerald-300" />

                  </div>

                  <div className="text-4xl font-black text-white">
                    {source}
                  </div>

                </CardContent>

              </Card>

            </div>

           

          

          </CardContent>

        </Card>

     <Card className="rounded-[32px] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 shadow-xl">

<CardContent className="p-8">

<div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
Challenge Rewards
</div>

<h2 className="mt-4 text-4xl font-black text-white">
Complete Attempt Unlocks
</h2>

<div className="grid md:grid-cols-2 gap-4 mt-8">

<div className="
rounded-2xl
bg-slate-900/80
border
border-slate-700
p-5
text-white
font-bold
text-lg
flex
items-center
gap-3
">
🏆 Leaderboard Ranking
</div>


<div className="
rounded-2xl
bg-slate-900/80
border
border-slate-700
p-5
text-white
font-bold
text-lg
flex
items-center
gap-3
">
🧠 Cognitive Diagnosis
</div>

<div className="
rounded-2xl
bg-slate-900/80
border
border-slate-700
p-5
text-white
font-bold
text-lg
flex
items-center
gap-3
">
📖 Detailed Review
</div>

<div className="
rounded-2xl
bg-slate-900/80
border
border-slate-700
p-5
text-white
font-bold
text-lg
flex
items-center
gap-3
">
🎯 Trap Analysis
</div>

<div className="
rounded-2xl
bg-slate-900/80
border
border-slate-700
p-5
text-white
font-bold
text-lg
flex
items-center
gap-3
">
📚 Vocabulary Intelligence
</div>

<div className="
rounded-2xl
bg-slate-900/80
border
border-slate-700
p-5
text-white
font-bold
text-lg
flex
items-center
gap-3
">
⚡ Reading Psychology
</div>

</div>

</CardContent>

</Card>

          

      </div>
    </div>
  );
}