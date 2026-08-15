"use client";
import { useRouter } from "next/navigation";

import {
  Sparkles,
  BookOpen,
  Zap,
  Newspaper,
  Target,
  ArrowRight,
  Crown,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PremiumFeatures({
  setView,
  startAdaptiveRC,
  instituteAccess = false,
}) {

    const router = useRouter();
  return (
    <section className="pt-12 pb-6">

      {/* Heading */}

      <div className="mb-10">

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">

          <Crown className="h-4 w-4" />

          {instituteAccess ? "Institute Access" : "Premium AI Features"}

        </div>

        <h2 className="mt-4 text-4xl font-bold text-white">
          {instituteAccess ? "Your Premium AI Tools" : "Unlock 5 Premium AI Tools"}
        </h2>

        <p className="mt-3 max-w-3xl text-lg text-slate-400">
          Generate unlimited RCs, decode editorials, train your speed, build vocabulary and master your weak areas.
        </p>

      </div>

      {/* Hero Card */}

      <div 
      id="rc-generator"
      className="mb-6 overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900">
<div className="grid items-center gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">

          {/* Left */}

          <div>

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">

              <Sparkles className="h-8 w-8 text-violet-300" />

            </div>

            <h3 className="text-3xl font-bold text-white">
              AI RC Generator
            </h3>

            <p className="mt-4 text-slate-300 leading-7">
              Instantly generate unlimited CAT-level Reading Comprehension
              passages with customizable topics, difficulty levels and passage
              lengths.
            </p>

          <Button
  onClick={() => {
  setView("rc");
  startAdaptiveRC();
}}
  className="mt-6 h-11 rounded-xl bg-violet-600 px-6 hover:bg-violet-500"
>
  ✨ Generate New RC

              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

          </div>

          {/* Mock Interface */}

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">

            <div className="mb-6 text-lg font-semibold text-white">
              Generate New Passage
            </div>

            <div className="flex flex-wrap gap-3">

              <div className="rounded-full bg-violet-500/15 px-4 py-2 text-sm text-violet-300">
                Difficulty: CAT
              </div>

              <div className="rounded-full bg-blue-500/15 px-4 py-2 text-sm text-blue-300">
                Topic: Philosophy
              </div>

              <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-300">
                Length: Medium
              </div>

              <div className="rounded-full bg-orange-500/15 px-4 py-2 text-sm text-orange-300">
                Questions: 6
              </div>

            </div>

            <div className="mt-8 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-5 text-center text-violet-200">

              ✨ AI will create a brand-new passage in seconds.

            </div>

          </div>
          </div>
          </div>
          {/* Premium Tools Grid */}


      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

        {/* Vocabulary Lab */}

        <div
        id="vocab-lab"
          onClick={() => setView("vocab")}
          className="group cursor-pointer rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl"
        >

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
            <BookOpen className="h-7 w-7 text-emerald-300" />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Vocabulary Lab
          </h3>

          <p className="mt-2 text-slate-400">
            Master high-frequency words with AI-curated learning sessions and
            smart revision.
          </p>

        </div>

        {/* Speed Drills */}

        <div
        id="speed-drill"
          onClick={() => setView("speed")}
          className="group cursor-pointer rounded-3xl border border-orange-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl"
        >

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
            <Zap className="h-7 w-7 text-orange-300" />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Speed Drills
          </h3>

          <p className="mt-2 text-slate-400">
            Train your reading speed and comprehension with adaptive timed
            exercises.
          </p>

        </div>

        {/* Editorial Decoder */}

        <div
        id="editorial"
         onClick={() => router.push("/birbal-v2")}
          className="group cursor-pointer rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl"
        >

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15">
            <Newspaper className="h-7 w-7 text-cyan-300" />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Birbal Editorial
          </h3>

          <p className="mt-2 text-slate-400">
            Understand difficult editorials with AI explanations, summaries and
            vocabulary support.
          </p>

        </div>

        {/* Precision Training */}

        <div
        id="precision"
          onClick={() => setView("precision")}
          className="group cursor-pointer rounded-3xl border border-rose-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-xl"
        >

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15">
            <Target className="h-7 w-7 text-rose-300" />
          </div>

          <h3 className="text-xl font-semibold text-white">
            Precision Training
          </h3>

          <p className="mt-2 text-slate-400">
            Improve your weakest question types with focused AI-powered
            practice.
          </p>

        </div>
        </div>
    

    
      </section>
      );
    }
