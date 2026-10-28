import { dailyRcTodayDate } from "../dailyRc/today.mjs"

const POST_DIAGNOSTIC_PHASES = new Set([
  "DIAGNOSTIC_COMPLETED",
  "DIAGNOSIS_VIEWED",
  "DAILY_RC_MISSION",
])

/** Let the first-session report and optional Day 1 mission expire after their India-local day. */
export function shouldReturnHomeAfterDiagnosticDay(journey, now = new Date()) {
  if (!POST_DIAGNOSTIC_PHASES.has(journey?.phase) || !journey?.diagnostic_completed_at) return false
  const completedAt = new Date(journey.diagnostic_completed_at)
  if (!Number.isFinite(completedAt.getTime())) return false
  return dailyRcTodayDate(completedAt) < dailyRcTodayDate(now)
}
