"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  XCircle,
} from "lucide-react"
import { supabase } from "../lib/supabase"

const ACTIVE_SESSION_KEY = "precisionActiveSession"

function formatSkill(skill) {
  return String(skill || "inference").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`
}

function getQuestions(drill) {
  return [...(drill?.micro || []), ...(drill?.mini_rc?.questions || [])]
}

const panelClass = "rounded-2xl border border-white/[0.08] bg-slate-900/70 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.95)] backdrop-blur-xl"

function PrecisionBackdrop({ children, compact = false }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#070b14] text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-indigo-600/[0.09] blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-cyan-500/[0.06] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>
      <main className={`relative mx-auto w-full ${compact ? "max-w-5xl" : "max-w-6xl"} px-4 py-6 sm:px-6 sm:py-10 lg:px-8`}>
        {children}
      </main>
    </div>
  )
}

function ErrorNotice({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error("Please sign in again to continue.")
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  })
}

export default function PrecisionTraining({ user, userName }) {
  const [phase, setPhase] = useState("intro")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [drill, setDrill] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [questionTimes, setQuestionTimes] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(480)
  const [weakSkills, setWeakSkills] = useState([])
  const [skillStats, setSkillStats] = useState({})
  const [result, setResult] = useState(null)
  const questionStartedAt = useRef(null)
  const answersRef = useRef(answers)
  const timesRef = useRef(questionTimes)
  const submittingRef = useRef(false)

  const questions = useMemo(() => getQuestions(drill), [drill])

  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { timesRef.current = questionTimes }, [questionTimes])

  useEffect(() => {
    async function loadWeakSkills() {
      if (!user) return
      const { data } = await supabase
        .from("rc_questions")
        .select("question_type,is_correct")
        .eq("user_id", user.id)
      if (!data?.length) return

      const skillMap = {}
      data.forEach((row) => {
        const type = String(row.question_type || "unknown").toLowerCase()
        skillMap[type] ||= { total: 0, correct: 0 }
        skillMap[type].total += 1
        if (row.is_correct) skillMap[type].correct += 1
      })
      let candidates = Object.entries(skillMap).map(([type, stats]) => ({
        type,
        attempts: stats.total,
        accuracy: stats.correct / stats.total,
      }))
      const established = candidates.filter((candidate) => candidate.attempts >= 8)
      if (established.length >= 2) candidates = established
      const weakest = candidates.sort((a, b) => a.accuracy - b.accuracy).slice(0, 2)
      setWeakSkills(weakest.map((candidate) => candidate.type))
      setSkillStats(Object.fromEntries(weakest.map((candidate) => [candidate.type, {
        total: candidate.attempts,
        accuracy: Math.round(candidate.accuracy * 100),
      }])))
    }
    loadWeakSkills()
  }, [user])

  const saveDraft = useCallback((id, nextAnswers, nextTimes) => {
    if (!id) return
    localStorage.setItem(`${ACTIVE_SESSION_KEY}:${id}`, JSON.stringify({
      answers: nextAnswers,
      questionTimes: nextTimes,
    }))
  }, [])

  const commitCurrentTime = useCallback(() => {
    if (phase !== "running" || !questions[currentQ] || !questionStartedAt.current) return timesRef.current
    const elapsed = Math.max(0, Math.round((performance.now() - questionStartedAt.current) / 1000))
    questionStartedAt.current = performance.now()
    if (!elapsed) return timesRef.current
    const questionId = questions[currentQ].id
    const next = { ...timesRef.current, [questionId]: (timesRef.current[questionId] || 0) + elapsed }
    timesRef.current = next
    setQuestionTimes(next)
    saveDraft(sessionId, answersRef.current, next)
    return next
  }, [currentQ, phase, questions, saveDraft, sessionId])

  const applySession = useCallback((payload) => {
    setSessionId(payload.sessionId)
    setExpiresAt(payload.expiresAt)
    setDrill(payload.drill)
    setCurrentQ(0)
    setError("")
    const draftRaw = localStorage.getItem(`${ACTIVE_SESSION_KEY}:${payload.sessionId}`)
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw)
        setAnswers(draft.answers || {})
        setQuestionTimes(draft.questionTimes || {})
        answersRef.current = draft.answers || {}
        timesRef.current = draft.questionTimes || {}
      } catch {}
    }
    localStorage.setItem(ACTIVE_SESSION_KEY, payload.sessionId)
    questionStartedAt.current = performance.now()
    setPhase("running")
  }, [])

  const restoreSession = useCallback(async (id) => {
    try {
      const response = await authFetch(`/api/precision/sessions/${id}`, { cache: "no-store" })
      if (!response.ok) throw new Error("Your previous Precision session could not be restored.")
      const payload = await response.json()
      if (payload.status === "complete") {
        setSessionId(id)
        setResult(payload.result)
        setDrill({
          targetSkills: payload.result.targetSkills || [],
          micro: payload.result.questions.filter((question) => !question.sharedPassage),
          mini_rc: {
            passage: payload.result.questions.find((question) => question.sharedPassage)?.sharedPassage || "",
            questions: payload.result.questions.filter((question) => question.sharedPassage),
          },
        })
        localStorage.removeItem(ACTIVE_SESSION_KEY)
        setPhase("finished")
        return
      }
      applySession(payload)
      if (payload.status === "expired") setTimeLeft(0)
    } catch (restoreError) {
      localStorage.removeItem(ACTIVE_SESSION_KEY)
      setError(restoreError.message)
    }
  }, [applySession])

  useEffect(() => {
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY)
    if (activeId && user) restoreSession(activeId)
  }, [restoreSession, user])

  const submitDrill = useCallback(async (timedOut = false) => {
    if (!sessionId || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError("")
    const finalTimes = commitCurrentTime()
    const responsePayload = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: answersRef.current[question.id] || null,
      skipped: !answersRef.current[question.id],
      responseTimeSec: finalTimes[question.id] || 0,
    }))

    try {
      const response = await authFetch(`/api/precision/sessions/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: responsePayload, timedOut }),
      })
      if (response.status === 409) {
        await restoreSession(sessionId)
        return
      }
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Could not submit Precision session.")
      setResult(payload)
      localStorage.removeItem(ACTIVE_SESSION_KEY)
      localStorage.removeItem(`${ACTIVE_SESSION_KEY}:${sessionId}`)
      setPhase("finished")
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [commitCurrentTime, questions, restoreSession, sessionId])

  useEffect(() => {
    if (phase !== "running" || !expiresAt) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) submitDrill(true)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [expiresAt, phase, submitDrill])

  async function startDrill() {
    setLoading(true)
    setError("")
    setAnswers({})
    setQuestionTimes({})
    answersRef.current = {}
    timesRef.current = {}
    setResult(null)
    try {
      const response = await authFetch("/api/precision-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weakSkills }),
      })
      const payload = await response.json()
      if (payload.limitReached) throw new Error("You reached today's Precision limit.")
      if (!response.ok) throw new Error(payload.error || "Could not create your Precision drill.")
      applySession(payload)
    } catch (startError) {
      setError(startError.message)
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(optionId) {
    const questionId = questions[currentQ].id
    const next = { ...answersRef.current }
    if (optionId) next[questionId] = optionId
    else delete next[questionId]
    answersRef.current = next
    setAnswers(next)
    saveDraft(sessionId, next, timesRef.current)
  }

  function moveQuestion(nextIndex) {
    commitCurrentTime()
    setCurrentQ(nextIndex)
    questionStartedAt.current = performance.now()
  }

  if (phase === "intro") return (
    <PrecisionBackdrop compact>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-3xl pt-4 sm:pt-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-400/30 blur-md" />
            <img src="/birbal.png" alt="Birbal, your AI mentor" className="relative h-11 w-11 rounded-full border border-white/15 object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300"><Sparkles className="h-3.5 w-3.5" /> Auctor RC</div>
            <div className="mt-0.5 text-sm text-slate-400">Adaptive skill training with Birbal</div>
          </div>
        </div>

        <div className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-white/[0.07] px-5 py-7 sm:px-9 sm:py-9">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.08] px-3 py-1.5 text-xs font-medium text-indigo-200">
              <Target className="h-3.5 w-3.5" /> Precision Training
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Train where the score is leaking.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Hey {userName || "there"}, Birbal analysed your recent RC performance and prepared a focused eight-question session around the skills that need attention most.
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_0.72fr]">
            <div className="border-b border-white/[0.07] p-5 sm:p-9 lg:border-b-0 lg:border-r">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Focus areas</p>
              <div className="space-y-3">
                {(weakSkills.length ? weakSkills : ["inference"]).map((skill, index) => {
                  const stat = skillStats[skill]
                  return (
                    <div key={skill} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-semibold text-indigo-300">{index + 1}</span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{formatSkill(skill)}</div>
                          <div className="mt-0.5 text-xs text-slate-500">Priority skill</div>
                        </div>
                      </div>
                      {stat && <div className="text-right"><div className="text-lg font-semibold tabular-nums text-white">{stat.accuracy}%</div><div className="text-[11px] text-slate-500">{stat.total} attempts</div></div>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-5 sm:p-9">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Session format</p>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-indigo-300" /><span>8 targeted questions</span></div>
                <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-indigo-300" /><span>8-minute focused sprint</span></div>
                <div className="flex items-center gap-3"><Brain className="h-4 w-4 text-indigo-300" /><span>Skill and trap diagnosis</span></div>
                <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-indigo-300" /><span>Server-verified scoring</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5"><ErrorNotice message={error} /></div>
        <button
          type="button"
          onClick={startDrill}
          disabled={loading}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_36px_-12px_rgba(99,102,241,0.8)] transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing your drill…</> : <>Start Precision Drill <ArrowRight className="h-4 w-4" /></>}
        </button>
      </motion.section>
    </PrecisionBackdrop>
  )

  if (phase === "running") {
    const question = questions[currentQ]
    if (!question) return <PrecisionBackdrop compact><div className={`${panelClass} mx-auto mt-20 flex max-w-md flex-col items-center p-10 text-center`}><Loader2 className="mb-4 h-7 w-7 animate-spin text-indigo-300" /><p className="font-medium text-white">Loading your Precision drill…</p><p className="mt-2 text-sm text-slate-400">Restoring your focused session.</p></div></PrecisionBackdrop>
    const answeredCount = Object.keys(answers).length
    const selectedOptionId = answers[question.id]
    const targetSkills = drill?.targetSkills || []
    const progress = ((currentQ + 1) / questions.length) * 100
    const isLastQuestion = currentQ === questions.length - 1
    return (
      <PrecisionBackdrop>
        <header className="sticky top-0 z-20 -mx-4 -mt-6 mb-5 border-b border-white/[0.07] bg-[#070b14]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:-mt-10 sm:mb-8 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <div className="hidden shrink-0 sm:block"><div className="text-sm font-semibold tracking-wide text-white">PRECISION</div><div className="text-[11px] text-slate-500">Focused on your weaknesses</div></div>
            <div className="min-w-0 flex-1 sm:mx-5">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-slate-300">Question {currentQ + 1} of {questions.length}</span><span className="text-slate-500">{answeredCount} answered</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentQ + 1}>
                <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" animate={{ width: `${progress}%` }} transition={{ duration: 0.25, ease: "easeOut" }} />
              </div>
            </div>
            <div className={`flex min-w-[5.5rem] shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums ${timeLeft < 60 ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-white/[0.08] bg-white/[0.04] text-slate-100"}`} aria-label={`${formatTime(timeLeft)} remaining`}>
              <Clock3 className="h-4 w-4" aria-hidden="true" /> {formatTime(timeLeft)}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl pb-24 sm:pb-8">
          {targetSkills.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Targeting</span>{targetSkills.map((skill) => <span key={skill} className="rounded-full border border-indigo-400/15 bg-indigo-400/[0.06] px-2.5 py-1 font-medium text-indigo-200">{formatSkill(skill)}</span>)}</div>}
          <ErrorNotice message={error} />
          <AnimatePresence mode="wait">
            <motion.article key={question.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }} className={`${panelClass} ${error ? "mt-5" : ""} overflow-hidden`}>
              <div className="border-b border-white/[0.07] px-5 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-400/[0.08] px-3 py-1.5 text-xs font-medium text-indigo-200"><Target className="h-3.5 w-3.5" />{formatSkill(question.skill)}</span>
                  <span className="text-xs font-medium text-slate-500">{currentQ < (drill?.micro?.length || 0) ? "Focused skill check" : "Passage application"}</span>
                </div>
              </div>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                {question.paragraph && <div className="mb-6 rounded-xl border-l-2 border-indigo-400/40 bg-white/[0.025] px-4 py-4 text-[15px] leading-7 text-slate-300 sm:px-5">{question.paragraph}</div>}
                {currentQ >= (drill?.micro?.length || 0) && <div className="mb-7 max-h-[19rem] overflow-y-auto whitespace-pre-line rounded-xl border border-white/[0.07] bg-black/10 px-4 py-5 text-[15px] leading-7 text-slate-300 sm:px-6">{drill.mini_rc.passage}</div>}
                <h1 className="max-w-3xl text-lg font-semibold leading-7 tracking-[-0.01em] text-white sm:text-xl sm:leading-8">{question.question}</h1>

                <div className="mt-6 space-y-2.5" role="radiogroup" aria-label={`Answers for question ${currentQ + 1}`}>
                  {question.options.map((option, index) => {
                    const selected = selectedOptionId === option.id
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectAnswer(option.id)}
                        whileTap={{ scale: 0.995 }}
                        className={`group flex min-h-[3.5rem] w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:gap-4 sm:px-4 ${selected ? "border-indigo-400/55 bg-indigo-500/[0.13] shadow-[inset_0_0_0_1px_rgba(129,140,248,0.12)]" : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.045]"}`}
                      >
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition ${selected ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/10 bg-white/[0.035] text-slate-400 group-hover:text-slate-200"}`}>{selected ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + index)}</span>
                        <span className={`pt-1 text-sm leading-6 sm:text-[15px] ${selected ? "text-white" : "text-slate-300"}`}>{option.text}</span>
                      </motion.button>
                    )
                  })}
                </div>

                <div className="mt-4 min-h-5">
                  {selectedOptionId && <button type="button" onClick={() => selectAnswer(null)} className="text-xs font-medium text-slate-500 underline decoration-white/10 underline-offset-4 transition hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Clear answer · leave skipped</button>}
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.08] bg-[#070b14]/95 px-4 py-3 backdrop-blur-xl sm:static sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
              <button type="button" onClick={() => moveQuestion(currentQ - 1)} disabled={currentQ === 0 || submitting} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span></button>
              <div className="hidden text-xs text-slate-500 sm:block">Your progress is saved automatically</div>
              {!isLastQuestion ? (
                <button type="button" onClick={() => moveQuestion(currentQ + 1)} disabled={submitting} className="flex min-h-11 min-w-[8.5rem] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(99,102,241,.9)] transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14] disabled:opacity-50">Next question <ChevronRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={() => submitDrill(false)} disabled={submitting} className="flex min-h-11 min-w-[10.5rem] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(99,102,241,.9)] transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14] disabled:cursor-wait disabled:opacity-60">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Submit answers <ArrowRight className="h-4 w-4" /></>}</button>
              )}
            </div>
          </div>
        </div>
      </PrecisionBackdrop>
    )
  }

  if (phase === "finished" && result) {
    const breakdown = {}
    result.questions.forEach((question) => {
      const skill = question.rawSkill || question.skill || "inference"
      breakdown[skill] ||= { total: 0, correct: 0, skipped: 0 }
      breakdown[skill].total += 1
      if (question.isCorrect) breakdown[skill].correct += 1
      if (question.responseStatus === "skipped") breakdown[skill].skipped += 1
    })
    const accuracy = result.total ? Math.round((result.score / result.total) * 100) : 0
    const skipped = result.questions.filter((question) => question.responseStatus === "skipped").length
    const traps = result.questions.filter((question) => question.selectedTrapType)
    const trapCounts = traps.reduce((acc, question) => {
      const trap = question.selectedTrapType
      acc[trap] ||= { count: 0, label: question.selectedTrapLabel }
      acc[trap].count += 1
      return acc
    }, {})
    return <PrecisionBackdrop>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300"><Sparkles className="h-3.5 w-3.5" /> Precision complete</div><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your training diagnosis</h1><p className="mt-2 text-sm text-slate-400">Server-verified session results{result.timedOut ? " · Session ended when time expired" : ""}</p></div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> Verified result</div>
        </div>

        <section className={`${panelClass} grid overflow-hidden sm:grid-cols-[1.15fr_1fr]`}>
          <div className="flex items-center gap-6 border-b border-white/[0.07] p-6 sm:border-b-0 sm:border-r sm:p-8">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(rgb(99,102,241)_var(--score),rgba(255,255,255,.07)_0)] p-2" style={{ "--score": `${accuracy}%` }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950"><span className="text-3xl font-semibold tabular-nums text-white">{accuracy}%</span><span className="text-[10px] uppercase tracking-wider text-slate-500">accuracy</span></div>
            </div>
            <div><div className="text-4xl font-semibold tracking-tight text-white">{result.score}<span className="text-xl text-slate-500"> / {result.total}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">Your verified score across this focused Precision session.</p></div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.07] sm:divide-y-0">
            <div className="p-5 sm:p-7"><Clock3 className="mb-4 h-5 w-5 text-indigo-300" /><div className="text-xl font-semibold tabular-nums text-white">{formatTime(result.totalTimeSec)}</div><div className="mt-1 text-xs text-slate-500">Response time</div></div>
            <div className="p-5 sm:p-7"><Target className="mb-4 h-5 w-5 text-indigo-300" /><div className="text-xl font-semibold tabular-nums text-white">{skipped}</div><div className="mt-1 text-xs text-slate-500">Skipped</div></div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className={`${panelClass} p-5 sm:p-7`}>
            <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300"><BarChart3 className="h-4 w-4" /></span><div><h2 className="font-semibold text-white">Skill performance</h2><p className="text-xs text-slate-500">Where you held up—and where to sharpen</p></div></div>
            <div className="space-y-5">{Object.entries(breakdown).map(([skill, stats]) => {
              const percent = Math.round((stats.correct / stats.total) * 100)
              return <div key={skill}><div className="mb-2 flex items-end justify-between gap-3"><div><div className="text-sm font-medium text-slate-200">{formatSkill(skill)}</div><div className="mt-0.5 text-xs text-slate-500">{stats.correct}/{stats.total} correct{stats.skipped ? ` · ${stats.skipped} skipped` : ""}</div></div><span className="text-sm font-semibold tabular-nums text-white">{percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full bg-indigo-500" /></div></div>
            })}</div>
          </section>

          <section className={`${panelClass} p-5 sm:p-7`}>
            <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300"><Brain className="h-4 w-4" /></span><div><h2 className="font-semibold text-white">Trap analysis</h2><p className="text-xs text-slate-500">Patterns behind incorrect choices</p></div></div>
            {Object.keys(trapCounts).length ? <div className="space-y-3">{Object.entries(trapCounts).map(([trap, metadata]) => <div key={trap} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"><span className="text-sm text-slate-300">{metadata.label || formatSkill(trap)}</span><span className="rounded-md bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-200">{metadata.count}×</span></div>)}</div> : <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4"><CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" /><p className="text-sm font-medium text-emerald-100">No trap pattern detected</p><p className="mt-1 text-xs leading-5 text-slate-400">Your recorded choices did not expose a recurring distractor pattern.</p></div>}
          </section>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => setPhase("review")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"><BookOpen className="h-4 w-4" /> Review every answer</button>
          <button type="button" onClick={startDrill} disabled={loading} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-6 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Start another drill</button>
        </div>
      </motion.div>
    </PrecisionBackdrop>
  }

  if (phase === "review" && result) return <PrecisionBackdrop>
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Precision review</div><h1 className="text-3xl font-semibold tracking-tight text-white">Understand every decision</h1><p className="mt-2 text-sm text-slate-400">What you chose, what worked, and what to watch next time.</p></div><button type="button" onClick={() => setPhase("finished")} className="flex min-h-10 w-fit items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"><ChevronLeft className="h-4 w-4" /> Back to diagnosis</button></div>
      <div className="space-y-5">
        {result.questions.map((question, index) => {
          const skippedQuestion = question.responseStatus === "skipped"
          const correct = question.isCorrect
          return <motion.article key={question.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.035, 0.2) }} className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question {index + 1}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${skippedQuestion ? "bg-slate-400/10 text-slate-300" : correct ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>{skippedQuestion ? <TimerReset className="h-3 w-3" /> : correct ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{skippedQuestion ? "Skipped" : correct ? "Correct" : "Incorrect"}</span></div>
              <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-slate-500"><Clock3 className="h-3.5 w-3.5" />{question.responseTimeSec}s</span>
            </div>
            <div className="p-5 sm:p-7">
              {question.paragraph && <div className="mb-5 rounded-xl border-l-2 border-indigo-400/35 bg-white/[0.025] px-4 py-4 text-sm leading-7 text-slate-300">{question.paragraph}</div>}
              {question.sharedPassage && <div className="mb-5 max-h-72 overflow-y-auto whitespace-pre-line rounded-xl border border-white/[0.07] bg-black/10 px-4 py-5 text-sm leading-7 text-slate-300 sm:px-5">{question.sharedPassage}</div>}
              <h2 className="mb-5 text-base font-semibold leading-7 text-white sm:text-lg">{question.question}</h2>
              <div className="space-y-2">{question.options.map((option, optionIndex) => {
                const isCorrectOption = option.id === question.correctOptionId
                const isSelectedWrong = option.id === question.selectedOptionId && !isCorrectOption
                return <div key={option.id} className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm leading-6 ${isCorrectOption ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-50" : isSelectedWrong ? "border-rose-400/25 bg-rose-400/[0.07] text-rose-50" : "border-white/[0.06] bg-white/[0.02] text-slate-400"}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${isCorrectOption ? "bg-emerald-400/15 text-emerald-200" : isSelectedWrong ? "bg-rose-400/15 text-rose-200" : "bg-white/[0.04] text-slate-500"}`}>{String.fromCharCode(65 + optionIndex)}</span><span className="flex-1">{option.text}</span>{isCorrectOption && <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />}{isSelectedWrong && <XCircle className="mt-1 h-4 w-4 shrink-0 text-rose-300" />}</div>
              })}</div>
              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="rounded-xl border border-indigo-400/15 bg-indigo-400/[0.055] p-4 sm:p-5"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200"><Brain className="h-3.5 w-3.5" /> Why this answer</div><p className="text-sm leading-6 text-slate-300">{question.explanation?.reasoning || question.explanation?.why_correct || "No explanation available."}</p></div>
                {question.selectedTrapType && <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-4 md:max-w-[17rem] sm:p-5"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-200">Trap detected</div><p className="text-sm font-medium text-slate-200">{question.selectedTrapLabel || formatSkill(question.selectedTrapType)}</p>{question.selectedTrapExplanation && <p className="mt-2 text-xs leading-5 text-slate-400">{question.selectedTrapExplanation}</p>}</div>}
              </div>
            </div>
          </motion.article>
        })}
      </div>
    </div>
  </PrecisionBackdrop>

  return <PrecisionBackdrop compact><div className={`${panelClass} mx-auto mt-20 flex max-w-md flex-col items-center p-10 text-center`}><Loader2 className="mb-4 h-7 w-7 animate-spin text-indigo-300" /><p className="font-medium text-white">Loading Precision Training…</p><p className="mt-2 text-sm text-slate-400">Preparing your focused learning experience.</p></div></PrecisionBackdrop>
}
