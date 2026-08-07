"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock3, Gauge, Target } from "lucide-react"

export default function SpeedDrillReview({ result, meta, onRestart }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [transitionKey, setTransitionKey] = useState(0)
  const details = result.details || []
  const selected = details[selectedIndex]
  const completion = details.length ? Math.round((result.attemptedCount / details.length) * 100) : 0
  const averageSpeed = useMemo(() => {
    const measured = details.filter((item) => item.readSeconds > 0)
    if (!measured.length) return null
    return Math.round(measured.reduce((sum, item) => sum + (item.text.split(/\s+/).length / item.readSeconds) * 60, 0) / measured.length)
  }, [details])

  function selectParagraph(index) {
    if (index < 0 || index >= details.length) return
    setSelectedIndex(index)
    setTransitionKey((value) => value + 1)
  }

  useEffect(() => {
    function handleKeyboard(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      if (event.key === "ArrowLeft") selectParagraph(selectedIndex - 1)
      if (event.key === "ArrowRight") selectParagraph(selectedIndex + 1)
    }
    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [selectedIndex, details.length])

  if (!selected) return null

  const skipped = selected.status === "skipped"
  const status = skipped ? "Skipped" : selected.correct ? "Correct" : "Incorrect"
  const difficulty = selected.question.difficulty || result.level || meta?.level
  const userAnswer = selected.answerIndex === undefined ? null : selected.question.options[selected.answerIndex]
  const correctAnswer = selected.question.options[selected.question.correct]
  const trap = selected.question.thinkingTrap || selected.question.thinking_trap || selected.question.trap
  const learning = selected.question.keyLearning || selected.question.key_learning
  const scoreImpact = selected.question.estimatedMarksLost ?? selected.question.estimated_marks_lost

  return (
    <main className="mx-auto w-full max-w-[1320px] px-3 py-5 text-slate-100 sm:px-5 lg:px-6">
      <header className="speed-review-panel mb-5 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-300">Speed Drill Review</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Reading performance</h1></div>
          <button type="button" onClick={onRestart} className="self-start rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Next Drill</button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800 sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
          <HeaderMetric icon={Target} label="Overall Accuracy" value={`${result.accuracy}%`} tone="green" />
          <HeaderMetric icon={Gauge} label="Average Speed" value={averageSpeed == null ? "—" : `${averageSpeed} WPM`} />
          <HeaderMetric icon={Gauge} label="Raw WPM" value={`${result.rawWPM} WPM`} />
          <HeaderMetric icon={Gauge} label="Effective WPM" value={`${result.effectiveWPM} WPM`} tone="green" />
          <HeaderMetric icon={Target} label="Target WPM" value={`${meta?.wpm ?? "—"} WPM`} />
          <HeaderMetric icon={Check} label="Completion" value={`${completion}%`} tone={completion < 70 ? "amber" : "blue"} />
          <HeaderMetric icon={Target} label="Difficulty" value={difficulty || "—"} compact />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(250px,25%)_minmax(0,75%)]">
        <aside className="speed-review-panel speed-review-scrollbar min-w-0 p-3 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
          <div className="mb-3 px-1"><p className="text-xs font-semibold uppercase tracking-[.17em] text-slate-500">Speed Drill</p><p className="mt-1 text-sm text-slate-400">{result.correct} correct · {result.incorrect} incorrect · {result.skippedCount} skipped</p></div>
          <div className="speed-review-scrollbar flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-1 lg:overflow-visible">
            {details.map((item, index) => <NavigatorItem key={item.paragraphNumber} item={item} selected={index === selectedIndex} onClick={() => selectParagraph(index)} />)}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="speed-review-panel mb-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-300">Paragraph {selected.paragraphNumber}</p><p className="mt-2 text-sm text-slate-400">Paragraph {selectedIndex + 1} of {details.length}</p></div><div className="flex flex-wrap items-center gap-2"><NavButton label="Previous" icon={ChevronLeft} disabled={selectedIndex === 0} onClick={() => selectParagraph(selectedIndex - 1)} /><select value={selectedIndex} onChange={(event) => selectParagraph(Number(event.target.value))} aria-label="Jump to paragraph" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">{details.map((item, index) => <option key={item.paragraphNumber} value={index}>Paragraph {item.paragraphNumber}</option>)}</select><NavButton label="Next" icon={ChevronRight} iconRight disabled={selectedIndex === details.length - 1} onClick={() => selectParagraph(selectedIndex + 1)} /></div></div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500 transition-[width] duration-500" style={{ width: `${((selectedIndex + 1) / details.length) * 100}%` }} /></div>
          </div>

          <article key={transitionKey} className="space-y-5 animate-[speedReviewSlide_220ms_ease-out]">
            <div className="flex flex-wrap gap-2"><StatusBadge status={status} />{difficulty && <InfoChip label="Difficulty" value={difficulty} />}{selected.readSeconds != null && <InfoChip label="Time" value={`${selected.readSeconds}s`} icon={Clock3} />}{scoreImpact != null && <InfoChip label="Estimated marks lost" value={scoreImpact} />}</div>

            <ReviewSection title="Passage" tone="teal"><p className="text-[16px] leading-8 text-slate-200 sm:text-[17px] sm:leading-9">{selected.text}</p></ReviewSection>
            <ReviewSection title="Question" tone="blue"><h2 className="text-lg font-semibold leading-8 text-white sm:text-xl">{selected.question.q}</h2></ReviewSection>

            <section className="space-y-3">{selected.question.options.map((option, optionIndex) => { const correct = optionIndex === selected.question.correct; const chosenWrong = optionIndex === selected.answerIndex && !correct; return <div key={optionIndex} className={`flex min-h-14 items-start gap-3 rounded-xl border p-4 ${correct ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : chosenWrong ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-slate-800 bg-slate-900/50 text-slate-300"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${correct ? "bg-emerald-500/20 text-emerald-300" : chosenWrong ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-400"}`}>{correct ? <Check size={14} /> : String.fromCharCode(65 + optionIndex)}</span><span className="leading-6">{option}</span>{chosenWrong && <span className="ml-auto shrink-0 text-xs font-medium text-red-300">Your answer</span>}</div> })}</section>

            {skipped && <div className="rounded-xl border border-amber-500/30 bg-amber-500/[.06] p-4 text-sm text-amber-200">This question was skipped. Correct answer: <strong>{correctAnswer}</strong></div>}
            {!skipped && <div className="grid gap-3 sm:grid-cols-2"><AnswerSummary label="Your answer" value={userAnswer} correct={selected.correct} /><AnswerSummary label="Correct answer" value={correctAnswer} correct /></div>}

            <ReviewSection title="Explanation" tone="neutral"><div className="text-[16px] leading-8 text-slate-300 whitespace-pre-line">{selected.question.explanation || "Review the paragraph's central idea and the evidence supporting the correct option."}</div></ReviewSection>
            {trap && <ReviewSection title="Thinking Trap" tone="amber" icon={AlertTriangle}><p className="text-sm leading-6 text-amber-100/80">{trap}</p></ReviewSection>}
            {learning && <ReviewSection title="Key Learning" tone="green" icon={Check}><p className="text-sm leading-6 text-slate-300">{learning}</p></ReviewSection>}

            <footer className="flex items-center justify-between gap-3 border-t border-slate-800 pt-5"><NavButton label="Previous Paragraph" icon={ChevronLeft} disabled={selectedIndex === 0} onClick={() => selectParagraph(selectedIndex - 1)} large /><NavButton label="Next Paragraph" icon={ChevronRight} iconRight disabled={selectedIndex === details.length - 1} onClick={() => selectParagraph(selectedIndex + 1)} large /></footer>
          </article>
        </section>
      </div>
      <style jsx global>{`.speed-review-panel{border:1px solid rgba(51,65,85,.82);border-radius:20px;background:rgba(15,23,42,.62);box-shadow:0 18px 50px rgba(0,0,0,.12);backdrop-filter:blur(16px)}.speed-review-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(71,85,105,.7) transparent}.speed-review-scrollbar::-webkit-scrollbar{width:5px;height:5px}.speed-review-scrollbar::-webkit-scrollbar-thumb{background:rgba(71,85,105,.7);border-radius:999px}@keyframes speedReviewSlide{from{opacity:0;transform:translateX(6px)}to{opacity:1;transform:translateX(0)}}@media(prefers-reduced-motion:reduce){[class*="speedReviewSlide"]{animation:none!important}}`}</style>
    </main>
  )
}

function HeaderMetric({ icon: Icon, label, value, tone = "blue", compact }) { const color = tone === "green" ? "text-emerald-300 bg-emerald-500/10" : tone === "amber" ? "text-amber-300 bg-amber-500/10" : "text-blue-300 bg-blue-500/10"; return <div className="p-4"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}><Icon size={14} /></span><p className="mt-3 text-[11px] text-slate-500">{label}</p><p className={`mt-1 font-semibold capitalize text-white ${compact ? "text-sm" : "text-base"}`}>{value}</p></div> }
function NavigatorItem({ item, selected, onClick }) { const skipped = item.status === "skipped"; const status = skipped ? "Skipped" : item.correct ? "Correct" : "Incorrect"; const color = skipped ? "border-amber-500/30 text-amber-300" : item.correct ? "border-emerald-500/30 text-emerald-300" : "border-red-500/30 text-red-300"; return <button type="button" onClick={onClick} className={`min-w-[170px] rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-px lg:min-w-0 ${selected ? "border-blue-400/60 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,.12)]" : `bg-slate-950/35 hover:bg-slate-800/60 ${color}`}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white">Paragraph {item.paragraphNumber}</span><span className={`h-2 w-2 rounded-full ${skipped ? "bg-amber-400" : item.correct ? "bg-emerald-400" : "bg-red-400"}`} /></div><div className="mt-2 flex items-center justify-between text-xs"><span className={color.split(" ")[1]}>{status}</span>{item.readSeconds > 0 && <span className="text-slate-500">{item.readSeconds}s</span>}</div></button> }
function ReviewSection({ title, tone, icon: Icon, children }) { const colors = { teal: "border-teal-500/25 bg-teal-500/[.035] text-teal-300", blue: "border-blue-500/25 bg-blue-500/[.035] text-blue-300", neutral: "border-slate-700 bg-slate-900/55 text-slate-400", amber: "border-amber-500/30 bg-amber-500/[.06] text-amber-300", green: "border-emerald-500/25 bg-emerald-500/[.045] text-emerald-300" }; return <section className={`rounded-2xl border p-5 sm:p-7 ${colors[tone]}`}><div className="mb-4 flex items-center gap-2">{Icon && <Icon size={17} />}<p className="text-xs font-semibold uppercase tracking-[.17em]">{title}</p></div>{children}</section> }
function StatusBadge({ status }) { const color = status === "Correct" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : status === "Incorrect" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"; return <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${color}`}>Status: {status}</span> }
function InfoChip({ label, value, icon: Icon }) { return <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">{Icon && <Icon size={13} className="text-blue-300" />}<span className="text-slate-500">{label}:</span> <span className="capitalize">{value}</span></span> }
function AnswerSummary({ label, value, correct }) { return <div className={`rounded-xl border p-4 ${correct ? "border-emerald-500/25 bg-emerald-500/[.05]" : "border-red-500/25 bg-red-500/[.05]"}`}><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-sm font-medium ${correct ? "text-emerald-200" : "text-red-200"}`}>{value}</p></div> }
function NavButton({ label, icon: Icon, iconRight, disabled, onClick, large }) { return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-35 ${large ? "px-5 py-3" : "px-3 py-2 text-sm"}`}>{!iconRight && <Icon size={16} />}{label}{iconRight && <Icon size={16} />}</button> }
