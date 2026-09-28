"use client"
import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"
import { BookOpen, BookText, CheckCircle, Loader2, PenLine, Zap } from "lucide-react"
import Recovery from "./mobile/Recovery";
import NextActivity from "./mobile/NextActivity";
import { fetchWithTimeout, withTimeout } from "@/lib/mobile/request";
import WorkoutEngine from "./WorkoutEngine.jsx";
import { startLearningActivity } from "@/lib/learningAnalytics";

export const WORKOUT_INTRO = "Practise speed, vocabulary and reading in one guided session. Allow about 30 minutes.";

export default function DailyWorkoutFlow({ mode = "normal", setView, onRunningChange }) {
  const [error,setError]=useState(null);
  const [retry,setRetry]=useState(0);
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
    onRunningChange?.(status === "running")
    return () => onRunningChange?.(false)
  }, [status, onRunningChange])

useEffect(() => {
 let alive=true;setStatus("building");setError(null);
 async function loadWorkout(){try{
 const {data:{session}}=await withTimeout(supabase.auth.getSession());
 if(!session)throw Error("Please sign in again to load your workout.");
 const response=await fetchWithTimeout("/api/check-attempt",{headers:{Authorization:`Bearer ${session.access_token}`}});
 if(!response.ok)throw Error("Your workout status could not be checked. Please retry.");
 const attempt=await response.json();if(!alive)return;
 if(attempt.attempted){setTodayAttempt(attempt.attempt);setStatus("alreadyAttempted");return;}
 const res=await fetchWithTimeout(`/api/get-daily-workout?mode=${mode}`);
 if(!res.ok)throw Error("Today’s workout could not load. Please retry.");
 const data=await res.json();
 if(!["speed","vocab","rc1","rc2","micro"].every(key=>data[key]?.questions?.length))throw Error("Today’s workout is still being prepared. Try another daily activity or check again.");
 if(alive){setWorkout(data);setStatus("ready");}
 }catch(error){if(alive){setError(error.message);setStatus("error");}}}
 loadWorkout();return()=>{alive=false;};
},[mode,retry]);
if(status==="error")return <Recovery message={error} area="workout_load" onRetry={()=>setRetry(n=>n+1)}/>;

if (status === "alreadyAttempted") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-6 max-w-xl">

        <h1 className="text-3xl font-bold text-orange-400">
          ✓ Workout complete
        </h1>

        <p className="text-slate-400 text-lg">
          You’ve already completed today’s workout.
        </p>

        <p className="text-slate-500">
          Your result is saved. Review it or try another daily activity.
        </p>

        <a className="mobile-secondary" href="/?view=workout&tab=history">Review your workout</a>
        <NextActivity current="workout"/>
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
      <div className="workout-ready min-h-screen bg-slate-950 py-8 text-white sm:py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <section className="workout-overview rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 p-6 shadow-2xl shadow-black/20 sm:p-10">
            <p className="text-xs font-bold tracking-[0.18em] text-indigo-300">TODAY'S FOCUS</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">🔥 Daily Workout</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">{WORKOUT_INTRO}</p>
          </section>

          <section className="workout-activities mt-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-indigo-400" />
              <h2 className="text-xl font-bold text-slate-100">Today's Workout</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <WorkoutCard icon={Zap} title="Speed Drill" lines={["10 short paragraphs", "20 seconds to read each paragraph", "10 seconds to answer the question"]} tone="text-amber-300" />
              <WorkoutCard icon={BookOpen} title="Vocabulary Lab" lines={["10 vocabulary questions", "Improve word knowledge and contextual understanding"]} tone="text-sky-300" />
              <WorkoutCard icon={BookText} title="Reading Comprehension" lines={["2 passages", "4 questions per passage", "Build comprehension and inference skills"]} tone="text-violet-300" />
              <WorkoutCard icon={PenLine} title="Micro Skills" lines={["5 language questions", "Grammar, sentence structure, and usage"]} tone="text-emerald-300" />
            </div>
          </section>

          <section className="workout-intro-details mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-100">How it Works</h2>
            <ul className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
              <InfoPoint text="Fresh workout generated every day" />
              <InfoPoint text="Complete all four modules in about 30 minutes" />
              <InfoPoint text="Progress is automatically tracked" />
              <InfoPoint text="Build consistency through daily practice" />
            </ul>
          </section>

          <div className="workout-start mt-8 flex justify-center">
          <button
            onClick={() => {
              startLearningActivity("daily_workout");
              setStatus("running");
            }}
              className="rounded-2xl bg-indigo-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500"
          >
            🚀 Start Workout
          </button>
          </div>
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
        onComplete={() => onRunningChange?.(false)}
      />
    )
  }
}

function WorkoutCard({ icon: Icon, title, lines, tone }) {
  return (
    <article className="workout-activity-card rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start gap-3">
        <span className={`rounded-xl bg-slate-800 p-2.5 ${tone}`}><Icon size={20} aria-hidden="true" /></span>
        <div>
          <h3 className="font-bold text-slate-100">{title}</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
            {lines.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      </div>
    </article>
  )
}

function InfoPoint({ text }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle
        size={16}
        className="shrink-0 text-indigo-300"
        aria-hidden="true"
      />
      {text}
    </li>
  );
}
