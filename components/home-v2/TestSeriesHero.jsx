"use client";
import { useRouter } from "next/navigation";

import {
  Trophy,
  Brain,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function TestSeriesHero({setView, instituteAccess = false}) {

    const router = useRouter();
  return (
    <section className="py-8">

      {/* Heading */}

      <div className="mb-6">

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">

          <Trophy className="h-4 w-4" />

          AI Powered VARC Test Series

        </div>

        <h2 className="mt-4 text-4xl font-bold text-white">
          Train Like The Real CAT
        </h2>

        <p className="mt-3 max-w-3xl text-lg text-slate-400">
          Attempt official CAT PYQs and AI-created mock tests with detailed
          diagnosis, mentor verdict and cognitive analysis after every test.
        </p>

      </div>

      {/* Hero */}

    <div
    id="sectionals"
  onClick={() => setView("cat")}
  className="cursor-pointer overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900"
>

        <div className="grid items-center gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">

          {/* Left */}

          <div>

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15">

              <Trophy className="h-8 w-8 text-cyan-300" />

            </div>

            <h3 className="text-3xl font-bold text-white">
              CAT VARC Test Series
            </h3>

            <p className="mt-4 leading-7 text-slate-300">
              Practice under real exam conditions with official CAT papers and
              AI-generated mock tests that closely simulate the latest CAT VARC
              pattern.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
                24 Official CAT PYQs
              </div>

              <div className="rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                10 AI Mock Tests
              </div>

              <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                {instituteAccess ? "Included by your institute" : "₹799 One Time"}
              </div>

            </div>

           <Button
  onClick={() => setView("cat")}
  className="mt-6 h-11 rounded-xl bg-cyan-500 px-6 font-semibold text-slate-900 hover:bg-cyan-400"
>

              Explore Test Series

              <ArrowRight className="ml-2 h-4 w-4" />

            </Button>

          </div>

          {/* Right Side */}

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">

            <div className="mb-5 flex items-center justify-between">

              <h4 className="text-lg font-semibold text-white">
                AI Report Preview
              </h4>

              <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                Sample
              </div>

            </div>

            <div className="space-y-4">

              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">

                <div className="flex items-center gap-3">

                  <Brain className="h-5 w-5 text-violet-300" />

                  <span className="text-slate-200">
                    Mentor Verdict
                  </span>

                </div>

                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">

                <div className="flex items-center gap-3">

                  <BarChart3 className="h-5 w-5 text-cyan-300" />

                  <span className="text-slate-200">
                    Cognitive Diagnosis
                  </span>

                </div>

                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">

                <div className="flex items-center gap-3">

                  <Sparkles className="h-5 w-5 text-amber-300" />

                  <span className="text-slate-200">
                    Performance Analytics
                  </span>

                </div>

                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

              </div>
              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 p-5">

                <div className="text-sm font-semibold text-cyan-300">
                  Included with every test
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">

                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    AI Mentor Verdict
                  </div>

                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Cognitive Diagnosis
                  </div>

                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Detailed Review
                  </div>

                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Performance Analytics
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Bottom Feature Strip */}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-3xl font-bold text-cyan-300">
            24
          </div>

          <div className="mt-2 text-white font-semibold">
            Official CAT PYQs
          </div>

          <p className="mt-1 text-sm text-slate-400">
            CAT 2020–2025 papers with complete analysis.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-3xl font-bold text-violet-300">
            10
          </div>

          <div className="mt-2 text-white font-semibold">
            AI Mock Tests
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Fresh CAT-level mocks generated by Auctor AI.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-3xl font-bold text-emerald-300">
            AI
          </div>

          <div className="mt-2 text-white font-semibold">
            Smart Diagnosis
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Discover exactly why you lose marks.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-600 to-blue-700 p-5">

          <div className="text-sm font-semibold text-cyan-100">
            {instituteAccess ? "Institute Access" : "Launch Price"}
          </div>

          <div className="mt-2 text-4xl font-black text-white">
            {instituteAccess ? "Included" : "₹799"}
          </div>

          <div className="mt-1 text-cyan-100 text-sm">
            {instituteAccess ? "Full CAT access" : "One-Time Purchase"}
          </div>

         <Button
  onClick={(e) => {
    e.stopPropagation();
    instituteAccess ? setView("cat") : router.push("/pricing");
  }}
  className="mt-5 w-full rounded-xl bg-white text-cyan-700 hover:bg-slate-100 font-semibold"
>
  {instituteAccess ? "Start Practising" : "Buy Now"}
</Button>

        </div>

      </div>

    </section>
  );
}
