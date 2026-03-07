"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import WorkoutEngine from "../WorkoutEngine"

export default function DailyHistory({ user }) {
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
const [selectedAnswers, setSelectedAnswers] = useState(null)

  const pageSize = 10

  useEffect(() => {
    if (!user) return

    async function loadHistory() {
      setLoading(true)

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error } = await supabase
        .from("workout_attempts")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .range(from, to)

      if (!error) {
        setAttempts(data)
        setTotalCount(count)
      }

      setLoading(false)
    }

    loadHistory()
  }, [user, page])

  async function handleView(attempt) {

  // 1️⃣ Fetch template
  const { data: template, error } = await supabase
    .from("daily_workout_templates")
    .select("content")
    .eq("workout_date", attempt.workout_date)
    .single()

  if (error || !template) {
    console.log("Template not found")
    return
  }

  // 2️⃣ Set replay state
  setSelectedWorkout(template.content)
  setSelectedAnswers(attempt.user_responses)
}

  if (loading) {
    return <div className="text-slate-400">Loading history...</div>
  }

  if (!attempts.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
        No workouts completed yet.
      </div>
    )
  }

 if (selectedWorkout) {
  return (
    <div className="space-y-6">

      <button
        onClick={() => {
          setSelectedWorkout(null)
          setSelectedAnswers(null)
        }}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition"
      >
        ← Back to History
      </button>

      <WorkoutEngine
        workout={selectedWorkout}
        initialAnswers={selectedAnswers}
        initialPhase="result"
      />

    </div>
  )
}

  return (
    <div className="space-y-6">

      {/* Workout Cards */}
      {attempts.map(attempt => (
        <div
          key={attempt.id}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white font-semibold">
                {new Date(attempt.completed_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </div>

              <div className="text-slate-400 text-sm mt-1">
                Accuracy: {Number(attempt.accuracy || 0).toFixed(1)}% |
                Score: {Number(attempt.total_score || 0).toFixed(2)}
              </div>
            </div>

           <button
  onClick={() => handleView(attempt)}
  className="px-4 py-2 bg-indigo-600 rounded-lg text-sm"
>
  View
</button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-6 pt-6">

        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-40"
        >
          Prev
        </button>

        <span className="text-slate-400">
          Page {page} of {Math.ceil(totalCount / pageSize)}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(totalCount / pageSize)}
          className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-40"
        >
          Next
        </button>

      </div>
    </div>
  )
}