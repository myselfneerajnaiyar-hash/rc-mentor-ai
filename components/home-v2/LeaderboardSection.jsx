"use client";

import { useState } from "react";
import { Trophy, Flame, Puzzle, Crown } from "lucide-react";

import RCLeaderboard from "@/components/RCLeaderboard";
import Leaderboard from "@/components/Leaderboard";
import WordHuntLeaderboard from "@/components/WordHuntLeaderboard";
import WeeklyRCChallenge from "@/components/WeeklyRCChallenge";

export default function LeaderboardSection({exam}) {
    const isCAT = exam?.trim().toUpperCase() === "CAT";
const [activeTab, setActiveTab] = useState(
  exam?.trim().toUpperCase() === "CAT"
    ? "rc"
    : "workout"
);

  const tabs = isCAT
  ? [
      {
        id: "rc",
        label: "Daily RC",
        icon: Trophy,
        color: "text-cyan-300",
      },
      {
        id: "workout",
        label: "Workout",
        icon: Flame,
        color: "text-orange-300",
      },
      {
        id: "wordhunt",
        label: "Word Hunt",
        icon: Puzzle,
        color: "text-green-300",
      },
      {
        id: "champions",
        label: "Weekly Challenge",
        icon: Crown,
        color: "text-yellow-300",
      },
    ]
  : [
      {
        id: "workout",
        label: "Workout",
        icon: Flame,
        color: "text-orange-300",
      },
      {
        id: "wordhunt",
        label: "Word Hunt",
        icon: Puzzle,
        color: "text-green-300",
      },
    ];

  return (
    <section className="space-y-6">

      <div>

        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          <Trophy className="h-4 w-4" />
          Leaderboards
        </div>

        <h2 className="mt-4 text-4xl font-bold text-white">
          Compete With The Best
        </h2>

        <p className="mt-2 text-slate-400">
          Climb the rankings by solving Daily RCs, completing workouts and
          improving your vocabulary.
        </p>

      </div>

      {/* Tabs */}

      <div className="flex flex-wrap gap-3">

        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition-all ${
                activeTab === tab.id
                  ? "border-cyan-500 bg-cyan-500/15 text-white"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
              }`}
            >
              <Icon className={`h-4 w-4 ${tab.color}`} />
              {tab.label}
            </button>
          );
        })}

      </div>

      {/* Leaderboard */}

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

        {activeTab === "rc" && <RCLeaderboard />}

        {activeTab === "workout" && <Leaderboard />}

        {activeTab === "wordhunt" && <WordHuntLeaderboard />}

        {activeTab === "champions" && <WeeklyRCChallenge />}

      </div>

    </section>
  );
}
