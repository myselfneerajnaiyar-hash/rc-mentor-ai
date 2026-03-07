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

function avg(arr) {
  if (!arr || !arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function calculateStreak(attempts) {
  if (!attempts.length) return 0

  const uniqueDates = [
    ...new Set(
      attempts.map(a =>
        new Date(a.workout_date).toDateString()
      )
    )
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0

  for (let i = 0; i < uniqueDates.length; i++) {
    const attemptDate = new Date(uniqueDates[i])
    attemptDate.setHours(0, 0, 0, 0)

    const diff =
      (today - attemptDate) / (1000 * 60 * 60 * 24)

    if (diff === streak || diff === streak + 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export default function DailyPerformance({ user }) {
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [avg7, setAvg7] = useState(0)
  const [last7Data, setLast7Data] = useState([])
  const [weeklyCompletion, setWeeklyCompletion] = useState([])
  const [peakData, setPeakData] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadPerformance() {
      const { data, error } = await supabase
        .from("workout_attempts")
        .select("workout_date, total_score, completed_at")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false })

      if (error || !data || data.length === 0) {
        setLoading(false)
        return
      }

      // 🏆 Best Score
      const maxScore = Math.max(
        ...data.map(d => d.total_score || 0)
      )
      setBestScore(maxScore)

      // 📊 7-Day Average
      const last7 = data.slice(0, 7)
setLast7Data(last7)
     const avgScore =
  last7.reduce((sum, d) => sum + (d.total_score || 0), 0) /
  last7.length

setAvg7(Number(avgScore.toFixed(1)))

      // 🔥 Simple streak (consecutive entries)
     setStreak(calculateStreak(data))

// ---- Weekly Completion Logic ----
const today = new Date()
today.setHours(0, 0, 0, 0)

// Monday = 0
const monday = new Date(today)
const dayIndex = (today.getDay() + 6) % 7
monday.setDate(today.getDate() - dayIndex)

const weekDays = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(monday)
  d.setDate(monday.getDate() + i)
  d.setHours(0, 0, 0, 0)
  return d
})

const completedMap = {}

data.forEach(attempt => {
  const attemptDate = new Date(attempt.workout_date)
  attemptDate.setHours(0, 0, 0, 0)
  completedMap[attemptDate.toDateString()] = true
})

const weeklyStatus = weekDays.map(d =>
  completedMap[d.toDateString()] ? 1 : 0
)

setWeeklyCompletion(weeklyStatus)
// ---- Peak Performance Logic ----

const buckets = {
  early: [],
  morning: [],
  afternoon: [],
  evening: [],
  night: []
}

data.forEach(attempt => {
  if (!attempt.completed_at) return

  const date = new Date(attempt.completed_at)
  const hour = date.getHours()
  const score = attempt.total_score || 0

  if (hour >= 5 && hour < 9) buckets.early.push(score)
  else if (hour >= 9 && hour < 12) buckets.morning.push(score)
  else if (hour >= 12 && hour < 16) buckets.afternoon.push(score)
  else if (hour >= 16 && hour < 20) buckets.evening.push(score)
  else buckets.night.push(score)
})



const peak = {
  early: avg(buckets.early),
  morning: avg(buckets.morning),
  afternoon: avg(buckets.afternoon),
  evening: avg(buckets.evening),
  night: avg(buckets.night)
}

setPeakData(peak)

setLoading(false)
    }

    loadPerformance()
  }, [user])

  if (loading) {
    return (
      <div className="text-slate-400">
        Loading performance...
      </div>
    )
  }

  const chartData = last7Data
  .map(d => ({
    date: new Date(d.workout_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    score: d.total_score || 0
  }))
  .reverse()

  const bestWindow =
  peakData &&
  Object.entries(peakData).reduce((best, current) =>
    current[1] > best[1] ? current : best
  )

  return (
    <>

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      <StatCard
  title="🔥 Current Streak"
  value={`${streak} days`}
  accent="text-orange-400"
/>

<StatCard
  title="🏆 Best Score"
  value={bestScore ? Number(bestScore).toFixed(2) : 0}
  accent="text-cyan-400"
/>

<StatCard
  title="📊 7-Day Avg"
  value={avg7}
  accent="text-emerald-400"
/>
    </div>

<div className="mt-12">
  <h3 className="text-lg font-semibold text-slate-200 mb-4">
    Weekly Consistency
  </h3>

  <div className="flex gap-4">
    {weeklyCompletion.map((done, i) => (
      <div
        key={i}
        className={`h-14 w-14 rounded-xl flex items-center justify-center font-semibold transition-all duration-300
        ${
          done
            ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10"
            : "bg-slate-800 border border-slate-700 text-slate-600"
        }`}
      >
        {done ? "✓" : ""}
      </div>
    ))}
  </div>

  <div className="flex gap-4 mt-2 text-xs text-slate-500">
    {["M","T","W","T","F","S","S"].map((d, i) => (
      <div key={i} className="w-14 text-center">
        {d}
      </div>
    ))}
  </div>
</div>
<div className="mt-16">
  <h3 className="text-lg font-semibold text-slate-200 mb-6">
    🧠 Peak Performance Window
  </h3>

  <div className="grid grid-cols-5 gap-4">
   {peakData &&
  Object.entries(peakData).map(([label, value]) => {
    const isBest = bestWindow && label === bestWindow[0]
        const max = Math.max(...Object.values(peakData), 1)
        const intensity = value / max

        return (
          <div
  key={label}
  className={`rounded-xl p-5 text-center transition-all duration-300
    ${isBest ? "ring-2 ring-emerald-400 scale-105 shadow-lg shadow-emerald-500/20" : ""}
  `}
  style={{
    background:
      value === 0
        ? "rgba(30,41,59,0.6)"
        : `rgba(16,185,129, ${
            bestWindow ? 0.2 + (value / bestWindow[1]) * 0.6 : 0.3
          })`
  }}
>
            <div className="text-xs text-slate-300 capitalize">
              {label}
            </div>

            <div className="text-white font-bold mt-2">
              {value.toFixed(1)}
            </div>

          </div>
        )
      })}
  </div>
  {bestWindow && bestWindow[1] > 0 && (
  <p className="text-sm text-emerald-400 mt-6 font-medium">
    You perform best during{" "}
    <span className="font-semibold capitalize">
      {bestWindow[0]}
    </span>{" "}
    sessions.
  </p>
)}
</div>
</>
  )
}


  

function StatCard({ title, value, accent }) {
  return (
    <div className="relative overflow-hidden bg-slate-800/60 backdrop-blur-md border border-slate-700/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10">
      
      {/* subtle glass highlight layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30 pointer-events-none" />

      <div className={`text-sm font-medium relative z-10 ${accent}`}>
        {title}
      </div>

      <div className="text-3xl font-bold text-white mt-2 relative z-10">
        {value}
      </div>
    </div>
  )
}