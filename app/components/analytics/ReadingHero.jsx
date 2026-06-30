"use client";

import { Trophy, Brain, Target, TrendingUp } from "lucide-react";

export default function ReadingHero({ stats }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-10 mb-10">

      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute left-0 bottom-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative">

        <div className="flex items-center gap-3 mb-2">
          <Brain className="text-cyan-400" size={36} />
          <h1 className="text-5xl font-black text-white">
            Reading Intelligence
          </h1>
        </div>

        <p className="text-slate-400 text-lg mb-10">
          Your complete cognitive reading profile across official CAT papers.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6">
            <Trophy className="text-yellow-400 mb-4" />
            <div className="text-5xl font-black text-white">
              {stats.tests}
            </div>
            <div className="text-slate-400 mt-2">
              Tests Attempted
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6">
            <Target className="text-green-400 mb-4" />
            <div className="text-5xl font-black text-white">
              {stats.accuracy}%
            </div>
            <div className="text-slate-400 mt-2">
              Accuracy
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6">
            <TrendingUp className="text-cyan-400 mb-4" />
            <div className="text-5xl font-black text-white">
              {stats.score}
            </div>
            <div className="text-slate-400 mt-2">
              Total Score
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6">
            <Brain className="text-purple-400 mb-4" />
            <div className="text-5xl font-black text-white">
              {stats.rciq}
            </div>
            <div className="text-slate-400 mt-2">
              Reading IQ
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}