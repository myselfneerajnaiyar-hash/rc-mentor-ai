"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

const SECTIONS = [
  { id: "speed", label: "Speed Drill" },
  { id: "vocab", label: "Vocabulary" },
  { id: "rc1", label: "RC1" },
  { id: "rc2", label: "RC2" },
  { id: "micro", label: "Micro Skills" },
]

export default function DetailedSolutions({ workout, answers, onBack, detectThinkingTrap }) {
  const [sectionId, setSectionId] = useState("speed")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [passageOpen, setPassageOpen] = useState({})
  const [transitionKey, setTransitionKey] = useState(0)

  const section = workout[sectionId]
  const reviewItems = useMemo(() => buildReviewItems(sectionId, section, answers), [sectionId, section, answers])
  const selectedPosition = Math.max(0, reviewItems.findIndex((item) => item.index === questionIndex))
  const selected = reviewItems[selectedPosition] || reviewItems[0]

  useEffect(() => {
    if (reviewItems.length && !reviewItems.some((item) => item.index === questionIndex)) setQuestionIndex(reviewItems[0].index)
  }, [reviewItems, questionIndex])

  function selectSection(nextSection) {
    const items = buildReviewItems(nextSection, workout[nextSection], answers)
    setSectionId(nextSection)
    setQuestionIndex(items[0]?.index || 0)
    setTransitionKey((value) => value + 1)
  }

  function selectQuestion(index) {
    setQuestionIndex(index)
    setTransitionKey((value) => value + 1)
  }

  function move(direction) {
    const nextPosition = selectedPosition + direction
    if (nextPosition >= 0 && nextPosition < reviewItems.length) selectQuestion(reviewItems[nextPosition].index)
  }

  useEffect(() => {
    function handleKeyboard(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft") move(-1)
      if (event.key === "ArrowRight") move(1)
      const number = Number(event.key)
      if (number >= 1 && number <= 9 && reviewItems[number - 1]) selectQuestion(reviewItems[number - 1].index)
    }
    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  })

  if (!selected) return null

  const question = selected.question
  const userAnswer = selected.userAnswer
  const trap = detectThinkingTrap(question, userAnswer)
  const isRC = sectionId === "rc1" || sectionId === "rc2"
  const learning = question.keyLearning || question.key_learning
  const strategy = question.catTakeaway || question.cat_takeaway || question.strategy
  const metadata = getMetadata(question)

  return (
    <main className="mx-auto w-full max-w-[1320px] px-3 py-5 text-slate-100 sm:px-5 lg:px-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">← Back to report</button>
        <p className="hidden text-xs text-slate-500 md:block">Keyboard: ← Previous · → Next · 1–9 Jump</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(250px,25%)_minmax(0,75%)]">
        <aside className="min-w-0 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:pr-1 detailed-scrollbar">
          <div className="review-panel p-3">
            <div className="detailed-scrollbar flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-1">
              {SECTIONS.map((item) => {
                const stats = getSectionStats(item.id, workout[item.id], answers)
                return <button key={item.id} type="button" onClick={() => selectSection(item.id)} className={`min-w-[190px] rounded-xl border p-3 text-left transition-all duration-200 lg:min-w-0 ${sectionId === item.id ? "border-blue-400/50 bg-blue-500/10 shadow-[0_0_18px_rgba(59,130,246,.1)]" : "border-slate-800 bg-slate-950/30 hover:border-slate-600"}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{item.label}</span><span className="text-xs text-slate-500">{stats.attempted}/{stats.total}</span></div><div className="mt-2 flex gap-3 text-[11px]"><span className="text-emerald-300">{stats.correct} correct</span><span className="text-red-300">{stats.wrong} wrong</span><span className="text-amber-300">{stats.skipped} skipped</span></div></button>
              })}
            </div>
          </div>

          <div className="review-panel mt-4 p-3">
            <p className="px-1 pb-3 text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Review order</p>
            <div className="detailed-scrollbar flex gap-2 overflow-x-auto lg:grid lg:max-h-[42vh] lg:grid-cols-1 lg:overflow-y-auto">
              {reviewItems.map((item) => <QuestionNavCard key={item.index} item={item} selected={item.index === selected.index} onClick={() => selectQuestion(item.index)} />)}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="review-panel mb-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-300">{SECTIONS.find((item) => item.id === sectionId)?.label}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Question {selected.index + 1} <span className="font-normal text-slate-500">of {section.questions.length}</span></h1></div><div className="flex gap-2"><HeaderButton label="Previous" icon={ChevronLeft} disabled={selectedPosition === 0} onClick={() => move(-1)} /><HeaderButton label="Next" icon={ChevronRight} iconRight disabled={selectedPosition === reviewItems.length - 1} onClick={() => move(1)} /></div></div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500 transition-[width] duration-500" style={{ width: `${((selectedPosition + 1) / reviewItems.length) * 100}%` }} /></div>
          </header>

          <article key={transitionKey} className="space-y-5 animate-[reviewSlide_220ms_ease-out]">
            <div className="flex flex-wrap items-center gap-2"><PriorityBadge priority={selected.priority} /><StatusBadge status={selected.status} />{question.difficulty && <MetaPill label="Difficulty" value={question.difficulty} />}{selected.scoreLabel && <MetaPill label="Score impact" value={selected.scoreLabel} />}</div>

            {isRC && section.passage && <div className="overflow-hidden rounded-2xl border border-teal-500/25 bg-teal-500/[.035]"><button type="button" onClick={() => setPassageOpen((current) => ({ ...current, [sectionId]: !current[sectionId] }))} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400"><span>{passageOpen[sectionId] ? "Hide Passage" : "Show Passage"}</span><ChevronDown size={18} className={`transition-transform duration-300 ${passageOpen[sectionId] ? "rotate-180" : ""}`} /></button><div className={`grid transition-[grid-template-rows] duration-300 ${passageOpen[sectionId] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="mx-auto max-w-[900px] border-t border-teal-500/20 px-5 py-6 text-[16px] leading-8 text-slate-200 whitespace-pre-line sm:px-8 sm:py-8 sm:text-[17px] sm:leading-9">{section.passage}</div></div></div></div>}

            {!isRC && question.paragraph && <div className="rounded-2xl border border-teal-500/20 bg-teal-500/[.03] p-5 text-[16px] leading-8 text-slate-200 whitespace-pre-line sm:p-7">{question.paragraph}</div>}

            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[.035] p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[.17em] text-blue-300">Question</p><h2 className="mt-3 text-lg font-semibold leading-8 text-white sm:text-xl">{question.question}</h2></section>

            <section className="space-y-3">{question.options.map((option, index) => { const correct = index === question.correctIndex; const chosenWrong = index === userAnswer && !correct; return <div key={index} className={`flex min-h-14 items-start gap-3 rounded-xl border p-4 ${correct ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : chosenWrong ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-slate-800 bg-slate-900/50 text-slate-300"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${correct ? "bg-emerald-500/20 text-emerald-300" : chosenWrong ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-400"}`}>{correct ? <Check size={14} /> : String.fromCharCode(65 + index)}</span><span className="leading-6">{option}</span>{chosenWrong && <span className="ml-auto shrink-0 text-xs font-medium text-red-300">Your answer</span>}</div> })}</section>

            {trap && <section className="rounded-2xl border border-amber-500/30 bg-amber-500/[.06] p-5"><div className="flex items-center gap-2 text-amber-300"><AlertTriangle size={18} /><h3 className="font-semibold">Thinking Trap</h3></div><p className="mt-2 text-sm text-amber-100/80">{trap}</p></section>}

            <section className="rounded-2xl border border-slate-700 bg-slate-900/55 p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[.17em] text-slate-400">Detailed Explanation</p><div className="mt-4 text-[16px] leading-8 text-slate-300 whitespace-pre-line">{question.explanation || "Explanation not available."}</div></section>

            {learning && <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[.045] p-5"><p className="font-semibold text-emerald-300">✓ Key Learning</p><p className="mt-2 text-sm leading-6 text-slate-300">{learning}</p></section>}
            {strategy && <section className="rounded-2xl border border-violet-500/25 bg-violet-500/[.045] p-5"><p className="font-semibold text-violet-300">CAT Strategy</p><p className="mt-2 text-sm leading-6 text-slate-300">{strategy}</p></section>}
            {metadata.length > 0 && <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">{metadata.map((item) => <MetaPill key={item.label} {...item} />)}</section>}

            <footer className="flex items-center justify-between gap-3 border-t border-slate-800 pt-5"><HeaderButton label="Previous Question" icon={ChevronLeft} disabled={selectedPosition === 0} onClick={() => move(-1)} large /><HeaderButton label="Next Question" icon={ChevronRight} iconRight disabled={selectedPosition === reviewItems.length - 1} onClick={() => move(1)} large /></footer>
          </article>
        </section>
      </div>
      <style jsx global>{`.review-panel{border:1px solid rgba(51,65,85,.82);border-radius:20px;background:rgba(15,23,42,.62);box-shadow:0 18px 50px rgba(0,0,0,.12);backdrop-filter:blur(16px)}.detailed-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(71,85,105,.7) transparent}.detailed-scrollbar::-webkit-scrollbar{width:5px;height:5px}.detailed-scrollbar::-webkit-scrollbar-thumb{background:rgba(71,85,105,.7);border-radius:999px}@keyframes reviewSlide{from{opacity:0;transform:translateX(6px)}to{opacity:1;transform:translateX(0)}}@media(prefers-reduced-motion:reduce){[class*="reviewSlide"]{animation:none!important}}`}</style>
    </main>
  )
}

function buildReviewItems(sectionId, section, answers) {
  const points = sectionId === "speed" || sectionId === "vocab" ? 1 : 3
  const penalty = sectionId === "speed" || sectionId === "vocab" ? 0.33 : 1
  return (section?.questions || []).map((question, index) => {
    const userAnswer = answers[sectionId]?.[index]
    const status = userAnswer === undefined ? "skipped" : userAnswer === question.correctIndex ? "correct" : "wrong"
    const scoreLabel = status === "correct" ? `Earned +${points}` : status === "skipped" ? `Potential +${points}` : `Lost -${penalty}`
    return { question, index, userAnswer, status, scoreLabel, priority: getPriority(status, question.difficulty) }
  }).sort((a, b) => ({ wrong: 0, skipped: 1, correct: 2 }[a.status] - ({ wrong: 0, skipped: 1, correct: 2 }[b.status]) || a.index - b.index))
}

function getSectionStats(sectionId, section, answers) { const items = buildReviewItems(sectionId, section, answers); return { total: items.length, attempted: items.filter((item) => item.status !== "skipped").length, correct: items.filter((item) => item.status === "correct").length, wrong: items.filter((item) => item.status === "wrong").length, skipped: items.filter((item) => item.status === "skipped").length } }
function getPriority(status, difficulty) { const level = String(difficulty || "").toLowerCase(); if (status === "wrong" && level === "hard") return "High"; if (status === "wrong") return "High"; if (status === "skipped" && (level === "medium" || level === "hard")) return "Medium"; if (status === "skipped") return "Medium"; return "Low" }
function getMetadata(question) { return [{ label: "Topic", value: question.topic || question.skill?.replaceAll("_", " ") }, { label: "Time taken", value: formatOptionalTime(question.timeTaken ?? question.time_taken) }, { label: "Average time", value: formatOptionalTime(question.averageTime ?? question.average_time) }, { label: "Question accuracy", value: question.accuracy == null ? null : `${question.accuracy}%` }].filter((item) => item.value != null) }
function formatOptionalTime(value) { if (value == null) return null; if (typeof value === "string") return value; return `${Math.round(value)}s` }

function QuestionNavCard({ item, selected, onClick }) { const statusStyle = item.status === "correct" ? "border-emerald-500/30 text-emerald-300" : item.status === "wrong" ? "border-red-500/30 text-red-300" : "border-amber-500/30 text-amber-300"; const symbol = item.status === "correct" ? "✓" : item.status === "wrong" ? "×" : "↷"; return <button type="button" onClick={onClick} className={`min-w-[145px] rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-px lg:min-w-0 ${selected ? "border-blue-400/60 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,.12)]" : `bg-slate-950/35 hover:bg-slate-800/60 ${statusStyle}`}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold">Q{item.index + 1}</span><span>{symbol}</span></div><p className="mt-2 text-[11px] capitalize text-slate-400">{item.question.difficulty || ""}</p><p className="mt-1 text-xs font-medium text-slate-300">{item.scoreLabel}</p></button> }
function HeaderButton({ label, icon: Icon, iconRight, disabled, onClick, large }) { return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-35 ${large ? "px-5 py-3" : "px-3 py-2 text-sm"}`}>{!iconRight && <Icon size={16} />}{label}{iconRight && <Icon size={16} />}</button> }
function PriorityBadge({ priority }) { const color = priority === "High" ? "border-red-500/30 bg-red-500/10 text-red-300" : priority === "Medium" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-800/70 text-slate-300"; return <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${color}`}>Review Priority: {priority}</span> }
function StatusBadge({ status }) { const color = status === "correct" ? "bg-emerald-500/10 text-emerald-300" : status === "wrong" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"; return <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${color}`}>{status}</span> }
function MetaPill({ label, value }) { return <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400"><span className="text-slate-500">{label}:</span> <span className="capitalize text-slate-300">{value}</span></span> }
