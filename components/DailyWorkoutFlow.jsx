"use client"
import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import WorkoutEngine from "./WorkoutEngine.jsx";

export default function DailyWorkoutFlow({ mode = "normal", setView }) {
  const [status, setStatus] = useState("building") 
  // building | ready | running

  const [workout, setWorkout] = useState(null)
  const [todayAttempt, setTodayAttempt] = useState(null)
  const [steps, setSteps] = useState([
    { label: "Preparing Speed Drill", done: false },
    { label: "Preparing Vocabulary Lab", done: false },
    { label: "Crafting RC Passage 1", done: false },
    { label: "Crafting RC Passage 2", done: false },
    { label: "Designing Micro Skill Round", done: false },
  ])

useEffect(() => {
  async function loadWorkout() {

    // 1️⃣ Check session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.error("No session found")
      return
    }

    // 2️⃣ Check if already attempted
    const attemptRes = await fetch("/api/check-attempt", {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    const attemptData = await attemptRes.json()

    if (attemptData.attempted) {
  setTodayAttempt(attemptData.attempt)
  setStatus("alreadyAttempted")
  return
}

    // 3️⃣ If not attempted → load workout
    const res = await fetch(`/api/get-daily-workout?mode=${mode}`)

    if (!res.ok) {
      console.error("Workout API failed")
      return
    }

    const data = await res.json()
    setWorkout(data)

    // Animate steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSteps(prev => {
        const updated = [...prev]
        updated[i].done = true
        return updated
      })
    }

    setStatus("ready")
  }

  loadWorkout()
}, [])

if (status === "alreadyAttempted") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-6 max-w-xl">

        <h1 className="text-3xl font-bold text-orange-400">
          ⚠ Attempt Exhausted
        </h1>

        <p className="text-slate-400 text-lg">
          You’ve already completed today’s workout.
        </p>

        <p className="text-slate-500">
          Come back tomorrow for a new challenge 🚀
        </p>

        {todayAttempt && (
          <div className="mt-8 p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold text-indigo-400">
              📊 Today’s Performance
            </h2>

            <div className="grid grid-cols-2 gap-4 text-slate-300 text-sm">
              <div>⚡ Speed</div>
              <div>{Number(todayAttempt.speed_score).toFixed(2)}</div>

              <div>📚 Vocab</div>
              <div>{Number(todayAttempt.vocab_score).toFixed(2)}</div>

              <div>📖 RC 1</div>
              <div>{Number(todayAttempt.rc1_score).toFixed(2)}</div>

              <div>📘 RC 2</div>
              <div>{Number(todayAttempt.rc2_score).toFixed(2)}</div>

              <div>🎯 Micro</div>
              <div>{Number(todayAttempt.micro_score).toFixed(2)}</div>

              <div className="font-semibold text-white">🏆 Total</div>
              <div className="font-semibold text-green-400">
                {Number(todayAttempt.total_score).toFixed(2)}
              </div>
            </div>

            <p className="text-slate-500 pt-4">
              Keep improving. Consistency builds intelligence 💪🧠
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

  if (status === "building") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="w-full max-w-lg space-y-6">
          <h1 className="text-2xl font-semibold text-center">
            🧠 Creating Your Intelligence Lab...
          </h1>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle className="text-green-400" />
                ) : (
                  <Loader2 className="animate-spin text-slate-400" />
                )}
                <span className={step.done ? "text-green-400" : "text-slate-400"}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">
            ✅ Your 30-Minute Workout Is Ready
          </h1>

          <button
            onClick={() => setStatus("running")}
            className="px-8 py-3 bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-500 transition"
          >
            🚀 Start Workout
          </button>
        </div>
      </div>
    )
  }

  if (status === "running") {
    return (
      <WorkoutEngine
        workout={workout}
        mode={mode}
        setView={setView}
      />
    )
  }
}