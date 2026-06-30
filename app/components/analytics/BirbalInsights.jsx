"use client";

import {
  Sparkles,
  Target,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export default function BirbalInsights({ insights }) {
  if (!insights) return null;

  return (
    <div className="mt-12 rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-8">

      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="w-8 h-8 text-cyan-400" />
        <div>
          <h2 className="text-3xl font-bold text-white">
            Birbal's Intelligence Report
          </h2>

          <p className="text-slate-400">
            AI-powered diagnosis of your reading behaviour.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-800/60 p-6 mb-8">
        <p className="text-slate-200 leading-8">
          {insights.summary}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              Strengths
            </h3>
          </div>

          <ul className="space-y-3">
            {insights.strengths?.map((item, i) => (
              <li
                key={i}
                className="text-slate-300"
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" />
            <h3 className="text-xl font-bold text-white">
              Improvement Areas
            </h3>
          </div>

          <ul className="space-y-3">
            {insights.weaknesses?.map((item, i) => (
              <li
                key={i}
                className="text-slate-300"
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="mt-8 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-6">

        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-cyan-400" />
          <h3 className="text-xl font-bold text-white">
            Birbal's Advice
          </h3>
        </div>

        <ul className="space-y-3">
          {insights.recommendations?.map((item, i) => (
            <li
              key={i}
              className="text-slate-300"
            >
              • {item}
            </li>
          ))}
        </ul>

      </div>

    </div>
  );
}