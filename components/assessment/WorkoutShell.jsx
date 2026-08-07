"use client"

import { Check, Clock3 } from "lucide-react"
import AssessmentMode from "./AssessmentMode"

const MODULES = [
  { id: "speed", label: "Speed Drill" },
  { id: "vocab", label: "Vocabulary" },
  { id: "rc1", label: "RC 1" },
  { id: "rc2", label: "RC 2" },
  { id: "micro", label: "Micro Skills" },
]

export default function WorkoutShell({ phase, completedQuestions, totalQuestions, title, questionNumber, questionTotal, timer, children }) {
  const activeIndex = MODULES.findIndex((module) => module.id === phase)
  const progress = totalQuestions ? (completedQuestions / totalQuestions) * 100 : 0
  const urgency = timer <= 30 ? "critical" : timer < 120 ? "warning" : "normal"

  return (
    <main className="mx-auto w-full max-w-[1280px] px-3 py-4 text-white sm:px-6 sm:py-8">
      <AssessmentMode />
      <section className="mb-6 rounded-2xl border border-slate-800/90 bg-slate-950/75 p-4 shadow-xl shadow-black/15 backdrop-blur-xl sm:p-6">
        <div className="assessment-scrollbar flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-5">
          {MODULES.map((module, index) => {
            const complete = index < activeIndex
            const current = index === activeIndex
            return (
              <div key={module.id} aria-current={current ? "step" : undefined} className={`flex min-w-max items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors duration-200 ${current ? "border-blue-400/60 bg-blue-500/10 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.14)]" : complete ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-slate-800 bg-slate-900/60 text-slate-500"}`}>
                {complete ? <Check size={14} aria-hidden="true" /> : <span className={`h-2 w-2 rounded-full ${current ? "bg-blue-400" : "border border-slate-600"}`} aria-hidden="true" />}
                {module.label}
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-300">Overall Progress</span><span className="tabular-nums text-slate-500">{completedQuestions} / {totalQuestions} Questions</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Overall workout progress" aria-valuemin={0} aria-valuemax={totalQuestions} aria-valuenow={completedQuestions}><div className="h-full rounded-full bg-blue-500 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} /></div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4 shadow-xl shadow-black/10 sm:p-7 lg:p-8">
        <header className="mb-7 grid gap-4 border-b border-slate-800 pb-6 md:grid-cols-[minmax(0,3fr)_minmax(190px,1fr)] md:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">{title}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">Question {questionNumber} <span className="font-normal text-slate-500">of {questionTotal}</span></h1></div>
          <div className={`timer-card timer-card-${urgency}`} aria-label={`${timer} seconds remaining`}><Clock3 size={21} aria-hidden="true" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Time left</p><p className="font-mono text-3xl font-semibold tabular-nums">{formatTimer(timer)}</p></div></div>
        </header>
        {children}
      </section>
    </main>
  )
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0)
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`
}
