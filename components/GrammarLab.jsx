"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, CheckCircle2, Clock3, History, Loader2, RotateCcw, Sparkles, Target, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { GRAMMAR_ONTOLOGY } from "@/lib/grammarOntology"

const titleizeTopic = (id) => id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
const TOPIC_NAMES = { "subject-verb-agreement": "Subject–Verb Agreement", "articles-determiners": "Articles & Determiners", "verbs-auxiliaries": "Verbs & Auxiliaries", "gerunds-infinitives-participles": "Gerunds, Infinitives & Participles", "clauses-phrases": "Clauses & Phrases", "sentence-structure-word-order": "Sentence Structure & Word Order", "active-passive-voice": "Active & Passive Voice", "direct-indirect-speech": "Direct & Indirect Speech", "common-errors-usage": "Common Errors & Usage", "sentence-correction-error-detection": "Sentence Correction & Error Detection" }
const TOPICS = Object.entries(GRAMMAR_ONTOLOGY).map(([id, definition]) => ({ id, name: TOPIC_NAMES[id] || titleizeTopic(id), group: "Grammar library", description: `Practise ${definition.skills.slice(0, 3).join(", ").toLowerCase()}, and related skills.` }))
const DIFFICULTIES = [
  { id: "easy", label: "Easy", note: "Core rules in clear contexts" },
  { id: "moderate", label: "Moderate", note: "Exam-style traps and layered clauses", recommended: true },
  { id: "hard", label: "Hard", note: "Subtle errors and competing signals" },
]
const ACTIVE_KEY = "auctor:grammar:active-attempt"
const draftKey = (id) => `auctor:grammar:draft:${id}`

async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error("Please sign in to practise grammar.")
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", ...options.headers, Authorization: `Bearer ${session.access_token}` } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.")
  return data
}

export default function GrammarLab({ onSessionActiveChange }) {
  const [screen, setScreen] = useState("home")
  const [topic, setTopic] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [session, setSession] = useState(null)
  const [answers, setAnswers] = useState({})
  const [times, setTimes] = useState({})
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState([])
  const [libraryCatalog, setLibraryCatalog] = useState([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const questionStarted = useRef(Date.now())

  useEffect(() => {
    const attemptId = window.localStorage.getItem(ACTIVE_KEY)
    if (!attemptId) return
    setBusy(true)
    authFetch(`/api/grammar/sessions/${attemptId}`).then((data) => {
      if (data.completed) {
        window.localStorage.removeItem(ACTIVE_KEY)
        setSession(data); setScreen("result")
      } else {
        const draft = JSON.parse(window.localStorage.getItem(draftKey(attemptId)) || "{}")
        setSession(data); setAnswers(draft.answers || {}); setTimes(draft.times || {}); setIndex(draft.index || 0); setScreen("practice")
      }
    }).catch(() => window.localStorage.removeItem(ACTIVE_KEY)).finally(() => setBusy(false))
  }, [])

  useEffect(() => { authFetch("/api/grammar/catalog?topicId=all").then((data) => setLibraryCatalog(data.topics || [])).catch(() => {}) }, [])

  useEffect(() => { questionStarted.current = Date.now() }, [index, screen])
  useEffect(() => {
    onSessionActiveChange?.(screen === "practice")
    return () => onSessionActiveChange?.(false)
  }, [screen, onSessionActiveChange])
  useEffect(() => {
    if (screen !== "practice" || !session?.attemptId) return
    window.localStorage.setItem(draftKey(session.attemptId), JSON.stringify({ answers, times, index }))
  }, [answers, times, index, screen, session?.attemptId])

  const loadCatalog = async (selectedTopic = topic) => {
    const data = await authFetch(`/api/grammar/catalog?topicId=${encodeURIComponent(selectedTopic.id)}`)
    setCatalog(data)
    return data
  }
  const chooseTopic = async (item) => {
    setTopic(item); setError(""); setBusy(true)
    try { await loadCatalog(item); setScreen("difficulty") } catch (reason) { setError(reason.message) } finally { setBusy(false) }
  }
  const chooseDifficulty = (difficulty) => { setSelectedDifficulty(difficulty); setScreen("sets") }
  const start = async (difficulty, testId) => {
    setError(""); setBusy(true); setScreen("loading")
    try {
      const data = await authFetch("/api/grammar/sessions", { method: "POST", body: JSON.stringify({ topicId: topic.id, difficulty, testId }) })
      setSession(data); setAnswers({}); setTimes({}); setIndex(0); window.localStorage.setItem(ACTIVE_KEY, data.attemptId); setScreen("practice")
    } catch (reason) { setError(reason.message); setScreen("sets") } finally { setBusy(false) }
  }
  const startSpecial = async (mode) => {
    setError(""); setBusy(true); setScreen("loading")
    try {
      const data = await authFetch("/api/grammar/sessions", { method: "POST", body: JSON.stringify({ mode, difficulty: "moderate" }) })
      setSession(data); setAnswers({}); setTimes({}); setIndex(0); window.localStorage.setItem(ACTIVE_KEY, data.attemptId); setScreen("practice")
    } catch (reason) { setError(reason.message); setScreen("home") } finally { setBusy(false) }
  }
  const recordElapsed = () => setTimes((current) => ({ ...current, [session.questions[index].id]: (current[session.questions[index].id] || 0) + Math.max(1, Math.round((Date.now() - questionStarted.current) / 1000)) }))
  const move = (next) => { recordElapsed(); setIndex(next) }
  const submit = async () => {
    if (Object.keys(answers).length !== session.questions.length) return setError("Answer every question before submitting.")
    recordElapsed(); setBusy(true); setError("")
    try {
      const currentTimes = { ...times, [session.questions[index].id]: (times[session.questions[index].id] || 0) + Math.max(1, Math.round((Date.now() - questionStarted.current) / 1000)) }
      const responses = session.questions.map((question) => ({ questionId: question.id, selectedOptionId: answers[question.id], responseTimeSec: currentTimes[question.id] || 0 }))
      const data = await authFetch(`/api/grammar/sessions/${session.attemptId}/submit`, { method: "POST", body: JSON.stringify({ responses }) })
      window.localStorage.removeItem(ACTIVE_KEY); window.localStorage.removeItem(draftKey(session.attemptId)); setSession(data); setScreen("result")
    } catch (reason) { setError(reason.message) } finally { setBusy(false) }
  }
  const loadHistory = async () => {
    setBusy(true); setError("")
    try { const data = await authFetch("/api/grammar/history"); setHistory(data.history); setScreen("history") } catch (reason) { setError(reason.message) } finally { setBusy(false) }
  }
  const openResult = async (attemptId) => {
    setBusy(true)
    try { setSession(await authFetch(`/api/grammar/sessions/${attemptId}`)); setScreen("result") } catch (reason) { setError(reason.message) } finally { setBusy(false) }
  }

  return <div className="min-h-full bg-slate-950 px-4 py-7 text-white md:px-8 md:py-10">
    <div className="mx-auto max-w-6xl">
      {error && <div role="alert" className="mb-5 flex items-start justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
      {busy && screen !== "loading" && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 backdrop-blur-sm"><Loader2 className="animate-spin text-violet-400" size={34} /></div>}
      {screen === "home" && <Home onTopics={() => setScreen("topics")} onHistory={loadHistory} onMixed={() => startSpecial("mixed")} onWeakness={() => startSpecial("weakness")} />}
      {screen === "topics" && <Topics catalog={libraryCatalog} onSelect={chooseTopic} onBack={() => setScreen("home")} />}
      {screen === "difficulty" && <Difficulty topic={topic} catalog={catalog} onChoose={chooseDifficulty} onBack={() => setScreen("topics")} />}
      {screen === "sets" && <SetList topic={topic} difficulty={selectedDifficulty} data={catalog?.difficulties?.[selectedDifficulty]} overall={catalog?.overall} onStart={(testId) => start(selectedDifficulty, testId)} onBack={() => setScreen("difficulty")} />}
      {screen === "loading" && <Loading topic={topic} />}
      {screen === "practice" && session && <Player session={session} index={index} answers={answers} onAnswer={(id) => setAnswers((current) => ({ ...current, [session.questions[index].id]: id }))} onMove={move} onSubmit={submit} onExit={() => setScreen("home")} busy={busy} />}
      {screen === "result" && session && <PracticeResult session={session} onAgain={async () => { if (session.topicId === "mixed-practice") return startSpecial("mixed"); if (session.topicId === "weakness-training") return startSpecial("weakness"); const item = TOPICS.find((entry) => entry.id === session.topicId) || topic; setTopic(item); setSelectedDifficulty(session.difficulty); try { await loadCatalog(item) } catch {} setScreen("sets") }} onHome={() => setScreen("home")} />}
      {screen === "history" && <HistoryView items={history} onOpen={openResult} onBack={() => setScreen("home")} />}
    </div>
  </div>
}

function Home({ onTopics, onHistory, onMixed, onWeakness }) { return <>
  <header className="mb-8 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40"><Brain /></div><div><h1 className="text-2xl font-bold md:text-3xl">Grammar Lab</h1><p className="mt-1 text-sm text-slate-400">Build precise language instincts through focused diagnosis.</p></div></div><button onClick={onHistory} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-violet-400 hover:text-white"><History className="mr-2 inline" size={16} />History</button></header>
  <section className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-950/80 via-slate-900 to-slate-950 p-7 md:p-11"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"/><div className="relative max-w-2xl"><p className="mb-3 text-xs font-bold tracking-[.2em] text-violet-300"><Sparkles className="mr-2 inline" size={15}/>INTELLIGENT GRAMMAR PRACTICE</p><h2 className="text-3xl font-bold leading-tight md:text-5xl">Find the rule.<br/>Expose the trap.</h2><p className="mt-5 max-w-xl leading-7 text-slate-300">Take a focused five-question session. Every set is quality-checked, and every result explains the exact reasoning behind your choices.</p><button onClick={onTopics} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold shadow-lg shadow-violet-900/40 transition hover:bg-violet-500">Choose a topic <ArrowRight size={18}/></button></div></section>
  <div className="mt-6 grid gap-4 md:grid-cols-3"><Feature icon={<Target/>} title="Topic Practice" text="Six high-value grammar areas, each at three difficulty levels."/><Feature icon={<Brain/>} title="Rich diagnosis" text="See the rule, trap and misconception behind every miss."/><Feature icon={<CheckCircle2/>} title="Progress saved" text="Resume interrupted sessions and revisit completed results."/></div>
  <div className="mt-8"><p className="mb-3 text-xs font-bold tracking-widest text-slate-500">TRAINING MODES</p><div className="grid gap-3 sm:grid-cols-3"><ModeCard label="Mixed Practice" text="Five stored questions across available topics." onClick={onMixed}/><ModeCard label="Weakness Training" text="Stored questions selected from your prior mistakes." onClick={onWeakness}/><Placeholder label="AI Challenge"/></div></div>
</> }
function Feature({ icon, title, text }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="mb-4 text-violet-400">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div> }
function Placeholder({ label }) { return <div className="rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-400">{label} · Coming later</div> }
function ModeCard({ label, text, onClick }) { return <button onClick={onClick} className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-4 text-left transition hover:border-violet-500"><span className="font-semibold text-white">{label}</span><span className="mt-2 block text-sm leading-5 text-slate-400">{text}</span></button> }
function Back({ onClick, children = "Back" }) { return <button onClick={onClick} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"><ArrowLeft size={17}/>{children}</button> }
function Topics({ catalog, onSelect, onBack }) { const byTopic = new Map(catalog.map((item) => [item.topicId, item])); return <><Back onClick={onBack}/><p className="text-xs font-bold tracking-[.2em] text-violet-400">TOPIC PRACTICE</p><h2 className="mt-2 text-3xl font-bold md:text-4xl">What do you want to master?</h2><p className="mt-3 text-slate-400">Choose one concept for a focused five-question session.</p>{[...new Set(TOPICS.map((item) => item.group))].map((group) => <section key={group} className="mt-8"><div className="mb-4 flex items-center gap-3"><h3 className="font-semibold text-slate-300">{group}</h3><div className="h-px flex-1 bg-slate-800"/></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TOPICS.filter((item) => item.group === group).map((item) => { const state = byTopic.get(item.id); const available = Number(state?.availableTests || 0); const ready = available > 0; return <button key={item.id} disabled={!ready} onClick={() => ready && onSelect(item)} className={`group rounded-2xl border p-5 text-left transition ${ready ? "border-slate-800 bg-slate-900/70 hover:-translate-y-0.5 hover:border-violet-500/50" : "cursor-not-allowed border-slate-800/70 bg-slate-950/40 opacity-65"}`}><div className="flex items-start justify-between"><BookOpen className={ready ? "text-violet-400" : "text-slate-600"} size={21}/>{ready ? <ArrowRight className="text-slate-600 group-hover:text-violet-400" size={18}/> : <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-500">NOT SEEDED</span>}</div><h4 className="mt-4 font-semibold">{item.name}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs"><span className={ready ? "text-slate-300" : "text-slate-500"}>{available}/30 tests · {Number(state?.availableQuestions || 0)} questions</span><span className="font-semibold text-violet-300">{Math.round(state?.overall?.percentage || 0)}%</span></div></button>})}</div></section>)}</> }
function Difficulty({ topic, catalog, onChoose, onBack }) { return <><Back onClick={onBack}/><div className="mx-auto max-w-4xl"><p className="text-xs font-bold tracking-[.2em] text-violet-400">{topic.name.toUpperCase()}</p><h2 className="mt-2 text-3xl font-bold md:text-4xl">Choose your challenge.</h2><p className="mt-3 text-slate-400">Thirty reusable sets · five stored questions each</p><Progress label="Overall topic progress" value={catalog?.overall?.percentage || 0} detail={`${catalog?.overall?.completed || 0}/30 sets`} /><div className="mt-8 grid gap-4 md:grid-cols-3">{DIFFICULTIES.map((item) => { const progress = catalog?.difficulties?.[item.id] || { completed: 0, total: 10, percentage: 0, sets: [] }; return <button key={item.id} onClick={() => onChoose(item.id)} className="relative rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-left transition hover:-translate-y-1 hover:border-violet-500/60">{item.recommended && <span className="absolute right-4 top-4 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">RECOMMENDED</span>}<div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-lg font-bold text-violet-300">{item.label[0]}</div><h3 className="mt-5 text-xl font-bold">{item.label}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{item.note}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-violet-500" style={{ width: `${progress.percentage}%` }}/></div><span className="mt-2 block text-sm font-semibold text-violet-300">{progress.completed}/10 · {progress.percentage}%</span></button>})}</div></div></> }
function Progress({ label, value, detail }) { return <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className="font-semibold text-violet-300">{detail} · {value}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400" style={{ width: `${value}%` }}/></div></div> }
function SetList({ topic, difficulty, data, overall, onStart, onBack }) { const sets = data?.sets || []; return <><Back onClick={onBack}>Difficulties</Back><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-400">{topic.name} · {difficulty}</p><h2 className="mt-2 text-3xl font-bold">Choose a stored set</h2><p className="mt-2 text-slate-400">Completed sets stay complete and can be practised again without generating new questions.</p><Progress label={`${difficulty[0].toUpperCase()}${difficulty.slice(1)} progress`} value={data?.percentage || 0} detail={`${data?.completed || 0}/10 sets`} /><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 10 }, (_, index) => { const set = sets[index]; return <button key={index} disabled={!set} onClick={() => set && onStart(set.testId)} className={`min-h-36 rounded-2xl border p-4 text-left transition ${set?.completed ? "border-emerald-500/30 bg-emerald-500/10" : set ? "border-slate-700 bg-slate-900 hover:border-violet-500" : "cursor-not-allowed border-dashed border-slate-800 bg-slate-950/40 opacity-50"}`}><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">SET {index + 1}/10</span>{set?.completed && <CheckCircle2 className="text-emerald-400" size={18}/>}</div><p className="mt-5 text-2xl font-bold">{set ? "5 questions" : "Not seeded"}</p><p className="mt-2 text-xs text-slate-500">{set?.completed ? `Completed · ${set.bestScore}/5` : set ? "Ready" : "Awaiting bank content"}</p></button>})}</div><p className="mt-6 text-sm text-slate-500">Overall topic progress: {overall?.completed || 0}/30 ({overall?.percentage || 0}%)</p></div></> }
function Loading({ topic }) { return <div className="grid min-h-[60vh] place-items-center text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/10"><Loader2 className="animate-spin text-violet-400" size={30}/></div><h2 className="mt-6 text-2xl font-bold">Loading your {topic?.name} session</h2><p className="mt-2 text-slate-400">Selecting a fresh set from the question bank…</p></div></div> }
function Player({ session, index, answers, onAnswer, onMove, onSubmit, onExit, busy }) { const question = session.questions[index]; const answered = Object.keys(answers).length; return <div className="mx-auto max-w-4xl"><div className="mb-5 flex items-center justify-between gap-3"><button onClick={onExit} className="text-sm text-slate-400 hover:text-white"><ArrowLeft className="mr-2 inline" size={17}/>Save & exit</button><span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold capitalize text-slate-300">{session.difficulty}</span></div><div className="mb-7"><div className="mb-2 flex justify-between text-xs text-slate-400"><span>{session.topicName}</span><span>{answered}/{session.questions.length} answered</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all" style={{ width: `${((index + 1) / session.questions.length) * 100}%` }}/></div></div><main className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 md:p-9"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-violet-400">Question {index + 1} of {session.questions.length}</p><p className="text-xs text-slate-500">{question.skill}</p></div><h2 className="mt-5 whitespace-pre-line text-lg font-medium leading-8 md:text-xl">{question.questionText}</h2><div className="mt-7 space-y-3">{question.options.map((option) => { const selected = answers[question.id] === option.id; return <button key={option.id} onClick={() => onAnswer(option.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-violet-400 bg-violet-500/15 text-white" : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${selected ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400"}`}>{selected ? <Check size={15}/> : option.label}</span><span className="leading-7">{option.text}</span></button>})}</div></main><div className="mt-5 flex items-center justify-between"><button disabled={index === 0} onClick={() => onMove(index - 1)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm disabled:opacity-30">Previous</button>{index < session.questions.length - 1 ? <button disabled={!answers[question.id]} onClick={() => onMove(index + 1)} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">Next <ArrowRight className="ml-2 inline" size={16}/></button> : <button disabled={busy || answered !== session.questions.length} onClick={onSubmit} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">{busy ? "Submitting…" : "Submit session"}</button>}</div></div> }
function Result({ session, onAgain, onHome }) { return <div className="mx-auto max-w-4xl"><section className="rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-950/70 via-slate-900 to-slate-950 p-7 md:p-10"><p className="text-xs font-bold tracking-[.2em] text-violet-400">SESSION COMPLETE</p><div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><h2 className="text-3xl font-bold md:text-4xl">{session.topicName}</h2><p className="mt-2 capitalize text-slate-400">{session.difficulty} practice</p></div><div className="text-left md:text-right"><div className="text-5xl font-black text-white">{session.score}<span className="text-2xl text-slate-500">/{session.totalQuestions}</span></div><p className="mt-1 text-sm text-slate-400">{Math.round(session.accuracy)}% accuracy · {formatTime(session.timeTakenSec)}</p></div></div></section><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Correct" value={session.score}/><Metric label="Accuracy" value={`${Math.round(session.accuracy)}%`}/><Metric label="Time" value={formatTime(session.timeTakenSec)}/></div><h3 className="mt-9 text-xl font-bold">Question review</h3><div className="mt-4 space-y-4">{session.questions.map((question, idx) => <details key={question.id} className={`rounded-2xl border bg-slate-900/70 ${question.isCorrect ? "border-emerald-500/20" : "border-rose-500/20"}`}><summary className="flex cursor-pointer list-none items-center gap-3 p-5"><span className={question.isCorrect ? "text-emerald-400" : "text-rose-400"}>{question.isCorrect ? <CheckCircle2/> : <XCircle/>}</span><span className="flex-1 font-medium">Question {idx + 1}</span><span className="text-sm text-slate-500">{question.skill}</span></summary><div className="border-t border-slate-800 px-5 pb-6 pt-5"><p className="whitespace-pre-line leading-7 text-slate-200">{question.questionText}</p><p className="mt-5 text-xs font-bold tracking-widest text-violet-400">CORE RULE</p><p className="mt-2 leading-7 text-slate-300">{question.explanation?.coreRule}</p><p className="mt-4 text-sm leading-7 text-slate-400">{question.explanation?.whyCorrect}</p>{question.selectedDiagnosis && <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="font-semibold text-amber-300">Why your choice failed</p><p className="mt-2 text-sm leading-6 text-slate-300">{question.selectedDiagnosis.whyChoiceFails}</p><p className="mt-2 text-xs text-slate-500">Trap: {question.selectedDiagnosis.trap} · {question.selectedDiagnosis.misconception}</p></div>}</div></details>)}</div><div className="mt-7 flex flex-wrap gap-3"><button onClick={onAgain} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold"><RotateCcw className="mr-2 inline" size={17}/>Practice again</button><button onClick={onHome} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300">Back to Grammar Lab</button></div></div> }
function Metric({ label, value }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div> }
function PracticeResult({ session, onAgain, onHome }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  useEffect(() => { setSelectedIndex(null) }, [session.attemptId])
  const question = selectedIndex == null ? null : session.questions[selectedIndex]
  return <div className="mx-auto max-w-4xl">
    <section className="rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-950/70 via-slate-900 to-slate-950 p-7 md:p-10">
      <p className="text-xs font-bold tracking-[.2em] text-violet-400">SESSION COMPLETE</p>
      <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><h2 className="text-3xl font-bold md:text-4xl">{session.topicName}</h2><p className="mt-2 capitalize text-slate-400">{session.difficulty} practice</p></div>
        <div className="text-left md:text-right"><div className="text-5xl font-black">{session.score}<span className="text-2xl text-slate-500">/{session.totalQuestions}</span></div><p className="mt-1 text-sm text-slate-400">{Math.round(session.accuracy)}% accuracy · {formatTime(session.timeTakenSec)}</p></div>
      </div>
    </section>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Correct" value={session.score}/><Metric label="Incorrect" value={session.totalQuestions - session.score}/><Metric label="Accuracy" value={`${Math.round(session.accuracy)}%`}/><Metric label="Time" value={formatTime(session.timeTakenSec)}/></div>
    <section className="sticky top-3 z-20 mt-9 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-5">
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.2em] text-violet-400">QUESTION REVIEW</p><p className="mt-1 text-sm text-slate-400">Choose a question to open its diagnosis.</p></div>{selectedIndex != null && <span className="hidden text-xs text-slate-500 sm:block">Reviewing {selectedIndex + 1} of {session.questions.length}</span>}</div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">{session.questions.map((item, idx) => {
        const unattempted = !item.selectedOptionId
        const active = selectedIndex === idx
        const tone = unattempted ? "border-slate-700 bg-slate-900 text-slate-400" : item.isCorrect ? "border-emerald-500/30 bg-emerald-500/[.07] text-emerald-300" : "border-rose-500/30 bg-rose-500/[.07] text-rose-300"
        return <button key={item.id} type="button" onClick={() => setSelectedIndex(idx)} aria-pressed={active} aria-label={`Question ${idx + 1}: ${unattempted ? "unattempted" : item.isCorrect ? "correct" : "incorrect"}`} className={`flex min-w-[4.6rem] items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${active ? "border-violet-400 bg-violet-500/15 text-white shadow-[0_0_20px_rgba(139,92,246,.18)]" : tone}`}><span>Q{idx + 1}</span><span aria-hidden="true">{unattempted ? "—" : item.isCorrect ? "✓" : "×"}</span></button>
      })}</div>
    </section>
    {question && <DiagnosisCard question={question} index={selectedIndex} />}
    <div className="mt-7 flex flex-wrap gap-3"><button onClick={onAgain} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold"><RotateCcw className="mr-2 inline" size={17}/>Practice again</button><button onClick={onHome} className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300">Back to Grammar Lab</button></div>
  </div>
}
function DiagnosisCard({ question, index }) {
  const selected = question.options.find((option) => option.id === question.selectedOptionId)
  const correct = question.options.find((option) => option.id === question.correctOptionId)
  const unattempted = !selected
  const status = unattempted ? "Unattempted" : question.isCorrect ? "Correct" : "Incorrect"
  const takeaway = concise(question.selectedDiagnosis?.misconception || question.selectedDiagnosis?.evidence || question.explanation?.coreRule)
  return <article className={`mt-5 overflow-hidden rounded-[1.75rem] border bg-slate-900/75 shadow-2xl shadow-black/20 ${unattempted ? "border-slate-700" : question.isCorrect ? "border-emerald-500/25" : "border-rose-500/25"}`}>
    <header className={`border-b px-5 py-5 sm:px-7 ${unattempted ? "border-slate-800 bg-slate-800/25" : question.isCorrect ? "border-emerald-500/15 bg-emerald-500/[.055]" : "border-rose-500/15 bg-rose-500/[.055]"}`}>
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold tracking-[.18em] text-slate-500">QUESTION {index + 1}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${unattempted ? "bg-slate-700/50 text-slate-300" : question.isCorrect ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>{unattempted ? <span aria-hidden="true">—</span> : question.isCorrect ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {status}</span></div>
      <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">{question.skill}</h3>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300 sm:text-base">{question.questionText}</p>
    </header>
    <div className="space-y-5 p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-2"><AnswerCard label="Your answer" option={selected} tone={question.isCorrect ? "success" : "error"}/>{!question.isCorrect && <AnswerCard label="Correct answer" option={correct} tone="success" prominent/>}</div>
      {question.isCorrect ? <>
        <LearningBlock eyebrow="WHY IT'S RIGHT" title="You got it." tone="success" text={concise(question.explanation?.whyCorrect)}/>
        <LearningBlock eyebrow="CORE RULE" tone="violet" text={concise(question.explanation?.coreRule)}/>
        <LearningBlock eyebrow="QUICK TAKEAWAY" tone="neutral" text={takeaway}/>
      </> : <>
        <LearningBlock eyebrow={unattempted ? "WHY THIS MATTERS" : "WHY YOU MISSED IT"} title={unattempted ? "Review the controlling rule." : undefined} tone="error" text={concise(question.selectedDiagnosis?.whyChoiceFails || question.explanation?.whyCorrect)}/>
        <LearningBlock eyebrow="THE RULE" tone="violet" text={concise(question.explanation?.coreRule)}/>
        {question.selectedDiagnosis && <LearningBlock eyebrow="THE TRAP" tone="amber" title={question.selectedDiagnosis.trap} text={concise(question.selectedDiagnosis.misconception || question.selectedDiagnosis.evidence)}/>}
        <LearningBlock eyebrow="REMEMBER THIS" tone="neutral" text={takeaway}/>
      </>}
      <p className="text-xs text-slate-600">Response time · {formatTime(question.responseTimeSec)}</p>
    </div>
  </article>
}
function LearningBlock({ eyebrow, title, text, tone }) { if (!text) return null; const styles = tone === "success" ? "border-emerald-500/20 bg-emerald-500/[.055]" : tone === "error" ? "border-rose-500/20 bg-rose-500/[.055]" : tone === "amber" ? "border-amber-500/20 bg-amber-500/[.055]" : tone === "violet" ? "border-violet-500/20 bg-violet-500/[.055]" : "border-slate-700 bg-slate-950/35"; return <section className={`rounded-2xl border p-4 sm:p-5 ${styles}`}><p className="text-[11px] font-bold tracking-[.18em] text-slate-500">{eyebrow}</p>{title && <h4 className="mt-2 font-semibold text-white">{title}</h4>}<p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></section> }
function AnswerCard({ label, option, tone, prominent = false }) { const styles = tone === "success" ? "border-emerald-500/25 bg-emerald-500/[.06]" : tone === "error" ? "border-rose-500/25 bg-rose-500/[.05]" : "border-slate-700 bg-slate-950/35"; return <div className={`min-w-0 rounded-2xl border p-4 ${styles} ${prominent ? "ring-1 ring-emerald-400/20" : ""}`}><p className="text-[11px] font-bold tracking-[.17em] text-slate-500">{label.toUpperCase()}</p><div className="mt-3 flex min-w-0 items-start gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${tone === "success" ? "bg-emerald-500/15 text-emerald-300" : tone === "error" ? "bg-rose-500/15 text-rose-300" : "bg-slate-800 text-slate-400"}`}>{option?.label || "—"}</span><p className="min-w-0 break-words text-sm leading-6 text-slate-200">{option?.text || "No answer recorded"}</p></div></div> }
function concise(value) { const text = String(value || "").trim(); if (!text) return null; return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]).slice(0, 2).join(" ").trim() }
function HistoryView({ items, onOpen, onBack }) { return <><Back onClick={onBack}/><h2 className="text-3xl font-bold">Practice history</h2><p className="mt-2 text-slate-400">Revisit your latest completed sessions and diagnoses.</p><div className="mt-7 space-y-3">{items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Complete your first session to see it here.</div>}{items.map((item) => <button key={item.attemptId} onClick={() => onOpen(item.attemptId)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left hover:border-violet-500/50"><div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-400"><Clock3/></div><div className="flex-1"><h3 className="font-semibold">{item.topicName}</h3><p className="mt-1 text-xs capitalize text-slate-500">{item.difficulty} · {new Date(item.completedAt).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold">{item.score}/{item.totalQuestions}</p><p className="text-xs text-slate-500">{Math.round(item.accuracy)}%</p></div><ArrowRight className="text-slate-600" size={18}/></button>)}</div></> }
function formatTime(seconds) { const value = Number(seconds || 0); return `${Math.floor(value / 60)}m ${value % 60}s` }
