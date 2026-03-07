"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

export default function DailyAnalytics({ user }) {
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState([])
  const [weekDelta, setWeekDelta] = useState(0)

  useEffect(() => {
    if (!user) return

    async function loadAnalytics() {
      const { data, error } = await supabase
        .from("workout_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(14)

      if (!error && data) {
        setAttempts(data)

        if (data.length >= 14) {
          const currentWeek = data.slice(0, 7)
          const prevWeek = data.slice(7, 14)

          const avgCurrent =
            currentWeek.reduce((a, b) => a + (b.accuracy || 0), 0) / 7

          const avgPrev =
            prevWeek.reduce((a, b) => a + (b.accuracy || 0), 0) / 7

          setWeekDelta(Number((avgCurrent - avgPrev).toFixed(2)))
        }
      }

      setLoading(false)
    }

    loadAnalytics()
  }, [user])

  if (loading) {
    return <div className="text-slate-400">Loading analytics...</div>
  }

  if (attempts.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
        Complete at least 2 workouts to unlock analytics.
      </div>
    )
  }

  const last7 = attempts.slice(0, 7).reverse()
  // 🔷 Consistency Calculation (Std Deviation Based)

const mean =
  last7.reduce((a, b) => a + Number(b.accuracy || 0), 0) /
  last7.length

const variance =
  last7.reduce(
    (sum, a) =>
      sum + Math.pow(Number(a.accuracy || 0) - mean, 2),
    0
  ) / last7.length

const stdDev = Math.sqrt(variance)

// Higher deviation → lower consistency
const consistency = Math.max(0, 100 - stdDev * 3)
// 🔷 Momentum (Change from first to last attempt in last7)

let momentum = 0

if (last7.length >= 2) {
  const first = Number(last7[0].accuracy || 0)
  const last = Number(last7[last7.length - 1].accuracy || 0)
  momentum = last - first
}


const chartData = last7.map((a, index) => {
  const acc = Number(a.accuracy || 0)

  const slice = last7.slice(0, index + 1)

  const rollingMean =
    slice.reduce((sum, x) => sum + Number(x.accuracy || 0), 0) /
    slice.length

  const rollingVariance =
    slice.reduce(
      (sum, x) =>
        sum +
        Math.pow(
          Number(x.accuracy || 0) - rollingMean,
          2
        ),
      0
    ) / slice.length

  const rollingStd = Math.sqrt(rollingVariance)

  return {
    date: new Date(a.completed_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    }),
    accuracy: acc,
    score: Number(Number(a.total_score || 0).toFixed(2)),
    upperBand: rollingMean + rollingStd,
    lowerBand: Math.max(0, rollingMean - rollingStd)
  }
})

  const latest = attempts[0]
  const totalAttempts = attempts.length
const DEV_FORCE_UNLOCK = true   // 👈 set to false later

const isAdvancedUnlocked =
  DEV_FORCE_UNLOCK || totalAttempts >= 14
 const avg7 =
  last7.length > 0
    ? last7.reduce((a, b) => a + Number(b.accuracy || 0), 0) /
      last7.length
    : 0

// 🔷 Advanced Metrics (Clean Logic Based on Last 7)

const recent = last7.map(a => Number(a.accuracy || 0))

// Acceleration
let acceleration = 0
if (recent.length >= 3) {
  const change1 = recent[recent.length - 1] - recent[recent.length - 2]
  const change2 = recent[recent.length - 2] - recent[recent.length - 3]
  acceleration = change1 - change2
}

// Projection (Simple Linear Trend)
let projectedChange = 0
if (recent.length >= 2) {
  const first = recent[0]
  const last = recent[recent.length - 1]
  const slope = (last - first) / (recent.length - 1)
  const projected = last + slope * 3
  projectedChange = projected - last
}

// Stability (reuse earlier stdDev logic but cleaner)
const stability =
  recent.length > 0
    ? Math.max(0, 100 - stdDev * 2)
    : 0

// 🔷 Skill Breakdown (Last 7 Attempts)

const skillKeys = [
  { key: "speed_score", label: "Speed" },
  { key: "vocab_score", label: "Vocabulary" },
  { key: "rc1_score", label: "RC 1" },
  { key: "rc2_score", label: "RC 2" },
  { key: "micro_score", label: "Micro Accuracy" }
]

const skillAnalytics = skillKeys.map(skill => {
  const values = last7.map(a => Number(a[skill.key] || 0))

  const avg =
    values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0

  const first = values[0] || 0
  const last = values[values.length - 1] || 0
  const momentum = last - first

  const variance =
    values.length > 0
      ? values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
      : 0

let stability = Math.max(0, 100 - Math.sqrt(variance) * 15)

// Penalize stability if average is low
if (avg < 3) {
  stability = stability * 0.6
}

  let level = "Beginner"
  if (avg > 7) level = "Elite"
  else if (avg > 5) level = "Strong"
  else if (avg > 3) level = "Developing"

  let priority = "Stable"
  if (avg < 3) priority = "Critical"
  else if (avg < 5) priority = "Moderate"

  return {
    label: skill.label,
    avg,
    momentum,
    stability,
    level,
    priority
  }
})

const strongestSkill = skillAnalytics.reduce((max, skill) =>
  skill.avg > max.avg ? skill : max
)

const weakestSkill = skillAnalytics.reduce((min, skill) =>
  skill.avg < min.avg ? skill : min
)

const improvementPotential =
  weakestSkill.avg < 5
    ? (5 - weakestSkill.avg) * 2
    : 0

 
  return (
    <div className="space-y-12">
       
      {/* 🔷 Top Metrics */}
     <div className="grid md:grid-cols-5 gap-6">
       <MetricCard
  title="Accuracy"
  value={`${Number(latest.accuracy || 0).toFixed(1)}%`}
/>
        <MetricCard title="7-Attempt Avg" value={`${avg7.toFixed(1)}%`} />
        <MetricCard
          title="Week-over-Week"
          value={`${weekDelta > 0 ? "+" : ""}${weekDelta}%`}
          accent={weekDelta >= 0 ? "text-green-400" : "text-red-400"}
        />
       <MetricCard
  title="Consistency"
  value={`${consistency.toFixed(0)}%`}
/>
<MetricCard
  title="Momentum"
  value={`${momentum > 0 ? "+" : ""}${momentum.toFixed(1)}%`}
  accent={
    momentum >= 0
      ? "text-emerald-400"
      : "text-red-400"
  }
/>


</div>

      {/* 🔷 Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-6">
          Performance Trend
        </h3>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis
  yAxisId="left"
  stroke="#94a3b8"
  domain={[0, 100]}
/>

<YAxis
  yAxisId="right"
  orientation="right"
  stroke="#6366f1"
/>
           <Tooltip
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155"
  }}
  labelStyle={{ color: "#fff" }}
  formatter={(value, name) => {
    if (name === "accuracy") return [`${value.toFixed(1)}%`, "Accuracy"]
    if (name === "score") return [value.toFixed(2), "Score"]
    return null
  }}
/>
            <Line
  yAxisId="left"
  type="monotone"
  dataKey="accuracy"
  stroke="#22c55e"
  strokeWidth={3}
/>

<Line
  yAxisId="left"
  type="monotone"
  dataKey="upperBand"
  stroke="#334155"
  strokeDasharray="4 4"
  dot={false}
/>

<Line
  yAxisId="left"
  type="monotone"
  dataKey="lowerBand"
  stroke="#334155"
  strokeDasharray="4 4"
  dot={false}
/>

<Line
  yAxisId="right"
  type="monotone"
  dataKey="score"
  stroke="#6366f1"
  strokeWidth={3}
/>
          </LineChart>
        </ResponsiveContainer>
      </div>
       {/* 🔒 Advanced Analytics Unlock */}
{!isAdvancedUnlocked && (
  <div className="bg-gradient-to-br from-slate-900 to-slate-800 
                  border border-slate-700 
                  rounded-2xl p-10 
                  text-center 
                  relative overflow-hidden">

    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

    <div className="relative z-10">
      <div className="text-xl font-semibold text-white mb-3">
        🔒 Advanced Analytics Locked
      </div>

      <div className="text-slate-400 mb-4">
        Complete 14 workouts to unlock:
      </div>

      <div className="space-y-2 text-sm text-slate-300">
        <div>• Skill Stability Index</div>
        <div>• Volatility Band Analysis</div>
        <div>• Growth Acceleration Tracking</div>
        <div>• Performance Projection Model</div>
      </div>

      <div className="mt-6 text-emerald-400 font-semibold">
        {attempts.length} / 14 Completed
      </div>
    </div>
  </div>
)}

   {isAdvancedUnlocked && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 max-w-7xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-8">
            Advanced Analytics
          </h3>

          <div className="grid md:grid-cols-3 gap-8">

            {/* Skill Stability */}
            <div>
              <h4 className="text-md font-semibold text-white mb-4">
                Skill Stability Index
              </h4>

              <div className="flex justify-between text-sm mb-1">
                <span>Overall Stability</span>
                <span>{stability.toFixed(1)}%</span>
              </div>

              <div className="w-full bg-slate-700/60 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full ${
                    stability > 80
                      ? "bg-emerald-500"
                      : stability > 60
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${stability}%` }}
                />
              </div>
            </div>

            {/* Acceleration */}
            <div>
              <h4 className="text-md font-semibold text-white mb-4">
                Growth Acceleration
              </h4>

              <div className="text-3xl font-bold">
                <span
                  className={
                    acceleration >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                >
                  {acceleration >= 0 ? "+" : ""}
                  {acceleration.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Projection */}
            <div>
              <h4 className="text-md font-semibold text-white mb-4">
                3-Workout Projection
              </h4>

              <div
                className={`text-3xl font-bold ${
                  projectedChange >= 0
                    ? "text-indigo-400"
                    : "text-slate-400"
                }`}
              >
                {projectedChange >= 0 ? "+" : ""}
                {projectedChange.toFixed(1)}%
              </div>
            </div>

          </div>

         {/* Skill Breakdown */}
<div className="mt-16">
  <h3 className="text-lg font-semibold text-white mb-8">
    Skill Breakdown (Last 7 Attempts)
  </h3>

  <div className="grid md:grid-cols-2 gap-12">

    {/* LEFT SIDE */}
    <div className="space-y-6">
     {[...skillAnalytics]
  .sort((a, b) => a.avg - b.avg)
  .map(skill => {
        const percent = (skill.avg / 10) * 100

        return (
          <div
            key={skill.label}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{skill.label}</span>
              <span>{skill.avg.toFixed(1)}</span>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-3 mb-3">
              <div
                className={`h-3 rounded-full ${
                 skill.priority === "Critical"
  ? "bg-red-500"
  : skill.priority === "Moderate"
  ? "bg-yellow-400"
  : "bg-emerald-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400">
              <span>Level: {skill.level}</span>
              <span>Stability: {skill.stability.toFixed(0)}%</span>
            </div>

            <div
              className={`mt-2 text-xs font-semibold ${
                skill.priority === "Critical"
                  ? "text-red-400"
                  : skill.priority === "Moderate"
                  ? "text-yellow-400"
                  : "text-emerald-400"
              }`}
            >
              {skill.priority} Focus Area
            </div>
          </div>
        )
      })}
    </div>

    {/* RIGHT SIDE */}
    <div className="bg-slate-800 rounded-2xl p-8">
      <h4 className="text-lg font-semibold mb-6">
        AI Performance Insight
      </h4>

      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">

        <div>
          📊 Your strongest skill is{" "}
          <span className="text-emerald-400 font-medium">
            {strongestSkill.label}
          </span>{" "}
          ({strongestSkill.level} level).
        </div>

        <div>
          ⚠ Your limiting factor is{" "}
          <span className="text-red-400 font-medium">
            {weakestSkill.label}
          </span>.
          It is currently classified as {weakestSkill.level}.
        </div>

        <div>
          {weakestSkill.momentum < 0
            ? "This skill is declining and may reduce overall accuracy."
            : "Improving this skill will accelerate total score growth."}
        </div>

        <div className="text-purple-400 font-medium mt-4">
  Improvement Potential Score: {improvementPotential.toFixed(1)}
</div>

<div className="text-slate-400">
  This represents how much overall score growth is unlocked
  by improving your weakest skill.
</div>

        <div>
          🎯 Recommendation:
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
            <li>2 focused sessions on {weakestSkill.label}</li>
            <li>1 timed Speed drill</li>
            <li>1 error-analysis session</li>
            <li>Repeat same format under time pressure for stability</li>
          </ul>
        </div>

        <div className="text-indigo-400 font-medium mt-4">
          Expected Impact:
        </div>

        <div>
          Improving {weakestSkill.label} by 1 point can
increase total accuracy by approximately
{(improvementPotential * 1.2).toFixed(1)}%.
        </div>

      </div>
    </div>

  </div>
</div>

        </div>
      )}

    </div>
  );
}

    

function MetricCard({ title, value, accent = "text-white" }) {
  return (
   <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className={`text-3xl font-bold mt-2 ${accent}`}>
        {value}
      </div>
    </div>
  )
}