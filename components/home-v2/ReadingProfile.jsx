"use client";
import Image from "next/image";

import {
  Brain,
  Activity,
  Gauge,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function ReadingProfile({
  stats,
  dna,
  skills,
  insight,
}) {

    const hasProfile =
  (stats?.accuracy ?? 0) > 0 ||
  (stats?.speed ?? 0) > 0 ||
  (skills?.filter(s => s.total > 0).length ?? 0) > 0;

  return (
    <section className="space-y-4">

      {/* Heading */}

      <div className="flex items-center justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">

            <Brain className="h-4 w-4" />

            Reading Profile

          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            Know Yourself As A Reader
          </h2>

        </div>

      </div>

      <Card className="rounded-3xl border border-slate-800 bg-slate-900">

        <CardContent className="p-6">

          {/* ================= TOP ================= */}

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Reader DNA */}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">

                <Brain className="h-7 w-7 text-violet-300" />

              </div>

              <div>

                <div className="text-2xl font-bold text-white">

                 {hasProfile ? dna?.type : "Reading DNA Not Discovered"}

                </div>

                <p className="mt-1 text-sm text-slate-400">

               {hasProfile
  ? dna?.description
  : "Complete your first Daily Workout or RC Practice to discover your Reading DNA."}

                </p>

              </div>

            </div>

            {/* Reading IQ */}

            <div className="flex items-center gap-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-6 py-4">

              <div>

                <div className="text-xs uppercase tracking-wider text-violet-300">
                  Reading IQ
                </div>

                <div className="mt-1 text-4xl font-black text-white">
               {hasProfile ? stats?.iq : "Unlock"}
                </div>

              </div>

              <ChevronRight className="h-6 w-6 text-violet-300" />

            </div>

          </div>

          {/* ================= QUICK STATS ================= */}

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">

            <MiniStat
              icon={<Target className="h-4 w-4 text-green-400" />}
              label="Accuracy"
             value={hasProfile ? `${stats?.accuracy}%` : "--"}
            />

            <MiniStat
              icon={<Gauge className="h-4 w-4 text-cyan-400" />}
              label="Speed"
             value={hasProfile ? `${stats?.speed} WPM` : "--"}
            />

            <MiniStat
              icon={<Activity className="h-4 w-4 text-orange-400" />}
              label="RC Score"
             value={hasProfile ? `${stats?.score}/100` : "--"}
            />

            <MiniStat
              icon={<Sparkles className="h-4 w-4 text-violet-400" />}
              label="Skills"
             value={
  hasProfile
    ? skills.filter(s => s.total > 0).length
    : "--"
}
            />

          </div>

          {/* Skill Map + Birbal starts below */}
          {/* ================= BOTTOM ================= */}

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">

            {/* RC Skill Map */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-semibold text-white">
                    RC Skill Map
                  </h3>

                  <p className="text-sm text-slate-500">
                    Performance across question types
                  </p>

                </div>

              </div>

            {skills.filter(s => s.total > 0).length === 0 ? (

                <div className="rounded-xl border border-slate-800 bg-slate-900 py-8 text-center text-slate-500">

                  Solve a few RC passages to unlock your profile.

                </div>

              ) : (

                <div className="space-y-4">

                  {skills
                    .filter((s) => s.total > 0)
                    .sort((a, b) => b.accuracy - a.accuracy)
                    .map((skill, index) => (

                      <SkillBar
                        key={index}
                        label={prettyLabel(skill.type)}
                        value={skill.accuracy}
                        total={skill.total}
                      />

                    ))}

                </div>

              )}

            </div>

            {/* Birbal Assessment */}

            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-slate-950 p-5">

              <div>

                <h3 className="text-lg font-semibold text-white">
                 Birbal Assessment
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  AI-powered diagnosis of your reading behaviour.
                </p>

              </div>

             {!hasProfile ? (

<div className="mt-6 rounded-xl bg-slate-900 p-5 text-center">

<div className="mb-5 flex justify-center">
  <div className="rounded-full bg-violet-500/10 p-2 ring-2 ring-violet-500/20">
    <Image
      src="/birbal.png"
      alt="Birbal"
      width={70}
      height={70}
      className="rounded-full"
    />
  </div>
</div>

<h4 className="text-lg font-semibold text-white">
Birbal hasn't analysed you yet.
</h4>

<p className="mt-3 text-sm leading-7 text-slate-400">

Complete your first Daily Workout or RC Practice.

<br /><br />

Birbal will automatically discover:

<br /><br />

✅ Reading IQ

<br />

✅ Reader Type

<br />

✅ Strongest Skill

<br />

✅ Weakest Skill

<br />

✅ Personal Improvement Plan

</p>

</div>

) : (

<div className="mt-6 space-y-5">

  <div className="rounded-xl bg-slate-900 p-4">

    <div className="text-xs font-semibold uppercase tracking-wider text-green-400">
      Strength
    </div>

    <div className="mt-2 text-white font-semibold">
      {insight?.strength}
    </div>

  </div>

  <div className="rounded-xl bg-slate-900 p-4">

    <div className="text-xs font-semibold uppercase tracking-wider text-red-400">
      Weakness
    </div>

    <div className="mt-2 text-white font-semibold">
      {insight?.weakness}
    </div>

  </div>

  <div className="rounded-xl bg-slate-900 p-4">

    <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
      This Week's Focus
    </div>

    <p className="mt-2 text-sm leading-6 text-slate-300">
      {insight?.advice}
    </p>

  </div>

</div>

)}
<div>

              </div>

            </div>

          </div>
          </CardContent>
      </Card>
    </section>
  );
}

/* ================= MINI STAT ================= */

function MiniStat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">

      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide">

        {icon}

        <span>{label}</span>

      </div>

      <div className="mt-2 text-xl font-bold text-white">
        {value}
      </div>

    </div>
  );
}

/* ================= SKILL BAR ================= */

function SkillBar({ label, value, total }) {

  return (

    <div className="space-y-2">

      <div className="flex items-center justify-between">

        <div className="font-medium text-white">

          {label}

        </div>

        <div className="text-sm text-slate-400">

          {value}% • {total} Q

        </div>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">

        <div
          className={`h-full rounded-full ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />

      </div>

    </div>

  );

}

/* ================= LABELS ================= */

function prettyLabel(type) {

  const map = {

    "main-idea": "Main Idea",

    detail: "Details",

    inference: "Inference",

    tone: "Tone",

    purpose: "Author Purpose",

    assumption: "Assumption",

    "next-paragraph": "Next Paragraph",

    function: "Function",

    "author-agreement": "Author Agreement",

  };

  return map[type] || type;

}

/* ================= COLORS ================= */

function getColor(value) {

  if (value >= 80) return "bg-green-500";

  if (value >= 65) return "bg-cyan-500";

  if (value >= 50) return "bg-yellow-500";

  return "bg-red-500";

}