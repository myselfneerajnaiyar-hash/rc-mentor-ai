"use client";

import { Brain, Flame, Gauge, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import BirbalCoachCard from "@/components/BirbalCoachCard";

const statCards = [
  {
    icon: Brain,
    label: "Reading IQ",
    value: (stats) => stats?.iq ?? "--",
    color: "text-violet-400",
  },
  {
    icon: Target,
    label: "Accuracy",
    value: (stats) => `${stats?.accuracy ?? "--"}%`,
    color: "text-emerald-400",
  },
  {
    icon: Gauge,
    label: "Speed",
    value: (stats) => `${stats?.speed ?? "--"} WPM`,
    color: "text-sky-400",
  },
  {
    icon: Flame,
    label: "Streak",
    value: (_, streak) => `${streak} Days`,
    color: "text-orange-400",
  },
];

export default function Header({
  user,
  userName,
  greeting,
  examDisplayName,
  coach,
  stats,
  streak,
  startAdaptiveRC,
  startTour,
  setView,
}) {
  return (
    <div className="space-y-6">

      {/* Greeting */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

       <div className="space-y-3">

  <div className="flex flex-wrap items-center justify-between gap-4">

    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
      {greeting},{" "}
      <span className="brand-primary-text">
        {userName || "Champion"}
      </span>{" "}
      👋
    </h1>

   <Button
  onClick={startTour}
  className="
    rounded-full
    h-10
    px-5
    border
    border-violet-500/30
    bg-violet-500/5
    text-violet-200
    hover:text-violet-200
    hover:bg-violet-500/15
    hover:border-violet-400
    transition-all
"
>
  ✨ Product Tour
</Button>
  </div>

  <p className="text-slate-400 text-base md:text-lg max-w-xl">
    Become a better reader every single day.
  </p>

  <div className="flex flex-wrap gap-3">

            <div className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-200">
              {examDisplayName}
            </div>

            <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-200">
              🔥 {streak} Day Streak
            </div>

          </div>

        </div>

        {!user && (
          <Button
            onClick={() => setView("login")}
            className="rounded-xl px-6"
          >
            Login
          </Button>
        )}

      </div>

      {/* Compact Stats */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-4 transition-all duration-300 hover:border-indigo-400/40 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-slate-900/60 p-2">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>

                <div>

                  <div className="text-xl font-bold text-white">
                    {item.value(stats, streak)}
                  </div>

                  <div className="text-xs text-slate-400">
                    {item.label}
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>
      {/* Optional CTA for guests */}

      {!user && (
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h3 className="text-lg font-semibold text-white">
                Start your AI-powered VARC journey
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Practice smarter with Daily RC, AI tools and Birbal Coach.
              </p>
            </div>

            <Button
              onClick={() => setView("login")}
              className="rounded-xl px-6"
            >
              Get Started
            </Button>

          </div>
        </div>
      )}

      {/* Birbal Coach Card */}
      {/* 
         Birbal has been intentionally removed from the header.
         It will become its own dedicated homepage section:
         Reading Diagnosis
         Recommendations
         Talk to Birbal
      */}

    </div>
  );
}
