import { summarizeActivity, shiftDay } from "./activity.js"
import { getExamCapabilities } from "../tenant/capabilities.js"
const ROUTES = { "Daily RC": "/daily-challenge", "RC / Precision": "/?view=precision", Vocabulary: "/?view=vocab", "Speed Drills": "/?view=speed", "Daily Workout": "/?view=workout", "CAT sectionals": "/?view=cat", Grammar: "/?view=grammar" }
export function chooseDailyNotification({ userId, firstName, dateKey, events = [], history = [], accountCreatedAt, exam = "Unassigned", offer = null }) {
  if (history.some((row) => row.proactive_date === dateKey || row.idempotency_key === `daily:${dateKey}`)) return null
  const capabilities = getExamCapabilities(exam)
  const availableModules = Object.keys(ROUTES).filter((module) => (module !== "Daily RC" || capabilities.showDailyRC) && (module !== "CAT sectionals" || capabilities.showCATSectionals))
  const yesterdayKey = shiftDay(dateKey, -1)
  const yesterday = summarizeActivity(events, yesterdayKey, dateKey)
  const common = { userId, source: "Auctor", idempotencyKey: `daily:${dateKey}`, proactiveDate: dateKey, priority: 2 }
  const name = String(firstName || "You").trim().split(/\s+/)[0]
  const seenRule = (key) => history.some((row) => row.rule_key === key)
  const recentType = (type, days) => history.some((row) => row.type === type && Date.parse(row.created_at) >= Date.parse(`${shiftDay(dateKey, -days)}T00:00:00+05:30`))
  const make = (type, title, body, metadata, actionUrl = "/", ruleKey = null) => ({ ...common, type, title, body, preview: body.slice(0, 320), metadata, actionUrl, ruleKey })
  const days = new Set(events.filter((event) => !event.engagement && event.questions > 0).map((event) => event.day))
  let streak = 0
  // One extra day distinguishes reaching 28 from an already-longer streak.
  // Only exact thresholds emit; the key stays tied to that run's start/event.
  while (days.has(shiftDay(dateKey, -streak - 1)) && streak < 29) streak++
  // Each milestone belongs to a specific uninterrupted run; retries also share the daily key.
  const streakKey = `streak:${shiftDay(dateKey, -streak)}:${streak}`
  if ([7, 14, 28].includes(streak) && !seenRule(streakKey)) return make("STREAK", `${streak}-day streak`, `You've practiced on each of the last ${streak} days. Keep your next session focused.`, { streakDays: streak, actionLabel: "Continue practicing" }, "/?view=workout", streakKey)
  const achievementKey = `questions-in-day:${yesterdayKey}:100`
  if (yesterday.questions >= 100 && !seenRule(achievementKey) && !recentType("ACHIEVEMENT", 7)) return make("ACHIEVEMENT", "100 questions in a day", `You completed ${yesterday.questions} questions yesterday. That is a real practice milestone.`, { ...yesterday, period: yesterdayKey, actionLabel: "Continue learning" }, "/", achievementKey)
  const perfectSessions = new Map()
  for (const event of events.filter((event) => event.day === yesterdayKey && event.questions > 0 && !event.engagement)) {
    const summary = perfectSessions.get(event.sessionId) || { questions: 0, correct: 0, module: event.module }
    summary.questions += event.questions; summary.correct += event.correct; perfectSessions.set(event.sessionId, summary)
  }
  if (!recentType("MILESTONE", 30)) {
    const perfect = [...perfectSessions].filter(([id, item]) => id && item.questions >= 10 && item.correct === item.questions).sort(([a], [b]) => a.localeCompare(b)).find(([id]) => !seenRule("perfect-session:" + id))
    if (perfect) return make("MILESTONE", "A perfect practice session", "You answered all " + perfect[1].questions + " questions correctly in a " + perfect[1].module + " session yesterday.", { ...perfect[1], sessionId: perfect[0], actionLabel: "Continue learning" }, "/", "perfect-session:" + perfect[0])
  }
  for (const module of availableModules) {
    const moduleEvents = events.filter((event) => event.module === module)
    const recent = summarizeActivity(moduleEvents, shiftDay(dateKey, -7), dateKey)
    const previous = summarizeActivity(moduleEvents, shiftDay(dateKey, -14), shiftDay(dateKey, -7))
    if (recent.questions >= 20 && previous.questions >= 20 && recent.accuracyPercent - previous.accuracyPercent >= 5 && !recentType("PROGRESS", 7)) return make("PROGRESS", `You're improving in ${module}`, `Your ${module} accuracy increased from ${previous.accuracyPercent}% in the previous week to ${recent.accuracyPercent}% in the last week.`, { module, previousAccuracy: previous.accuracyPercent, accuracyPercent: recent.accuracyPercent, questions: recent.questions, previousQuestions: previous.questions, actionLabel: `Practice ${module}` }, ROUTES[module])
  }
  const activeToday = summarizeActivity(events, dateKey, shiftDay(dateKey, 1)).hasActivity
  if (!recentType("DAILY_RECOMMENDATION", 7)) {
    const measured = events.filter((event) => event.day >= shiftDay(dateKey, -7) && event.day < dateKey && event.questions > 0)
    const candidates = availableModules.map((module) => ({ module, ...summarizeActivity(measured.filter((event) => event.module === module), shiftDay(dateKey, -7), dateKey) })).filter((item) => item.questions >= 20 && item.accuracyPercent < 65).sort((a, b) => a.accuracyPercent - b.accuracyPercent)
    if (candidates.length) {
      const weakest = candidates[0]
      const skillGroups = new Map()
      for (const event of measured.filter((event) => event.module === weakest.module && event.skill)) { const group = skillGroups.get(event.skill) || []; group.push(event); skillGroups.set(event.skill, group) }
      const skill = [...skillGroups].map(([name, items]) => ({ name, ...summarizeActivity(items, shiftDay(dateKey, -7), dateKey) })).filter((item) => item.questions >= 5 && item.accuracyPercent < 65).sort((a, b) => a.accuracyPercent - b.accuracyPercent)[0]
      return make("DAILY_RECOMMENDATION", `Today's focus: ${weakest.module}`, `Your recent ${weakest.module} accuracy is ${weakest.accuracyPercent}% across ${weakest.questions} questions.${skill ? ` Give ${skill.name} some focused practice.` : " A focused practice session could help."}`, { module: weakest.module, skill: skill?.name || null, questions: weakest.questions, accuracyPercent: weakest.accuracyPercent, actionLabel: `Practice ${weakest.module}` }, ROUTES[weakest.module])
    }
  }
  // Follow up a real recommendation only if no learning activity followed it.
  const recommendation = history.filter((row) => row.type === "DAILY_RECOMMENDATION" && row.id && row.metadata?.module && availableModules.includes(row.metadata.module)).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
  if (!activeToday && recommendation && !recentType("STUDY_REMINDER", 14)) {
    const age = Date.parse(dateKey + "T00:00:00+05:30") - Date.parse(recommendation.created_at)
    const recommendedDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(recommendation.created_at))
    if (age >= 2 * 86400000 && age < 7 * 86400000 && !events.some((event) => event.day >= recommendedDay)) return make("STUDY_REMINDER", "Your recommended practice is waiting", "You have not logged learning activity since your " + recommendation.metadata.module + " recommendation. A short focused session can help you restart.", { module: recommendation.metadata.module, recommendationId: recommendation.id, actionLabel: "Open practice" }, ROUTES[recommendation.metadata.module], "follow-up:" + recommendation.id)
  }
  // Exam context alone is not a signal: require measured weakness in an exam module.
  if (!activeToday && capabilities.isCAT && !recentType("EXAM_PREP", 14) && recentType("DAILY_RECOMMENDATION", 7)) {
    const sectional = summarizeActivity(events.filter((event) => event.module === "CAT sectionals"), shiftDay(dateKey, -7), dateKey)
    if (sectional.questions >= 20 && sectional.accuracyPercent < 65) return make("EXAM_PREP", "Focus your CAT VARC preparation", "Your recent CAT sectional accuracy is " + sectional.accuracyPercent + "% across " + sectional.questions + " questions. Review your mistakes before your next sectional.", { ...sectional, exam: "CAT", actionLabel: "Open CAT practice" }, "/?view=cat")
  }
  if (offer && !recentType("OFFER", 30) && !seenRule(`offer:${offer.code}:${offer.trialExpiry}`)) return make("OFFER", "An available plan discount", `Your trial has ended. Code ${offer.code} currently offers ${offer.discountPercent}% off eligible plans. Check the final price before paying.`, { code: offer.code, discountPercent: offer.discountPercent, actionLabel: "View plans" }, "/pricing", `offer:${offer.code}:${offer.trialExpiry}`)
  if (yesterday.questions > 0) return make("PERFORMANCE_UPDATE", "Yesterday's performance", `${name}, you completed ${yesterday.questions} questions across ${yesterday.questionActivitiesCount} practice ${yesterday.questionActivitiesCount === 1 ? "session" : "sessions"}, with ${yesterday.accuracyPercent}% accuracy.`, { ...yesterday, period: yesterdayKey, actionLabel: "Continue learning" })
  if (activeToday) return null
  const recent = summarizeActivity(events, shiftDay(dateKey, -7), dateKey)
  if (!recent.hasActivity && accountCreatedAt && Date.parse(accountCreatedAt) <= Date.parse(`${shiftDay(dateKey, -7)}T00:00:00+05:30`) && !recentType("INACTIVITY", 14)) return make("INACTIVITY", "Ready when you are", "You haven't logged learning activity in the last seven days. One short session is a good place to restart.", { inactiveWindowDays: 7, actionLabel: "Start a short workout" }, "/?view=workout")
  return null
}
