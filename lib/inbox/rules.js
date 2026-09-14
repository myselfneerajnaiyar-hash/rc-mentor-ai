import { summarizeActivity, shiftDay } from "./activity.js"
import { getExamCapabilities } from "../tenant/capabilities.js"
const ROUTES = { "Daily RC": "/daily-challenge", "RC / Precision": "/?view=precision", Vocabulary: "/?view=vocab", "Speed Drills": "/?view=speed", "Daily Workout": "/?view=workout", "CAT sectionals": "/?view=cat", Grammar: "/?view=grammar" }
export function chooseDailyNotification({ userId, firstName, dateKey, events = [], history = [], accountCreatedAt, exam = "CAT" }) {
  const capabilities = getExamCapabilities(exam)
  const availableModules = Object.keys(ROUTES).filter((module) => (module !== "Daily RC" || capabilities.showDailyRC) && (module !== "CAT sectionals" || capabilities.showCATSectionals))
  const yesterdayKey = shiftDay(dateKey, -1)
  const yesterday = summarizeActivity(events, yesterdayKey, dateKey)
  const common = { userId, source: "Auctor", idempotencyKey: `daily:${dateKey}`, proactiveDate: dateKey, priority: 2 }
  const name = String(firstName || "You").trim().split(/\s+/)[0]
  const seenRule = (key) => history.some((row) => row.rule_key === key)
  const recentType = (type, days) => history.some((row) => row.type === type && Date.parse(row.created_at) >= Date.parse(`${shiftDay(dateKey, -days)}T00:00:00+05:30`))
  const make = (type, title, body, metadata, actionUrl = "/", ruleKey = null) => ({ ...common, type, title, body, preview: body.slice(0, 320), metadata, actionUrl, ruleKey })
  const days = new Set(events.filter((event) => !event.engagement).map((event) => event.day))
  let streak = 0
  while (days.has(shiftDay(dateKey, -streak - 1)) && streak < 28) streak++
  // Each milestone belongs to a specific uninterrupted run; retries also share the daily key.
  const streakKey = `streak:${shiftDay(dateKey, -streak)}:${streak}`
  if ([7, 14, 28].includes(streak) && !seenRule(streakKey)) return make("STREAK", `${streak}-day streak`, `You've practiced on each of the last ${streak} days. Keep your next session focused.`, { streakDays: streak, actionLabel: "Continue practicing" }, "/?view=workout", streakKey)
  const achievementKey = `questions-in-day:${yesterdayKey}:100`
  if (yesterday.questions >= 100 && !seenRule(achievementKey)) return make("ACHIEVEMENT", "100 questions in a day", `You completed ${yesterday.questions} questions yesterday. That is a real practice milestone.`, { ...yesterday, period: yesterdayKey, actionLabel: "Continue learning" }, "/", achievementKey)
  for (const module of availableModules) {
    const moduleEvents = events.filter((event) => event.module === module)
    const recent = summarizeActivity(moduleEvents, shiftDay(dateKey, -7), dateKey)
    const previous = summarizeActivity(moduleEvents, shiftDay(dateKey, -14), shiftDay(dateKey, -7))
    if (yesterday.hasActivity && recent.questions >= 20 && previous.questions >= 20 && recent.accuracyPercent - previous.accuracyPercent >= 5 && !recentType("PROGRESS", 7)) return make("PROGRESS", `You're improving in ${module}`, `Your ${module} accuracy increased from ${previous.accuracyPercent}% in the previous week to ${recent.accuracyPercent}% in the last week.`, { module, previousAccuracy: previous.accuracyPercent, accuracyPercent: recent.accuracyPercent, questions: recent.questions, previousQuestions: previous.questions, actionLabel: `Practice ${module}` }, ROUTES[module])
  }
  if (yesterday.questions > 0) return make("PERFORMANCE_UPDATE", "Yesterday's performance", `${name}, you completed ${yesterday.questions} questions across ${yesterday.questionActivitiesCount} practice ${yesterday.questionActivitiesCount === 1 ? "session" : "sessions"}, with ${yesterday.accuracyPercent}% accuracy.`, { ...yesterday, period: yesterdayKey, actionLabel: "Continue learning" })
  // A learner who already returned today must not receive an inactivity reminder.
  if (summarizeActivity(events, dateKey, shiftDay(dateKey, 1)).hasActivity) return null
  if (!recentType("DAILY_RECOMMENDATION", 7)) {
    const measured = events.filter((event) => event.day >= shiftDay(dateKey, -7) && event.questions > 0)
    const candidates = availableModules.map((module) => ({ module, ...summarizeActivity(measured.filter((event) => event.module === module), shiftDay(dateKey, -7), dateKey) })).filter((item) => item.questions >= 20 && item.accuracyPercent < 65).sort((a, b) => a.accuracyPercent - b.accuracyPercent)
    if (candidates.length) {
      const weakest = candidates[0]
      const skillGroups = new Map()
      for (const event of measured.filter((event) => event.module === weakest.module && event.skill)) { const group = skillGroups.get(event.skill) || []; group.push(event); skillGroups.set(event.skill, group) }
      const skill = [...skillGroups].map(([name, items]) => ({ name, ...summarizeActivity(items, shiftDay(dateKey, -7), dateKey) })).filter((item) => item.questions >= 5 && item.accuracyPercent < 65).sort((a, b) => a.accuracyPercent - b.accuracyPercent)[0]
      return make("DAILY_RECOMMENDATION", `Today's focus: ${weakest.module}`, `Your recent ${weakest.module} accuracy is ${weakest.accuracyPercent}% across ${weakest.questions} questions.${skill ? ` Give ${skill.name} some focused practice.` : " A focused practice session could help."}`, { module: weakest.module, skill: skill?.name || null, questions: weakest.questions, accuracyPercent: weakest.accuracyPercent, actionLabel: `Practice ${weakest.module}` }, ROUTES[weakest.module])
    }
  }
  const recent = summarizeActivity(events, shiftDay(dateKey, -7), dateKey)
  if (!recent.hasActivity && accountCreatedAt && Date.parse(accountCreatedAt) <= Date.parse(`${shiftDay(dateKey, -7)}T00:00:00+05:30`) && !recentType("INACTIVITY", 14)) return make("INACTIVITY", "Ready when you are", "You haven't logged learning activity in the last seven days. One short session is a good place to restart.", { inactiveWindowDays: 7, actionLabel: "Start a short workout" }, "/?view=workout")
  return null
}
