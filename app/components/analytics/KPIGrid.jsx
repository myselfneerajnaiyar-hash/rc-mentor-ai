"use client";
import { calculateReadingIQ } from "../../../lib/readingIQ";

import {
  Brain,
  Target,
 Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Trophy,
  TrendingUp,
} from "lucide-react";

export default function KPIGrid({
  attempts,
  totalQuestions,
  totalCorrect,
  totalWrong,
  avgTime,
}) {

  const totalTests = attempts.length;

  const avgAccuracy =
    totalQuestions === 0
      ? 0
      : Math.round((totalCorrect / totalQuestions) * 100);

  const totalScore = attempts.reduce(
    (sum, t) => sum + (t.score || 0),
    0
  );

  const avgScore =
    totalTests === 0
      ? 0
      : Math.round(totalScore / totalTests);

  const rciq =
  attempts.length === 0
    ? 0
    : Math.round(
        attempts.reduce(
          (sum, t) => sum + calculateReadingIQ(t),
          0
        ) / attempts.length
      );

  const cards = [
    {
      icon: Brain,
      value: rciq,
      label: "Reading IQ",
      color: "text-cyan-400",
    },
    {
      icon: Target,
      value: avgAccuracy + "%",
      label: "Accuracy",
      color: "text-green-400",
    },
    {
      icon: Trophy,
      value: avgScore,
      label: "Average Score",
      color: "text-yellow-400",
    },
    {
      icon: TrendingUp,
      value: totalTests,
      label: "Tests",
      color: "text-blue-400",
    },
    {
      icon: Clock,
      value: avgTime + "s",
      label: "Average Time",
      color: "text-orange-400",
    },
    {
      icon: FileText,
      value: totalQuestions,
      label: "Questions",
      color: "text-purple-400",
    },
    {
      icon: CheckCircle2,
      value: totalCorrect,
      label: "Correct",
      color: "text-emerald-400",
    },
    {
      icon: XCircle,
      value: totalWrong,
      label: "Wrong",
      color: "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

      {cards.map((card, index) => {

        const Icon = card.icon;

        return (
          <div
            key={index}
            className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6 hover:border-cyan-500 transition-all duration-300 hover:-translate-y-1"
          >
            <Icon
              size={30}
              className={`${card.color} mb-5`}
            />

            <div className="text-4xl font-black text-white">
              {card.value}
            </div>

            <div className="text-slate-400 mt-2">
              {card.label}
            </div>
          </div>
        );

      })}

    </div>
  );
}