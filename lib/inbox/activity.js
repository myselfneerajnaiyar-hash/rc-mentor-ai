import { inboxQuery } from "./request.js"
﻿import { requireId } from "./validation.js"
export const DAY_MS = 86400000
const calendar = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })
export function dateKey(value) { return calendar.format(new Date(value)) }
export function dayStart(key) { return new Date(`${key}T00:00:00+05:30`) }
export function shiftDay(key, days) { return dateKey(new Date(dayStart(key).getTime() + days * DAY_MS)) }

// These tables save completed submissions. Where a completed_at exists it is authoritative.
// RC question rows are written on submission, including Precision (whose session starts earlier).
export const ACTIVITY_SOURCES = [
  { table: "daily_rc_attempts", module: "Daily RC", at: "completed_at", columns: "correct_count,incorrect_count,unanswered_count,time_taken", correct: "correct_count", seconds: "time_taken", daily: true },
  { table: "rc_questions", module: "RC / Precision", at: "created_at", columns: "session_id,is_correct,question_type,time_taken_sec", questionRows: true, seconds: "time_taken_sec" },
  { table: "rc_sessions", module: "RC / Precision", at: "created_at", columns: "total_questions,correct_answers,time_taken_sec,difficulty", correct: "correct_answers", seconds: "time_taken_sec", fallback: true },
  { table: "vocab_sessions", module: "Vocabulary", at: "created_at", columns: "total_questions,correct_answers,time_taken_s", correct: "correct_answers", seconds: "time_taken_s" },
  { table: "speed_sessions", module: "Speed Drills", at: "created_at", columns: "total_questions,correct_answers", correct: "correct_answers" },
  { table: "workout_attempts", module: "Daily Workout", at: "completed_at", columns: "total_questions,correct_count", correct: "correct_count" },
  { table: "editorial_history", module: "Editorial", at: "created_at", columns: "", engagement: true },
  { table: "mentor_chat_history", module: "Birbal", at: "created_at", columns: "role", engagement: true, userChat: true },
  { table: "mentor_test_attempts", module: "CAT sectionals", at: "created_at", columns: "total_questions,correct,time_taken_s", correct: "correct", seconds: "time_taken_s" },
  { table: "grammar_test_attempts", module: "Grammar", at: "completed_at", columns: "total_questions,score,time_taken_seconds,completed", correct: "score", seconds: "time_taken_seconds", completed: true },
  { table: "hangman_attempts", module: "Word Hunt", at: "attempt_date", columns: "", dateOnly: true },
]
export async function readAll(buildQuery, pageSize = 500, { signal } = {}) {
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    signal?.throwIfAborted()
    const pageSignal = AbortSignal.timeout(15000)
    const { data, error } = await inboxQuery(buildQuery().range(offset, offset + pageSize - 1), { signal: signal ? AbortSignal.any([signal, pageSignal]) : pageSignal, timeoutMs: 15000 })
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return rows
  }
}
export async function loadActivityBatch(db, userIds, fromKey, toKey, { until = null, signal } = {}) {
  userIds.forEach(requireId)
  const grouped = new Map(userIds.map((id) => [id, []]))
  await Promise.all(ACTIVITY_SOURCES.map(async (source) => {
    const rows = await readAll(() => {
      let query = db.from(source.table).select(["id", "user_id", source.at, source.columns].filter(Boolean).join(",")).in("user_id", userIds)
        .gte(source.at, source.dateOnly ? fromKey : dayStart(fromKey).toISOString()).lt(source.at, source.dateOnly ? toKey : until ? new Date(until).toISOString() : dayStart(toKey).toISOString()).order("id", { ascending: true })
      if (source.userChat) query = query.eq("role", "user")
      if (source.completed) query = query.eq("completed", true)
      return query
    }, 500, { signal })
    for (const row of rows) {
      if (!grouped.has(row.user_id) || !row[source.at]) continue
      const day = source.dateOnly ? row[source.at] : dateKey(row[source.at])
      if (day < fromKey || day >= toKey) continue
      const questions = source.questionRows ? 1 : source.daily ? Number(row.correct_count) + Number(row.incorrect_count) + Number(row.unanswered_count) : Number(row.total_questions)
      const correct = source.questionRows ? (typeof row.is_correct === "boolean" ? Number(row.is_correct) : null) : row[source.correct]
      const measurable = Number.isInteger(questions) && questions > 0 && correct != null && Number.isInteger(Number(correct)) && Number(correct) >= 0 && Number(correct) <= questions
      const seconds = source.seconds && row[source.seconds] != null ? Number(row[source.seconds]) : null
      grouped.get(row.user_id).push({ day, module: source.module, sessionId: `${source.module === "RC / Precision" ? "rc" : source.table}:${row.session_id || row.id}`, fallback: Boolean(source.fallback), precision: String(row.difficulty || "").startsWith("precision"), skill: row.question_type || null, engagement: Boolean(source.engagement) || (!measurable && !source.dateOnly), questions: measurable ? questions : 0, correct: measurable ? Number(correct) : 0, seconds: measurable && Number.isFinite(seconds) && seconds > 0 ? seconds : null })
    }
  }))
  for (const [id, events] of grouped) {
    const detailedSessions = new Set(events.filter((event) => event.module === "RC / Precision" && !event.fallback).map((event) => event.sessionId))
    // Ordinary RC creates its session at completion, so it is a safe fallback when
    // analytics are absent. Precision creates it at start; never invent its completion day.
    grouped.set(id, events.filter((event) => !event.fallback || (!event.precision && !detailedSessions.has(event.sessionId))))
  }
  return grouped
}
export function summarizeActivity(events, fromKey, toKey) {
  const bounded = events.filter((event) => event.day >= fromKey && event.day < toKey)
  const measured = bounded.filter((event) => event.questions > 0)
  const questions = measured.reduce((n, event) => n + event.questions, 0)
  const correct = measured.reduce((n, event) => n + event.correct, 0)
  const timed = measured.filter((event) => event.seconds != null)
  const timedQuestions = timed.reduce((n, event) => n + event.questions, 0)
  return { hasActivity: bounded.length > 0, activitiesCount: new Set(bounded.filter((event) => !event.engagement).map((event) => event.sessionId)).size, questionActivitiesCount: new Set(measured.map((event) => event.sessionId)).size, questions, correct, accuracyPercent: questions ? Math.round(correct * 100 / questions) : null, averageSeconds: timedQuestions ? Math.round(timed.reduce((n, event) => n + event.seconds, 0) / timedQuestions) : null, timedQuestions }
}
export async function getInboxActivitySummary(db, userId, since, until = new Date()) {
  const fromKey = dateKey(since), toKey = dateKey(until)
  const batch = await loadActivityBatch(db, [userId], fromKey, toKey)
  return summarizeActivity(batch.get(userId), fromKey, toKey)
}
