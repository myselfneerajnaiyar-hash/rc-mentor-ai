"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BarChart3, Check, ChevronDown, Lightbulb, Target, TrendingUp } from "lucide-react"

const TABS = ["Overview", "Performance", "Section Analysis", "Insights", "Solutions"]
const SECTIONS = [
  { id: "speed", label: "Speed Drill" },
  { id: "vocab", label: "Vocabulary" },
  { id: "rc1", label: "RC1" },
  { id: "rc2", label: "RC2" },
  { id: "micro", label: "Micro Skills" },
]

export default function WorkoutReport({ workout, result, skillMap, totalScore, timings, onOpenSolutions }) {
  const [activeTab, setActiveTab] = useState("Overview")

  useEffect(() => {
    const remembered = window.sessionStorage.getItem("daily-workout-report-tab")
    if (TABS.includes(remembered)) setActiveTab(remembered)
  }, [])

  function selectTab(tab) {
    setActiveTab(tab)
    window.sessionStorage.setItem("daily-workout-report-tab", tab)
  }

  const metrics = useMemo(() => buildMetrics(workout, result, skillMap, totalScore, timings), [workout, result, skillMap, totalScore, timings])

  return (
    <main className="mx-auto w-full max-w-[1280px] px-3 py-5 text-slate-100 sm:px-6 sm:py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Workout Complete <Check className="ml-1 inline" size={14} /></p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Daily Workout Report</h1>
      </header>

      <nav className="report-scrollbar mb-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-1.5" aria-label="Workout report sections">
        {TABS.map((tab) => <button key={tab} type="button" onClick={() => selectTab(tab)} className={`min-w-max flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTab === tab ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"}`}>{tab}</button>)}
      </nav>

      <div key={activeTab} className="animate-[reportFade_220ms_ease-out]">
        {activeTab === "Overview" && <Overview metrics={metrics} />}
        {activeTab === "Performance" && <Performance metrics={metrics} />}
        {activeTab === "Section Analysis" && <SectionAnalysis metrics={metrics} />}
        {activeTab === "Insights" && <Insights metrics={metrics} />}
        {activeTab === "Solutions" && <Solutions metrics={metrics} onOpenSolutions={onOpenSolutions} />}
      </div>
      <style jsx global>{`
        .report-panel {
          border: 1px solid rgba(51, 65, 85, 0.82);
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.58);
          padding: 1.5rem;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(16px);
        }
        .report-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(71, 85, 105, .7) transparent; }
        .report-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .report-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .report-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, .7); border-radius: 999px; }
        @keyframes reportFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [class*="reportFade"] { animation: none !important; } }
      `}</style>
    </main>
  )
}

function Overview({ metrics }) {
  return <div className="space-y-6">
    <section className="report-panel grid divide-y divide-slate-800 overflow-hidden p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-6">
      <Summary icon={BarChart3} tone={Number(metrics.score) >= 0 ? "green" : "red"} label="Overall score" value={metrics.score} strong />
      <Summary icon={Check} tone="green" label="Accuracy" value={percent(metrics.accuracy)} />
      <Summary icon={Target} tone="blue" label="Attempt rate" value={percent(metrics.attemptRate)} />
      <Summary icon={TrendingUp} tone="blue" label="Workout time" value={timeLabel(metrics.totalTime)} compact />
      <Summary icon={Lightbulb} tone="blue" label="Tier" value={metrics.tier} compact />
      <Summary icon={Check} tone="blue" label="Questions completed" value={`${metrics.attempted}/${metrics.total}`} />
    </section>

    <section className="report-panel grid gap-7 lg:grid-cols-[220px_1fr] lg:items-center">
      <ProgressRing value={metrics.accuracy} label="Overall accuracy" />
      <div className="grid gap-5 sm:grid-cols-3"><Meter label="Overall accuracy" value={metrics.accuracy} tone="green" /><Meter label="Overall completion" value={metrics.attemptRate} tone="blue" /><Meter label="Average time per question" value={null} display={timeLabel(metrics.averageTime)} tone="blue" /></div>
    </section>

    <section className="report-panel"><Eyebrow>Today's verdict</Eyebrow><p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">{metrics.verdict}</p></section>

    <section className="report-panel"><Eyebrow>Key takeaways</Eyebrow><div className="mt-5 grid gap-3 md:grid-cols-2">
      <Takeaway icon={Check} tone="emerald" label="Strongest area" value={metrics.strongest.label} />
      <Takeaway icon={AlertCircle} tone="amber" label="Biggest weakness" value={metrics.weakest.label} />
      <Takeaway icon={Target} tone="blue" label="Highest improvement opportunity" value={metrics.opportunity.label} />
      <Takeaway icon={TrendingUp} tone="violet" label="Potential score recovery" value={metrics.potentialGain > 0 ? `${metrics.potentialGain.toFixed(2)} points in negative skill impact` : "No negative skill contribution recorded"} />
    </div></section>
    <ContributionChart metrics={metrics} />
  </div>
}

function Performance({ metrics }) {
  return <div className="space-y-6"><section className="report-panel overflow-hidden p-0"><div className="report-scrollbar overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Section", "Questions", "Attempted", "Correct", "Wrong", "Skipped", "Accuracy", "Score", "Time"].map((head) => <th key={head} className="px-5 py-4 font-semibold">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-800/80">{metrics.sections.map((section) => { const strongest = section.id === metrics.strongest.id; const weakest = section.id === metrics.weakest.id; return <tr key={section.id} className={`transition-colors hover:bg-slate-800/35 ${strongest ? "bg-emerald-500/[0.035]" : weakest ? "bg-red-500/[0.035]" : ""}`}><td className={`border-l-2 px-5 py-5 font-semibold ${strongest ? "border-emerald-400 text-emerald-200" : weakest ? "border-red-400 text-red-200" : "border-transparent text-white"}`}>{section.label}</td><td className="px-5 py-5">{section.total}</td><td className="px-5 py-5"><Badge tone="blue">{section.attempted}</Badge></td><td className="px-5 py-5"><Badge tone="green">{section.correct}</Badge></td><td className="px-5 py-5"><Badge tone="red">{section.wrong}</Badge></td><td className="px-5 py-5"><Badge tone="amber">{section.skipped}</Badge></td><td className="px-5 py-5 font-medium text-emerald-300">{percent(section.accuracy)}</td><td className={`px-5 py-5 font-medium tabular-nums ${section.score > 0 ? "text-emerald-300" : section.score < 0 ? "text-red-300" : "text-slate-400"}`}>{section.score.toFixed(2)}</td><td className="px-5 py-5 text-blue-300">{timeLabel(section.displayTime)}</td></tr>})}</tbody></table></div></section>
    <section className="report-panel grid grid-cols-2 gap-5 sm:grid-cols-5"><Summary label="Total questions" value={metrics.total} /><Summary label="Correct" value={metrics.correct} /><Summary label="Wrong" value={metrics.wrong} /><Summary label="Skipped" value={metrics.skipped} /><Summary label="Net score" value={metrics.score} strong /></section></div>
}

function SectionAnalysis({ metrics }) {
  return <section className="space-y-3">{metrics.sections.map((section, index) => <details key={section.id} open={index === 0} className="group report-panel p-0 transition-shadow duration-200 hover:shadow-[0_20px_55px_rgba(0,0,0,.18)]"><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 sm:px-6"><div><p className="font-semibold text-white">{section.label}</p><p className="mt-1 text-xs text-slate-500">{section.attempted} of {section.total} attempted · {percent(section.accuracy)} accuracy · {timeLabel(section.displayTime)}</p></div><ChevronDown className="text-slate-500 transition-transform group-open:rotate-180" size={20} /></summary><div className="border-t border-slate-800 px-5 py-6 sm:px-6"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><ProgressMetric label="Accuracy" value={section.accuracy} tone="green" /><ProgressMetric label="Coverage" value={section.attemptRate} tone={section.attemptRate < 60 ? "amber" : "blue"} /><ProgressMetric label="Time efficiency" value={section.timeEfficiency} tone="blue" unavailable={section.timeEfficiency == null} /><ProgressMetric label="Confidence" value={section.attemptRate} tone={section.attemptRate < 60 ? "amber" : "blue"} /></div><div className="mt-6 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-3"><MiniMetric label="Score" value={section.score.toFixed(2)} /><MiniMetric label={section.timeMode === "total" ? "Total time" : "Average time"} value={timeLabel(section.displayTime)} /><MiniMetric label="Mistake pattern" value={section.pattern} /></div><div className="mt-6 grid gap-5 border-t border-slate-800 pt-5 md:grid-cols-2"><div><Eyebrow>Weakness summary</Eyebrow><p className="mt-2 text-sm leading-6 text-slate-400">{section.weakness}</p></div><div><Eyebrow>Section verdict</Eyebrow><p className="mt-2 text-sm leading-6 text-slate-300">{section.verdict}</p></div></div></div></details>)}</section>
}

function Insights({ metrics }) {
  const panels = [
    { icon: Check, title: "Strengths", text: `${metrics.highestScoring.label} contributed the highest section score (${metrics.highestScoring.score.toFixed(2)}), with ${metrics.highestScoring.correct} correct responses.` },
    { icon: AlertCircle, title: "Weaknesses", text: `${metrics.lowestScoring.label} produced today's lowest section score (${metrics.lowestScoring.score.toFixed(2)}) with ${metrics.lowestScoring.wrong} wrong and ${metrics.lowestScoring.skipped} skipped responses.` },
    { icon: BarChart3, title: "Behavior analysis", text: `${metrics.mostSkipped.label} contained the most skipped questions (${metrics.mostSkipped.skipped}). Overall coverage was ${percent(metrics.attemptRate)}, compared with ${percent(metrics.accuracy)} accuracy on attempted questions.` },
    { icon: Target, title: "Improvement priority", text: metrics.opportunity.wrong >= 2 ? `Converting two incorrect ${metrics.opportunity.label} responses would address the largest concentration of avoidable losses.` : `${metrics.opportunity.label} has the clearest opportunity: ${metrics.opportunity.wrong + metrics.opportunity.skipped} responses were incorrect or left open.` },
  ]
  return <div className="space-y-6"><section className="grid gap-4 md:grid-cols-2">{panels.map(({ icon: Icon, title, text }) => <article key={title} className="report-panel"><Icon className="text-blue-300" size={20} /><h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></article>)}</section><section className="report-panel"><Eyebrow>Action plan</Eyebrow><ol className="mt-5 space-y-4">{metrics.actions.map((action, index) => <li key={action} className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-300">{index + 1}</span><p className="pt-0.5 text-sm leading-6 text-slate-300">{action}</p></li>)}</ol></section><ContributionChart metrics={metrics} /></div>
}

function Solutions({ metrics, onOpenSolutions }) {
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{metrics.sections.map((section) => <button key={section.id} type="button" onClick={onOpenSolutions} className="report-panel group text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><p className="font-semibold text-white group-hover:text-blue-200">{section.label} {section.id.startsWith("rc") ? "Review" : "Solutions"}</p><div className="mt-5 grid grid-cols-4 gap-2 text-center"><MiniMetric label="Correct" value={section.correct} /><MiniMetric label="Wrong" value={section.wrong} /><MiniMetric label="Skipped" value={section.skipped} /><MiniMetric label="Questions" value={section.total} /></div><p className="mt-5 text-xs font-medium text-blue-300">Open detailed review →</p></button>)}</section>
}

function ContributionChart({ metrics }) {
  const max = Math.max(1, ...metrics.contributions.map((item) => Math.abs(item.score)))
  return <section className="report-panel"><div className="flex items-end justify-between gap-4"><div><Eyebrow>Score impact analysis</Eyebrow><h2 className="mt-2 text-lg font-semibold">Contribution by skill</h2></div></div><div className="mt-6 space-y-4">{metrics.contributions.map((item) => <div key={item.skill} className="grid gap-2 sm:grid-cols-[180px_1fr_70px] sm:items-center"><span className="truncate text-sm capitalize text-slate-300">{item.skill}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-[width] duration-500 ${item.score > 0 ? "bg-emerald-500" : item.score < 0 ? "bg-red-500" : "bg-slate-500"}`} style={{ width: `${Math.max(item.score === 0 ? 2 : 8, Math.abs(item.score) / max * 100)}%` }} /></div><span className={`text-right text-sm font-medium tabular-nums ${item.score > 0 ? "text-emerald-300" : item.score < 0 ? "text-red-300" : "text-slate-400"}`}>{item.score.toFixed(2)}</span></div>)}</div><div className="mt-7 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-3"><MiniMetric label="Biggest score loss" value={metrics.biggestLoss ? `${metrics.biggestLoss.skill}: ${metrics.biggestLoss.score.toFixed(2)}` : "None"} /><MiniMetric label="Biggest contributor" value={metrics.biggestContributor ? `${metrics.biggestContributor.skill}: +${metrics.biggestContributor.score.toFixed(2)}` : "None"} /><MiniMetric label="Potential score recovery" value={metrics.potentialGain.toFixed(2)} /></div></section>
}

function buildMetrics(workout, result, skillMap, totalScore, timings) {
  const sections = SECTIONS.map(({ id, label }) => {
    const stats = result[id]
    const total = workout[id].questions.length
    const attempted = stats.correct + stats.wrong
    const skipped = stats.unattempted
    const accuracy = attempted ? stats.correct / attempted * 100 : 0
    const attemptRate = total ? attempted / total * 100 : 0
    const pattern = stats.wrong > skipped ? "Incorrect choices" : skipped > stats.wrong ? "Skipped questions" : stats.wrong ? "Mixed losses" : "No recorded errors"
    const confidence = attemptRate >= 85 ? "High coverage" : attemptRate >= 60 ? "Moderate coverage" : "Low coverage"
    const weakness = stats.wrong || skipped ? `${stats.wrong} incorrect and ${skipped} skipped response${stats.wrong + skipped === 1 ? "" : "s"} limited this section.` : "No weakness surfaced in the recorded responses."
    const elapsed = timings?.[id] ?? null
    const timeMode = id === "rc1" || id === "rc2" ? "total" : "average"
    const displayTime = elapsed == null ? null : timeMode === "total" ? elapsed : elapsed / Math.max(total, 1)
    const timeBudget = id === "speed" ? total * 30 : id === "vocab" ? 300 : id === "rc1" ? 420 : id === "rc2" ? 480 : 300
    const timeEfficiency = elapsed == null ? null : Math.max(0, Math.min(100, (1 - elapsed / timeBudget) * 100))
    const verdict = `${label} finished at ${percent(accuracy)} accuracy with ${percent(attemptRate)} coverage and a ${stats.score.toFixed(2)} section score.`
    return { id, label, ...stats, total, attempted, skipped, accuracy, attemptRate, pattern, confidence, weakness, verdict, elapsed, displayTime, timeMode, timeEfficiency }
  })
  const total = sections.reduce((sum, section) => sum + section.total, 0)
  const correct = sections.reduce((sum, section) => sum + section.correct, 0)
  const wrong = sections.reduce((sum, section) => sum + section.wrong, 0)
  const skipped = sections.reduce((sum, section) => sum + section.skipped, 0)
  const attempted = correct + wrong
  const accuracy = attempted ? correct / attempted * 100 : 0
  const attemptRate = total ? attempted / total * 100 : 0
  const ranked = [...sections].sort((a, b) => b.accuracy - a.accuracy || b.attemptRate - a.attemptRate)
  const strongest = ranked[0]
  const weakest = [...ranked].reverse()[0]
  const opportunity = [...sections].sort((a, b) => (b.wrong + b.skipped) - (a.wrong + a.skipped))[0]
  const contributions = Object.entries(skillMap).map(([skill, data]) => ({ skill: skill.replaceAll("_", " "), score: data.netScore })).sort((a, b) => b.score - a.score)
  const biggestContributor = contributions.find((item) => item.score > 0)
  const biggestLoss = [...contributions].reverse().find((item) => item.score < 0)
  const potentialGain = contributions.reduce((sum, item) => sum + (item.score < 0 ? Math.abs(item.score) : 0), 0)
  const highestScoring = [...sections].sort((a, b) => b.score - a.score)[0]
  const lowestScoring = [...sections].sort((a, b) => a.score - b.score)[0]
  const mostSkipped = [...sections].sort((a, b) => b.skipped - a.skipped)[0]
  const totalTime = timings ? Object.values(timings).reduce((sum, seconds) => sum + seconds, 0) : null
  const averageTime = totalTime == null ? null : totalTime / Math.max(total, 1)
  const tier = totalScore > 25 ? "Strong" : totalScore > 15 ? "Developing" : "Foundation"
  const verdict = `You attempted ${percent(attemptRate)} of the workout at ${percent(accuracy)} accuracy. ${strongest.label} was the strongest section, while ${weakest.label} created the greatest consistency gap. ${opportunity.label} offers the clearest improvement opportunity based on wrong and skipped responses.`
  const actions = [
    `Priority 1 — Review ${lowestScoring.label} first because its ${lowestScoring.score.toFixed(2)} score was the largest constraint on today's total.`,
    weakest.wrong > 0 ? `Priority 2 — Improve ${weakest.label} accuracy from ${percent(weakest.accuracy)} by reviewing its ${weakest.wrong} incorrect response${weakest.wrong === 1 ? "" : "s"} and the associated solution logic.` : `Priority 2 — Establish an accuracy baseline in ${weakest.label}; its skipped responses left no attempted-question evidence to evaluate.`,
    `Priority 3 — Recover coverage in ${mostSkipped.label}, which contained ${mostSkipped.skipped} of today's ${skipped} skipped questions.`,
  ]
  return { sections, total, correct, wrong, skipped, attempted, accuracy, attemptRate, strongest, weakest, opportunity, contributions, biggestContributor, biggestLoss, potentialGain, highestScoring, lowestScoring, mostSkipped, totalTime, averageTime, tier, verdict, actions, score: totalScore.toFixed(2) }
}

function Summary({ icon: Icon, tone = "blue", label, value, strong, compact }) { const accents = { green: "text-emerald-300 bg-emerald-500/10 shadow-emerald-950/20", blue: "text-blue-300 bg-blue-500/10 shadow-blue-950/20", amber: "text-amber-300 bg-amber-500/10 shadow-amber-950/20", red: "text-red-300 bg-red-500/10 shadow-red-950/20" }; return <div className="group px-5 py-5 transition-colors hover:bg-slate-800/25">{Icon && <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg shadow-lg ${accents[tone]}`}><Icon size={16} aria-hidden="true" /></div>}<p className="text-xs text-slate-500">{label}</p><p className={`mt-1 font-semibold tabular-nums ${strong ? "text-2xl text-white" : compact ? "text-base text-slate-200" : "text-xl text-white"}`}><AnimatedValue value={value} /></p></div> }
function MiniMetric({ label, value }) { return <div><p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-200">{value}</p></div> }
function Eyebrow({ children }) { return <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</p> }
function Badge({ tone, children }) { const colors = { green: "bg-emerald-500/10 text-emerald-300", red: "bg-red-500/10 text-red-300", amber: "bg-amber-500/10 text-amber-300", blue: "bg-blue-500/10 text-blue-300" }; return <span className={`inline-flex min-w-8 justify-center rounded-md px-2 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span> }
function Meter({ label, value, display, tone = "blue" }) { const fill = tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-blue-500"; return <div><div className="flex justify-between gap-3 text-sm"><span className="text-slate-400">{label}</span><span className="text-right font-medium tabular-nums text-slate-200">{display ?? (value == null ? "Available for future workouts" : percent(value))}</span></div><div className="mt-3 h-1.5 rounded-full bg-slate-800">{value != null && <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${fill}`} style={{ width: `${value}%` }} />}</div></div> }
function ProgressMetric({ label, value, tone = "blue", unavailable }) { const fill = tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-blue-500"; return <div><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-400">{label}</span><span className={`text-xs font-semibold tabular-nums ${tone === "green" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-blue-300"}`}>{unavailable ? "Available for future workouts" : percent(value)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">{!unavailable && <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${fill}`} style={{ width: `${value}%` }} />}</div></div> }
function ProgressRing({ value, label }) { return <div className="mx-auto grid h-40 w-40 place-items-center rounded-full transition-transform duration-300 hover:scale-[1.02]" style={{ background: `conic-gradient(#10b981 ${value}%, #1e293b 0)` }}><div className="grid h-32 w-32 place-items-center rounded-full bg-slate-900 text-center"><div><p className="text-3xl font-semibold tabular-nums text-emerald-300">{percent(value)}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div></div></div> }
function Takeaway({ icon: Icon, tone, label, value }) { const colors = { emerald: "text-emerald-300 bg-emerald-500/10", amber: "text-amber-300 bg-amber-500/10", blue: "text-blue-300 bg-blue-500/10", violet: "text-violet-300 bg-violet-500/10" }; return <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/35 p-4"><span className={`h-fit rounded-lg p-2 ${colors[tone]}`}><Icon size={17} /></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-200">{value}</p></div></div> }
function percent(value) { return `${Number(value || 0).toFixed(1)}%` }
function timeLabel(seconds) { if (seconds == null) return "Available for future workouts"; const rounded = Math.max(0, Math.round(seconds)); const minutes = Math.floor(rounded / 60); const remainder = rounded % 60; return minutes ? `${minutes}m ${String(remainder).padStart(2, "0")}s` : `${remainder}s` }
function AnimatedValue({ value }) {
  const text = String(value)
  const match = text.match(/^(-?\d+(?:\.\d+)?)(%)?$/)
  const [display, setDisplay] = useState(match ? 0 : value)
  useEffect(() => {
    if (!match) { setDisplay(value); return }
    const target = Number(match[1]); const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0; const startedAt = performance.now(); let frame
    const tick = (now) => { const progress = Math.min(1, (now - startedAt) / 500); const eased = 1 - Math.pow(1 - progress, 3); setDisplay(`${(target * eased).toFixed(decimals)}${match[2] || ""}`); if (progress < 1) frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [value])
  return display
}
