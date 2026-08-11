export const WEEKLY_RC_TIME_ZONE = "Asia/Kolkata"
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function getWeeklyRcWindow(now = new Date()) {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS)
  const weekday = istNow.getUTCDay()
  const daysSinceMonday = (weekday + 6) % 7
  const mondayIstAsUtc = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate() - daysSinceMonday
  )
  const start = new Date(mondayIstAsUtc - IST_OFFSET_MS)
  const nextStart = new Date(start.getTime() + 7 * DAY_MS)
  const end = new Date(nextStart.getTime() - 1)

  return {
    start,
    end,
    nextStart,
    weekStart: formatIstDate(start),
    weekEnd: formatIstDate(end),
  }
}

export function getPreviousWeeklyRcWindow(now = new Date()) {
  const current = getWeeklyRcWindow(now)
  return getWeeklyRcWindow(new Date(current.start.getTime() - 1))
}

export function formatIstDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WEEKLY_RC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function formatWeeklyRcDisplayDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: WEEKLY_RC_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function rankWeeklyRcPlayers(players) {
  return [...players].sort((a, b) =>
    b.weeklyCompositeScore - a.weeklyCompositeScore ||
    b.accuracy - a.accuracy ||
    a.totalTime - b.totalTime ||
    a.lastCompletedAt.localeCompare(b.lastCompletedAt) ||
    a.userId.localeCompare(b.userId)
  )
}

export function shouldFinalizeWeeklyRcCompetition(existingSnapshot) {
  return !existingSnapshot
}
