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

/** Aggregate published Daily RC Challenge attempts completed during the IST week. */
export async function loadWeeklyRcStandings(db, window) {
  const { data: rawAttempts, error: attemptsError } = await db
    .from("daily_rc_attempts")
    .select("id,user_id,daily_rc_set_id,score,composite_score,correct_count,incorrect_count,unanswered_count,time_taken,completed_at")
    .gte("completed_at", window.start.toISOString())
    .lt("completed_at", window.nextStart.toISOString())
    .order("completed_at", { ascending: true })

  if (attemptsError) throw attemptsError
  if (!rawAttempts?.length) return []

  const attemptedSetIds = [...new Set(rawAttempts.map((attempt) => attempt.daily_rc_set_id).filter(Boolean))]
  const { data: publishedSets, error: publishedSetsError } = await db
    .from("daily_rc_sets")
    .select("id,challenge_date")
    .in("id", attemptedSetIds)
    .eq("category", "daily_rc_challenge")
    .eq("is_published", true)
    .gte("challenge_date", window.weekStart)
    .lte("challenge_date", window.weekEnd)

  if (publishedSetsError) throw publishedSetsError
  const eligibleSetIds = new Set((publishedSets || []).map((set) => set.id))
  const eligibleAttempts = rawAttempts.filter((attempt) => eligibleSetIds.has(attempt.daily_rc_set_id))

  // Defensive deduplication. The database unique constraint remains the primary guard.
  const uniqueAttempts = []
  const seenChallenges = new Set()
  for (const attempt of eligibleAttempts) {
    const key = `${attempt.user_id}:${attempt.daily_rc_set_id}`
    if (seenChallenges.has(key)) continue
    seenChallenges.add(key)
    uniqueAttempts.push(attempt)
  }

  const aggregates = new Map()
  for (const attempt of uniqueAttempts) {
    const correct = Math.max(0, Number(attempt.correct_count) || 0)
    const incorrect = Math.max(0, Number(attempt.incorrect_count) || 0)
    const unanswered = Math.max(0, Number(attempt.unanswered_count) || 0)
    // Preserve the immutable composite score stored by the Daily RC attempt.
    const aggregate = aggregates.get(attempt.user_id) || {
      userId: attempt.user_id,
      points: 0,
      weeklyCompositeScore: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      totalTime: 0,
      attempts: 0,
      lastCompletedAt: attempt.completed_at,
    }

    aggregate.points += Number(attempt.score) || 0
    aggregate.weeklyCompositeScore += Number(attempt.composite_score) || 0
    aggregate.correct += correct
    aggregate.incorrect += incorrect
    aggregate.unanswered += unanswered
    aggregate.totalTime += Math.max(0, Number(attempt.time_taken) || 0)
    aggregate.attempts += 1
    if (attempt.completed_at > aggregate.lastCompletedAt) aggregate.lastCompletedAt = attempt.completed_at
    aggregates.set(attempt.user_id, aggregate)
  }

  const userIds = [...aggregates.keys()]
  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("user_id,name")
    .in("user_id", userIds)

  if (profilesError) throw profilesError
  const profileNames = new Map((profiles || []).map((profile) => [profile.user_id, profile.name || "Reader"]))

  return [...aggregates.values()]
    .filter((aggregate) => profileNames.has(aggregate.userId))
    .map((aggregate) => {
      const attempted = aggregate.correct + aggregate.incorrect
      return {
        ...aggregate,
        name: profileNames.get(aggregate.userId),
        accuracy: attempted ? Number(((aggregate.correct / attempted) * 100).toFixed(2)) : 0,
      }
    })
}
