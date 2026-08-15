import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireCapability } from "@/lib/tenant/requireCapability"

export const dynamic = "force-dynamic"
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(request) {
  try {
    const access = await requireCapability(request, "showDailyRC")
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Daily RC is not available for your exam" }, { status: access.status })
    const user = access.identity.user

    const range = new URL(request.url).searchParams.get("range") || "all"
    const rangeStart = getRangeStart(range)
    let attemptsQuery = supabase
      .from("daily_rc_attempts")
      .select("id,daily_rc_set_id,score,accuracy,correct_count,incorrect_count,unanswered_count,time_taken,completed_at,daily_rc_sets(id,title,challenge_date,difficulty,source_year)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true })

    if (rangeStart) attemptsQuery = attemptsQuery.gte("completed_at", rangeStart.toISOString())
    const { data: rawAttempts, error: attemptsError } = await attemptsQuery
    if (attemptsError) throw attemptsError

    // Match the product's one-attempt-per-challenge semantics defensively.
    const attemptsBySet = new Map()
    for (const attempt of rawAttempts || []) {
      if (!attemptsBySet.has(attempt.daily_rc_set_id)) attemptsBySet.set(attempt.daily_rc_set_id, attempt)
    }
    const attempts = [...attemptsBySet.values()]
    const attemptIds = attempts.map((attempt) => attempt.id)

    let questionAttempts = []
    if (attemptIds.length) {
      const { data, error } = await supabase
        .from("daily_rc_question_attempts")
        .select("attempt_id,question_type,selected_option,is_correct")
        .in("attempt_id", attemptIds)
      if (error) throw error
      questionAttempts = data || []
    }

    return NextResponse.json(buildAnalytics(attempts, questionAttempts, range))
  } catch (error) {
    console.error("Daily RC analytics failed:", error)
    return NextResponse.json({ error: "Unable to load Daily RC analytics" }, { status: 500 })
  }
}

function buildAnalytics(attempts, questionAttempts, range) {
  const normalized = attempts.map((attempt) => ({
    id: attempt.id,
    challengeId: attempt.daily_rc_set_id,
    date: toIstDate(attempt.completed_at),
    completedAt: attempt.completed_at,
    title: attempt.daily_rc_sets?.title || "Daily RC",
    challengeDate: attempt.daily_rc_sets?.challenge_date || null,
    difficulty: attempt.daily_rc_sets?.difficulty || null,
    sourceYear: attempt.daily_rc_sets?.source_year || null,
    score: Number(attempt.score) || 0,
    accuracy: Number(attempt.accuracy) || 0,
    time: Math.max(0, Number(attempt.time_taken) || 0),
    correct: Math.max(0, Number(attempt.correct_count) || 0),
    incorrect: Math.max(0, Number(attempt.incorrect_count) || 0),
    unanswered: Math.max(0, Number(attempt.unanswered_count) || 0),
  }))

  const accuracies = normalized.map((attempt) => attempt.accuracy)
  const times = normalized.map((attempt) => attempt.time)
  const scores = normalized.map((attempt) => attempt.score)
  const activeDates = [...new Set(normalized.map((attempt) => attempt.date))].sort()
  const streaks = calculateStreaks(activeDates)
  const trend = calculateTrend(accuracies)
  const speedTrend = calculateTrend(times, true)

  const questionTypes = groupQuestionTypes(questionAttempts)
  const difficulties = groupAttempts(normalized.filter((attempt) => attempt.difficulty), "difficulty")
  const sources = groupAttempts(normalized.filter((attempt) => attempt.sourceYear), "sourceYear")
  const scatter = buildScatter(normalized)
  const recent = [...normalized].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 10)

  return {
    range,
    overview: normalized.length ? {
      attempted: normalized.length,
      averageAccuracy: round(average(accuracies), 1),
      averageTime: Math.round(average(times)),
      averageScore: round(average(scores), 1),
      bestAccuracy: Math.max(...accuracies),
      currentStreak: streaks.current,
    } : null,
    accuracyTrend: normalized.map(({ id, date, accuracy, title }) => ({ id, date, accuracy, title })),
    speedTrend: normalized.map(({ id, date, time, title }) => ({ id, date, time, title })),
    trend,
    speedTrendSummary: speedTrend,
    scatter,
    recent,
    questionTypes,
    difficulties,
    sources,
    consistency: {
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      attemptedThisWeek: countSince(normalized, startOfIstWeek()),
      attemptedThisMonth: countSince(normalized, startOfIstMonth()),
      daysActive: activeDates.length,
    },
    personalBests: buildPersonalBests(normalized),
    readingProfile: buildReadingProfile({ trend, speedTrend, questionTypes, difficulties, scatter }),
  }
}

function groupQuestionTypes(rows) {
  const groups = new Map()
  for (const row of rows) {
    if (!row.selected_option) continue
    const type = String(row.question_type || "").trim()
    if (!type || type.toLowerCase() === "unknown") continue
    const group = groups.get(type) || { label: formatLabel(type), attempted: 0, correct: 0 }
    group.attempted += 1
    if (row.is_correct) group.correct += 1
    groups.set(type, group)
  }
  return [...groups.values()].map((group) => ({ ...group, accuracy: round((group.correct / group.attempted) * 100, 1) })).sort((a, b) => a.accuracy - b.accuracy)
}

function groupAttempts(attempts, key) {
  const groups = new Map()
  for (const attempt of attempts) {
    const label = String(attempt[key])
    const group = groups.get(label) || { label, attempts: 0, accuracyTotal: 0, timeTotal: 0 }
    group.attempts += 1
    group.accuracyTotal += attempt.accuracy
    group.timeTotal += attempt.time
    groups.set(label, group)
  }
  return [...groups.values()].map((group) => ({ label: group.label, attempts: group.attempts, accuracy: round(group.accuracyTotal / group.attempts, 1), averageTime: Math.round(group.timeTotal / group.attempts) })).sort((a, b) => a.accuracy - b.accuracy)
}

function buildScatter(attempts) {
  if (!attempts.length) return { points: [], medianAccuracy: 0, medianTime: 0, strongestZone: null }
  const medianAccuracy = median(attempts.map((attempt) => attempt.accuracy))
  const medianTime = median(attempts.map((attempt) => attempt.time))
  const zones = new Map()
  const points = attempts.map((attempt) => {
    const speed = attempt.time <= medianTime ? "Fast" : "Slower"
    const quality = attempt.accuracy >= medianAccuracy ? "Accurate" : "Less Accurate"
    const zone = `${speed} + ${quality}`
    zones.set(zone, (zones.get(zone) || 0) + 1)
    return { id: attempt.id, title: attempt.title, time: attempt.time, accuracy: attempt.accuracy, zone }
  })
  const strongestZone = [...zones.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
  return { points, medianAccuracy, medianTime, strongestZone }
}

function buildPersonalBests(attempts) {
  if (!attempts.length) return []
  const bestAccuracy = [...attempts].sort((a, b) => b.accuracy - a.accuracy || b.score - a.score)[0]
  const highestScore = [...attempts].sort((a, b) => b.score - a.score || b.accuracy - a.accuracy)[0]
  const longest = [...attempts].sort((a, b) => b.time - a.time)[0]
  const recentBest = [...attempts].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 5).sort((a, b) => b.accuracy - a.accuracy || b.score - a.score)[0]
  return [
    { label: "Best Accuracy", value: `${bestAccuracy.accuracy}%`, detail: bestAccuracy.title },
    { label: "Highest Score", value: formatScore(highestScore.score), detail: highestScore.title },
    { label: "Longest RC Attempt", value: formatDuration(longest.time), detail: longest.title },
    { label: "Best Recent Performance", value: `${recentBest.accuracy}%`, detail: recentBest.title },
  ]
}

function buildReadingProfile({ trend, speedTrend, questionTypes, difficulties, scatter }) {
  const observations = []
  if (trend.direction === "improving") observations.push("Your recent accuracy is improving.")
  if (trend.direction === "declining") observations.push("Your recent accuracy has declined compared with your earlier attempts.")
  if (trend.direction === "stable") observations.push("Your accuracy has remained broadly stable.")
  if (questionTypes.length) observations.push(`${questionTypes[0].label} is currently your weakest question type at ${questionTypes[0].accuracy}% accuracy.`)
  else if (difficulties.length > 1) observations.push(`${difficulties[0].label} passages currently have your lowest accuracy.`)
  if (observations.length < 3 && scatter.strongestZone) observations.push(`Most of your attempts fall in your ${scatter.strongestZone.toLowerCase()} zone relative to your own averages.`)
  if (observations.length < 3 && speedTrend.direction === "slower") observations.push("Your recent completion time is higher than in your earlier attempts.")
  return observations.slice(0, 3)
}

function calculateTrend(values, lowerIsFaster = false) {
  if (values.length < 4) return { direction: "insufficient", change: 0 }
  const split = Math.floor(values.length / 2)
  const change = average(values.slice(split)) - average(values.slice(0, split))
  const threshold = lowerIsFaster ? 15 : 2
  if (Math.abs(change) < threshold) return { direction: "stable", change: round(change, 1) }
  if (lowerIsFaster) return { direction: change < 0 ? "faster" : "slower", change: round(change, 1) }
  return { direction: change > 0 ? "improving" : "declining", change: round(change, 1) }
}

function calculateStreaks(sortedDates) {
  if (!sortedDates.length) return { current: 0, longest: 0 }
  let longest = 1
  let running = 1
  for (let index = 1; index < sortedDates.length; index += 1) {
    const difference = dateDifference(sortedDates[index - 1], sortedDates[index])
    running = difference === 1 ? running + 1 : 1
    longest = Math.max(longest, running)
  }
  const today = toIstDate(new Date().toISOString())
  const last = sortedDates[sortedDates.length - 1]
  if (![0, 1].includes(dateDifference(last, today))) return { current: 0, longest }
  let current = 1
  for (let index = sortedDates.length - 1; index > 0; index -= 1) {
    if (dateDifference(sortedDates[index - 1], sortedDates[index]) !== 1) break
    current += 1
  }
  return { current, longest }
}

function getRangeStart(range) {
  if (!['7d', '30d'].includes(range)) return null
  const days = range === '7d' ? 7 : 30
  const istNow = new Date(Date.now() + IST_OFFSET_MS)
  const startIstAsUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - days + 1)
  return new Date(startIstAsUtc - IST_OFFSET_MS)
}

function startOfIstWeek() {
  const istNow = new Date(Date.now() + IST_OFFSET_MS)
  const daysSinceMonday = (istNow.getUTCDay() + 6) % 7
  return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - daysSinceMonday) - IST_OFFSET_MS)
}

function startOfIstMonth() {
  const istNow = new Date(Date.now() + IST_OFFSET_MS)
  return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - IST_OFFSET_MS)
}

function countSince(attempts, date) { return attempts.filter((attempt) => new Date(attempt.completedAt) >= date).length }
function toIstDate(value) { return new Date(new Date(value).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10) }
function dateDifference(from, to) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) }
function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0 }
function median(values) { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 }
function round(value, precision = 0) { const factor = 10 ** precision; return Math.round(value * factor) / factor }
function formatLabel(value) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatScore(value) { return value > 0 ? `+${value}` : String(value) }
function formatDuration(seconds) { const minutes = Math.floor(seconds / 60); return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s` }
