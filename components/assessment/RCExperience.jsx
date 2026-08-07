"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Target } from "lucide-react"

export function RCTestExperience({ passage, questions, currentIndex, answers, timeLeft, questionTimes, difficulty, onAnswer, onMove, onSubmit }) {
  const [activeParagraph, setActiveParagraph] = useState(0)
  const paragraphs = useMemo(() => passage.split(/\n\s*\n/).filter(Boolean), [passage])
  const question = questions[currentIndex]
  const answered = Object.keys(answers).length
  const elapsed = Object.values(questionTimes || {}).reduce((sum, value) => sum + value, 0)
  const average = answered ? Math.round(elapsed / answered) : 0

  useEffect(() => {
    function handleKey(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft" && currentIndex > 0) onMove(currentIndex - 1)
      if (event.key === "ArrowRight" && currentIndex < questions.length - 1) onMove(currentIndex + 1)
      if (event.key === "Enter") currentIndex < questions.length - 1 ? onMove(currentIndex + 1) : onSubmit()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentIndex, questions.length, onMove, onSubmit])

  if (!question) return null
  const pace = average === 0 ? "Starting" : average < 15 ? "Fast" : average <= 45 ? "On pace" : "Deliberate"

  return <main className="mx-auto w-full max-w-[1380px] px-3 py-4 text-slate-100 sm:px-5">
    <header className="rc-panel mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-300">RC Practice</p><p className="mt-1 text-sm text-slate-400">{answered} of {questions.length} answered</p></div>
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${timeLeft <= 30 ? "border-red-500/35 bg-red-500/10 text-red-200" : timeLeft < 120 ? "border-amber-500/35 bg-amber-500/10 text-amber-200" : "border-blue-500/30 bg-blue-500/10 text-blue-200"}`}><Clock3 size={20} /><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] opacity-70">Time left</p><p className="font-mono text-2xl font-semibold tabular-nums">{formatTime(timeLeft)}</p></div><div className="ml-3 border-l border-current/20 pl-3 text-xs"><p>Avg/question: {average || "—"}s</p><p className="mt-1">Pace: {pace}</p></div></div>
    </header>

    <div className="grid gap-4 lg:grid-cols-[55fr_45fr]">
      <section className="rc-panel rc-scrollbar min-w-0 p-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto sm:p-7">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.17em] text-teal-300">Passage</p><p className="mt-1 text-xs text-slate-500">{passage.trim().split(/\s+/).length} words · approximately {Math.max(1, Math.ceil(passage.trim().split(/\s+/).length / 220))} min reading</p></div><span className="text-xs text-slate-500">Paragraph {activeParagraph + 1}/{paragraphs.length}</span></div>
        <div className="mt-4 h-1.5 rounded-full bg-slate-800"><div className="h-full rounded-full bg-teal-500 transition-[width] duration-500" style={{ width: `${((activeParagraph + 1) / Math.max(paragraphs.length, 1)) * 100}%` }} /></div>
        <div className="mt-6 space-y-3">{paragraphs.map((paragraph, index) => <button key={index} type="button" onClick={() => setActiveParagraph(index)} className={`block w-full rounded-xl border p-4 text-left text-[16px] leading-8 transition-colors sm:p-5 sm:text-[17px] ${activeParagraph === index ? "border-teal-500/30 bg-teal-500/[.055] text-slate-100" : "border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/40"}`}><span className="mr-3 text-xs font-bold text-teal-400/70">{String(index + 1).padStart(2, "0")}</span>{paragraph}</button>)}</div>
      </section>

      <section className="min-w-0 space-y-4">
        <div className="rc-panel p-4"><div className="rc-scrollbar flex gap-2 overflow-x-auto">{questions.map((item, index) => { const selected = index === currentIndex; const hasAnswer = answers[index] !== undefined; return <button key={index} type="button" onClick={() => onMove(index)} className={`flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${selected ? "border-blue-400 bg-blue-500/15 text-blue-200 shadow-[0_0_14px_rgba(59,130,246,.13)]" : hasAnswer ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-500"}`}>Q{index + 1}</button> })}</div></div>
        <article className="rc-panel p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2"><Chip label={`Question ${currentIndex + 1} of ${questions.length}`} tone="blue" /></div>
          <h1 className="mt-5 text-lg font-semibold leading-8 text-white sm:text-xl">{question.prompt}</h1>
          <div className="mt-6 space-y-3">{question.options.map((option, optionIndex) => <button key={optionIndex} type="button" onClick={() => onAnswer(optionIndex)} className={`flex min-h-14 w-full items-start gap-3 rounded-xl border p-4 text-left leading-6 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${answers[currentIndex] === optionIndex ? "border-blue-400 bg-blue-500/15 text-white" : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800"}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>
        </article>
        <div className="rc-panel sticky bottom-3 flex items-center justify-between gap-3 p-3 backdrop-blur-xl"><NavButton label="Previous" icon={ChevronLeft} disabled={currentIndex === 0} onClick={() => onMove(currentIndex - 1)} /><span className="text-xs font-medium text-slate-400">Question {currentIndex + 1} of {questions.length}</span>{currentIndex < questions.length - 1 ? <NavButton label="Next" icon={ChevronRight} right onClick={() => onMove(currentIndex + 1)} /> : <button type="button" onClick={onSubmit} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Submit Test</button>}</div>
      </section>
    </div><SharedStyles /></main>
}

const REPORT_TABS = ["Overview", "Performance", "Insights", "Detailed Review"]

export function RCReport({ passage, questions, answers, result, score, totalTime, averageTime, onDetailed, onContinue, continueLabel }) {
  const [tab, setTab] = useState("Overview")
  const rows = useMemo(() => buildRows(questions, answers, result), [questions, answers, result])
  const attempted = rows.filter((row) => row.status !== "Skipped").length
  const accuracy = attempted ? Math.round(rows.filter((row) => row.status === "Correct").length / attempted * 100) : 0
  const skillStats = getSkillStats(rows)
  const weakest = [...skillStats].sort((a, b) => a.accuracy - b.accuracy)[0]
  const strongest = [...skillStats].sort((a, b) => b.accuracy - a.accuracy)[0]

  if (tab === "Detailed Review") return <RCSolutions passage={passage} questions={questions} answers={answers} result={result} onBack={() => setTab("Overview")} />

  return <main className="mx-auto w-full max-w-[1280px] px-3 py-6 text-slate-100 sm:px-6"><header><p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">RC Complete <Check className="ml-1 inline" size={14} /></p><h1 className="mt-2 text-3xl font-semibold">RC Performance Report</h1></header><nav className="rc-scrollbar my-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-1.5">{REPORT_TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={`min-w-max flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${tab === item ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900"}`}>{item}</button>)}</nav><div key={tab} className="animate-[rcFade_220ms_ease-out]">
    {tab === "Overview" && <div className="space-y-5"><section className="rc-panel grid grid-cols-2 divide-x divide-y divide-slate-800 overflow-hidden p-0 md:grid-cols-5 md:divide-y-0"><Metric label="Overall Score" value={`${score}/${questions.length}`} tone="blue" /><Metric label="Accuracy" value={`${accuracy}%`} tone="green" /><Metric label="Time" value={`${totalTime}s`} /><Metric label="Attempt" value={`${attempted}/${questions.length}`} tone={attempted < questions.length ? "amber" : "blue"} /><Metric label="Average/question" value={`${averageTime}s`} /></section>{skillStats.length > 0 && <section className="rc-panel grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{skillStats.map((skill) => <Progress key={skill.name} label={skill.name} value={skill.accuracy} />)}</section>}<section className="rc-panel"><p className="text-xs font-semibold uppercase tracking-[.17em] text-blue-300">AI Verdict</p><p className="mt-3 leading-7 text-slate-300">{result.summary}</p></section></div>}
    {tab === "Performance" && <PerformanceTable rows={rows} />}
    {tab === "Insights" && <div className="space-y-5"><section className="grid gap-4 md:grid-cols-2"><Insight title="Strengths" text={result.strengths?.join(" ") || (strongest ? `${strongest.name} was strongest at ${strongest.accuracy}% accuracy.` : result.summary)} tone="green" /><Insight title="Weaknesses" text={result.weaknesses?.join(" ") || (weakest ? `${weakest.name} was weakest at ${weakest.accuracy}% accuracy.` : result.summary)} tone="red" /><Insight title="Time management" text={`${rows.filter((row) => row.time < 15).length} rushed and ${rows.filter((row) => row.time > 45).length} over-time responses were recorded.`} tone="blue" /><Insight title="Next focus" text={result.nextFocus || result.summary} tone="amber" /></section><section className="rc-panel"><p className="text-xs font-semibold uppercase tracking-[.17em] text-slate-500">Action plan</p><ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300"><li>1. Review incorrect {weakest?.name || "RC"} questions first because they produced the lowest recorded accuracy.</li><li>2. Revisit every answer completed in under 15 seconds to check for rushed elimination.</li><li>3. Compare skipped questions with the passage evidence before the next timed attempt.</li></ol></section></div>}
  </div><div className="mt-6 flex flex-wrap gap-3"><button onClick={onDetailed} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">Open Solutions</button><button onClick={onContinue} className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500">{continueLabel}</button></div><SharedStyles /></main>
}

export function RCSolutions({ passage, questions, answers, result, onBack }) {
  const [index, setIndex] = useState(0)
  const rows = useMemo(() => buildRows(questions, answers, result), [questions, answers, result])
  const row = rows[index]
  useEffect(() => { const handler = (event) => { if (event.key === "ArrowLeft" && index > 0) setIndex(index - 1); if (event.key === "ArrowRight" && index < rows.length - 1) setIndex(index + 1); const number = Number(event.key); if (number >= 1 && number <= rows.length) setIndex(number - 1) }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler) }, [index, rows.length])
  return <RCReviewExperience passage={passage} questions={questions} answers={answers} result={result} onBack={onBack} />
  if (!row) return null
  return <main className="mx-auto w-full max-w-[1320px] px-3 py-5 text-slate-100 sm:px-5"><button onClick={onBack} className="mb-4 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">← Back to overview</button><div className="grid gap-5 lg:grid-cols-[25%_75%]"><aside className="rc-panel rc-scrollbar flex gap-2 overflow-x-auto p-3 lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)] lg:space-y-2 lg:overflow-y-auto">{rows.map((item, itemIndex) => <button key={item.index} onClick={() => setIndex(itemIndex)} className={`min-w-[170px] rounded-xl border p-3 text-left transition-all lg:block lg:w-full ${index === itemIndex ? "border-blue-400 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,.12)]" : item.status === "Correct" ? "border-emerald-500/25 bg-emerald-500/[.04]" : item.status === "Wrong" ? "border-red-500/25 bg-red-500/[.04]" : "border-amber-500/25 bg-amber-500/[.04]"}`}><div className="flex justify-between"><b>Q{item.index + 1}</b><span className="text-xs">{item.status}</span></div><p className="mt-2 text-xs text-slate-500">{item.difficulty || ""} {item.time != null ? `· ${item.time}s` : ""}</p></button>)}</aside><section className="min-w-0 space-y-4"><div className="rc-panel flex items-center justify-between p-4"><div><p className="text-xs text-blue-300">Question {index + 1} of {rows.length}</p><div className="mt-2 flex gap-2"><Chip label={row.status} tone={row.status === "Correct" ? "green" : row.status === "Wrong" ? "red" : "amber"} />{row.difficulty && <Chip label={row.difficulty} />}</div></div><div className="flex gap-2"><NavButton label="Previous" icon={ChevronLeft} disabled={index === 0} onClick={() => setIndex(index - 1)} /><NavButton label="Next" icon={ChevronRight} right disabled={index === rows.length - 1} onClick={() => setIndex(index + 1)} /></div></div><ReviewCard title="Passage" tone="teal"><p className="whitespace-pre-line text-[16px] leading-8 text-slate-300">{passage}</p></ReviewCard><ReviewCard title="Question" tone="blue"><h2 className="text-lg font-semibold leading-8">{row.question.prompt}</h2></ReviewCard><div className="space-y-3">{row.question.options.map((option, optionIndex) => { const correct = optionIndex === row.question.correctIndex; const chosenWrong = optionIndex === row.userAnswer && !correct; return <div key={optionIndex} className={`rounded-xl border p-4 ${correct ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : chosenWrong ? "border-red-500/40 bg-red-500/10 text-red-100 ring-1 ring-blue-400" : "border-slate-800 bg-slate-900/50 text-slate-300"}`}>{option}</div> })}</div>{row.analysis?.correctExplanation && <ReviewCard title="Explanation"><p className="whitespace-pre-line leading-8 text-slate-300">{row.analysis.correctExplanation}</p></ReviewCard>}{row.analysis?.temptation && <ReviewCard title="Thinking Trap" tone="amber" icon={AlertTriangle}><p className="leading-7 text-amber-100/80">{row.analysis.temptation}</p></ReviewCard>}{row.analysis?.whyWrong && Object.keys(row.analysis.whyWrong).length > 0 && <ReviewCard title="Why other options fail"><ul className="space-y-3 text-sm leading-6 text-slate-300">{Object.entries(row.analysis.whyWrong).map(([key, value]) => <li key={key}><b>Option {String.fromCharCode(65 + Number(key))}:</b> {value}</li>)}</ul></ReviewCard>}<div className="rc-panel sticky bottom-3 flex justify-between p-3"><NavButton label="Previous Question" icon={ChevronLeft} disabled={index === 0} onClick={() => setIndex(index - 1)} large /><NavButton label="Next Question" icon={ChevronRight} right disabled={index === rows.length - 1} onClick={() => setIndex(index + 1)} large /></div></section></div><SharedStyles /></main>
}

function RCReviewExperience({ passage, questions, answers, result, onBack }) {
  const [index, setIndex] = useState(0)
  const rows = useMemo(() => buildRows(questions, answers, result), [questions, answers, result])
  const row = rows[index]
  const paragraphs = useMemo(() => passage.split(/\n\s*\n/).filter(Boolean), [passage])

  useEffect(() => {
    function handleKeyboard(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft" && index > 0) setIndex(index - 1)
      if (event.key === "ArrowRight" && index < rows.length - 1) setIndex(index + 1)
      const number = Number(event.key)
      if (number >= 1 && number <= rows.length) setIndex(number - 1)
    }
    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [index, rows.length])

  if (!row) return null

  const analysis = row.analysis || {}
  const question = row.question
  const correctAnswer = question.options[question.correctIndex]
  const studentAnswer = row.userAnswer == null ? "Not attempted" : question.options[row.userAnswer]
  const trap = analysis.thinkingTrap || analysis.thinking_trap || analysis.trap || question.thinkingTrap || question.thinking_trap
  const strategy = analysis.strategyTip || analysis.strategy_tip || analysis.strategy || question.strategyTip || question.strategy
  const learning = analysis.keyLearning || analysis.key_learning || question.keyLearning || question.key_learning
  const accuracyMetadata = analysis.accuracy ?? question.accuracy
  const marksLabel = row.status === "Correct" ? "+1 gained" : "1 mark opportunity"

  return <main className="mx-auto w-full max-w-[1380px] px-3 py-5 text-slate-100 sm:px-5">
    <div className="mb-4 flex items-center justify-between gap-4"><button onClick={onBack} className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white">← Back to overview</button><p className="hidden text-xs text-slate-500 md:block">Keyboard: ← Previous · → Next · 1–{rows.length} Jump</p></div>
    <div className="grid gap-5 lg:grid-cols-[48%_52%]">
      <aside className="rc-panel rc-scrollbar min-w-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-300">Passage</p><p className="mt-1 text-xs text-slate-500">{passage.trim().split(/\s+/).length} words · {paragraphs.length} paragraphs</p></div><span className="rounded-lg bg-teal-500/10 px-2.5 py-1 text-xs text-teal-300">Always visible</span></div>
        <div className="mt-5 space-y-4">{paragraphs.map((paragraph, paragraphIndex) => <div key={paragraphIndex} className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-4 text-[16px] leading-8 text-slate-300 sm:p-5"><span className="mr-3 text-xs font-bold text-teal-400/70">{String(paragraphIndex + 1).padStart(2, "0")}</span>{paragraph}</div>)}</div>
      </aside>

      <section className="min-w-0">
        <div className="rc-panel rc-scrollbar mb-4 flex gap-2 overflow-x-auto p-3">{rows.map((item, itemIndex) => <button key={item.index} onClick={() => setIndex(itemIndex)} aria-label={`Question ${itemIndex + 1}: ${item.status}`} className={`flex min-w-[70px] flex-col items-center rounded-xl border px-3 py-2 text-xs transition-all ${index === itemIndex ? "border-blue-400 bg-blue-500/12 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,.12)]" : item.status === "Correct" ? "border-emerald-500/30 bg-emerald-500/[.06] text-emerald-300" : item.status === "Wrong" ? "border-red-500/30 bg-red-500/[.06] text-red-300" : "border-amber-500/30 bg-amber-500/[.06] text-amber-300"}`}><b>Q{itemIndex + 1}</b><span className="mt-1">{item.status}</span></button>)}</div>

        <article key={index} className="space-y-4 animate-[rcReviewSlide_220ms_ease-out]">
          <header className="rc-panel p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-300">Question {index + 1} of {rows.length}</p><div className="mt-3 flex flex-wrap gap-2"><Chip label={row.status} tone={row.status === "Correct" ? "green" : row.status === "Wrong" ? "red" : "amber"} />{row.difficulty && <Chip label={row.difficulty} />}{question.type && <Chip label={question.type} tone="blue" />}<Chip label={`${row.time}s`} /><Chip label={marksLabel} tone={row.status === "Correct" ? "green" : "amber"} />{accuracyMetadata != null && <Chip label={`${accuracyMetadata}% accuracy`} />}</div></div><div className="flex gap-2"><NavButton label="Previous" icon={ChevronLeft} disabled={index === 0} onClick={() => setIndex(index - 1)} /><NavButton label="Next" icon={ChevronRight} right disabled={index === rows.length - 1} onClick={() => setIndex(index + 1)} /></div></div></header>

          <ReviewCard title="Question" tone="blue"><h1 className="text-lg font-semibold leading-8 text-white sm:text-xl">{question.prompt}</h1></ReviewCard>
          <div className="space-y-3">{question.options.map((option, optionIndex) => { const correct = optionIndex === question.correctIndex; const userChoice = optionIndex === row.userAnswer; const chosenWrong = userChoice && !correct; return <div key={optionIndex} className={`flex items-start gap-3 rounded-xl border p-4 ${correct ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : chosenWrong ? "border-red-500/40 bg-red-500/10 text-red-100 ring-1 ring-blue-400/70" : "border-slate-800 bg-slate-900/50 text-slate-300"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${correct ? "bg-emerald-500/20 text-emerald-300" : chosenWrong ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-400"}`}>{correct ? <Check size={14} /> : String.fromCharCode(65 + optionIndex)}</span><span className="leading-6">{option}</span>{userChoice && <span className="ml-auto shrink-0 text-[11px] font-semibold text-blue-300">Your answer</span>}</div> })}</div>

          <div className="grid gap-3 sm:grid-cols-2"><AnswerCard label="Your answer" value={studentAnswer} tone={row.status === "Correct" ? "green" : row.status === "Skipped" ? "amber" : "red"} /><AnswerCard label="Correct answer" value={correctAnswer} tone="green" /></div>
          {analysis.correctExplanation && <ReviewCard title="Explanation"><p className="whitespace-pre-line text-[16px] leading-8 text-slate-300">{analysis.correctExplanation}</p></ReviewCard>}
          {trap && <ReviewCard title="Thinking Trap" tone="amber" icon={AlertTriangle}><p className="leading-7 text-amber-100/80">{trap}</p></ReviewCard>}
          {analysis.temptation && <ReviewCard title="Why this option looked tempting" tone="amber"><p className="leading-7 text-slate-300">{analysis.temptation}</p></ReviewCard>}
          {analysis.whyWrong && Object.keys(analysis.whyWrong).length > 0 && <ReviewCard title="Why other options fail"><ul className="space-y-3 text-sm leading-6 text-slate-300">{Object.entries(analysis.whyWrong).map(([key, value]) => <li key={key} className="rounded-lg border border-slate-800 bg-slate-950/30 p-3"><b>Option {String.fromCharCode(65 + Number(key))}:</b> {value}</li>)}</ul></ReviewCard>}
          {strategy && <ReviewCard title="Strategy Tip" tone="blue"><p className="leading-7 text-slate-300">{strategy}</p></ReviewCard>}
          {learning && <ReviewCard title="Key Learning" tone="green" icon={Check}><p className="leading-7 text-slate-300">{learning}</p></ReviewCard>}
          <footer className="rc-panel sticky bottom-3 flex items-center justify-between gap-3 p-3"><NavButton label="Previous Question" icon={ChevronLeft} disabled={index === 0} onClick={() => setIndex(index - 1)} large /><span className="hidden text-xs text-slate-500 sm:block">Question {index + 1} of {rows.length}</span><NavButton label="Next Question" icon={ChevronRight} right disabled={index === rows.length - 1} onClick={() => setIndex(index + 1)} large /></footer>
        </article>
      </section>
    </div><SharedStyles /><style jsx global>{`@keyframes rcReviewSlide{from{opacity:0;transform:translateX(6px)}to{opacity:1;transform:translateX(0)}}`}</style>
  </main>
}

function AnswerCard({ label, value, tone }) { const color = tone === "green" ? "border-emerald-500/25 bg-emerald-500/[.05] text-emerald-200" : tone === "red" ? "border-red-500/25 bg-red-500/[.05] text-red-200" : "border-amber-500/25 bg-amber-500/[.05] text-amber-200"; return <div className={`rounded-xl border p-4 ${color}`}><p className="text-xs opacity-60">{label}</p><p className="mt-2 text-sm font-medium leading-6">{value}</p></div> }

function buildRows(questions, answers, result) { return questions.map((question, index) => { const userAnswer = answers[index]; const status = userAnswer == null ? "Skipped" : Number(userAnswer) === Number(question.correctIndex) ? "Correct" : "Wrong"; const analysis = result.questionAnalysis?.find((item) => item.qIndex === index); return { index, question, userAnswer, status, analysis, time: analysis?.timeSpent ?? 0, difficulty: question.difficulty, marks: status === "Correct" ? 1 : 0 } }) }
function getSkillStats(rows) { const map = {}; rows.forEach((row) => { const name = row.question.type || "Inference"; if (!map[name]) map[name] = { name, total: 0, correct: 0 }; map[name].total++; if (row.status === "Correct") map[name].correct++ }); return Object.values(map).map((item) => ({ ...item, accuracy: Math.round(item.correct / item.total * 100) })) }
function PerformanceTable({ rows }) { return <section className="rc-panel rc-scrollbar overflow-x-auto p-0"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase text-slate-500"><tr>{["Question", "Difficulty", "Result", "Time", "Marks", "Skill", "Impact"].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{rows.map((row) => <tr key={row.index}><td className="px-5 py-4 font-semibold">Q{row.index + 1}</td><td className="px-5 py-4 capitalize">{row.difficulty || "—"}</td><td className="px-5 py-4"><Chip label={row.status} tone={row.status === "Correct" ? "green" : row.status === "Wrong" ? "red" : "amber"} /></td><td className="px-5 py-4">{row.time}s</td><td className={`px-5 py-4 ${row.marks > 0 ? "text-emerald-300" : "text-slate-500"}`}>{row.marks > 0 ? "+" : ""}{row.marks}</td><td className="px-5 py-4 capitalize">{row.question.type || "Inference"}</td><td className="px-5 py-4">{row.status === "Correct" ? "Positive" : row.status === "Wrong" ? "Potential +1" : "No attempt"}</td></tr>)}</tbody></table></section> }
function QuestionAccordions({ rows }) { return <div className="space-y-3">{rows.map((row) => <details key={row.index} className="group rc-panel p-0"><summary className="flex cursor-pointer list-none justify-between p-5"><span className="font-semibold">Question {row.index + 1}</span><ChevronDown className="transition-transform group-open:rotate-180" /></summary><div className="border-t border-slate-800 p-5"><div className="grid gap-3 sm:grid-cols-4"><Metric label="Time" value={`${row.time}s`} /><Metric label="Difficulty" value={row.difficulty || "—"} /><Metric label="Student answer" value={row.userAnswer == null ? "Skipped" : row.question.options[row.userAnswer]} /><Metric label="Correct answer" value={row.question.options[row.question.correctIndex]} tone="green" /></div>{row.analysis?.correctExplanation && <p className="mt-5 leading-7 text-slate-300">{row.analysis.correctExplanation}</p>}</div></details>)}</div> }
function Metric({ label, value, tone = "blue" }) { return <div className="p-5"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 font-semibold ${tone === "green" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-blue-200"}`}>{value}</p></div> }
function Progress({ label, value }) { return <div><div className="flex justify-between text-sm"><span className="capitalize text-slate-300">{label}</span><span className="text-emerald-300">{value}%</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${value}%` }} /></div></div> }
function Insight({ title, text, tone }) { const color = tone === "green" ? "border-emerald-500/25" : tone === "red" ? "border-red-500/25" : tone === "amber" ? "border-amber-500/25" : "border-blue-500/25"; return <section className={`rc-panel ${color}`}><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></section> }
function ReviewCard({ title, tone = "neutral", icon: Icon, children }) { const color = tone === "teal" ? "border-teal-500/25 bg-teal-500/[.03] text-teal-300" : tone === "blue" ? "border-blue-500/25 bg-blue-500/[.03] text-blue-300" : tone === "amber" ? "border-amber-500/25 bg-amber-500/[.05] text-amber-300" : tone === "green" ? "border-emerald-500/25 bg-emerald-500/[.04] text-emerald-300" : "border-slate-700 bg-slate-900/55 text-slate-400"; return <section className={`rounded-2xl border p-5 sm:p-7 ${color}`}><p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.17em]">{Icon && <Icon size={16} />}{title}</p>{children}</section> }
function Chip({ label, tone = "neutral" }) { const color = tone === "green" ? "bg-emerald-500/10 text-emerald-300" : tone === "red" ? "bg-red-500/10 text-red-300" : tone === "amber" ? "bg-amber-500/10 text-amber-300" : tone === "blue" ? "bg-blue-500/10 text-blue-300" : "bg-slate-800 text-slate-300"; return <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${color}`}>{label}</span> }
function NavButton({ label, icon: Icon, right, disabled, onClick, large }) { return <button disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 disabled:opacity-30 ${large ? "px-5 py-3" : "px-3 py-2 text-sm"}`}>{!right && <Icon size={16} />}{label}{right && <Icon size={16} />}</button> }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` }
function SharedStyles() { return <style jsx global>{`.rc-panel{border:1px solid rgba(51,65,85,.82);border-radius:20px;background:rgba(15,23,42,.62);padding:1.5rem;box-shadow:0 18px 50px rgba(0,0,0,.12);backdrop-filter:blur(16px)}.rc-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(71,85,105,.7) transparent}.rc-scrollbar::-webkit-scrollbar{width:5px;height:5px}.rc-scrollbar::-webkit-scrollbar-thumb{background:rgba(71,85,105,.7);border-radius:999px}@keyframes rcFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style> }
