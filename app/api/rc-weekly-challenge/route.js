import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireCapability } from "@/lib/tenant/requireCapability"
import {
  formatWeeklyRcDisplayDate,
  getPreviousWeeklyRcWindow,
  getWeeklyRcWindow,
  rankWeeklyRcPlayers,
  shouldFinalizeWeeklyRcCompetition,
} from "@/lib/weeklyRcCompetition"

export const dynamic = "force-dynamic"
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function GET(request) {
  try {
    const access = await requireCapability(request, "showDailyRC")
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Daily RC is not available for your exam" }, { status: access.status })
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
    const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit")) || 25))
    const currentUserId = access.identity.user.id
    const currentWeek = getWeeklyRcWindow()
    const previousWeek = getPreviousWeeklyRcWindow()

    const standings = await calculateWeeklyStandings(currentWeek)
    const ranked = rankWeeklyRcPlayers(standings).map((player, index) => ({
      ...player,
      rank: index + 1,
    }))

    await finalizeWeekIfNeeded(previousWeek)

    const { data: latestChampion } = await supabase
      .from("weekly_rc_competitions")
      .select("week_start,week_end,winner_user_id,winner_name,winner_score,finalized_at")
      .eq("status", "finalized")
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle()

    const offset = (page - 1) * limit
    const currentUser = currentUserId
      ? ranked.find((player) => player.userId === currentUserId) || null
      : null

    return NextResponse.json({
      competition: {
        title: "Weekly RC Challenge",
        weekStart: currentWeek.weekStart,
        weekEnd: currentWeek.weekEnd,
        weekLabel: `${formatWeeklyRcDisplayDate(currentWeek.start)} – ${formatWeeklyRcDisplayDate(currentWeek.end)}`,
        endsAt: currentWeek.nextStart.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      leaderboard: ranked.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        totalParticipants: ranked.length,
        totalPages: Math.max(1, Math.ceil(ranked.length / limit)),
      },
      currentUser,
      latestChampion: latestChampion || null,
      tieBreaker: [
        "Highest weekly composite score",
        "Higher accuracy",
        "Lower total time",
        "Earlier final completion",
        "Stable user ID order",
      ],
    })
  } catch (error) {
    console.error("Weekly RC leaderboard failed:", error)
    return NextResponse.json({ error: "Unable to load weekly RC leaderboard" }, { status: 500 })
  }
}

async function calculateWeeklyStandings(window) {
  const { data: rawAttempts, error: attemptsError } = await supabase
    .from("daily_rc_attempts")
    .select("id,user_id,daily_rc_set_id,score,composite_score,accuracy,correct_count,incorrect_count,unanswered_count,time_taken,completed_at")
    .gte("completed_at", window.start.toISOString())
    .lt("completed_at", window.nextStart.toISOString())
    .order("completed_at", { ascending: true })

  if (attemptsError) throw attemptsError
  if (!rawAttempts?.length) return []

  const attemptedSetIds = [...new Set(rawAttempts.map((attempt) => attempt.daily_rc_set_id))]
  const { data: publishedSets, error: publishedSetsError } = await supabase
    .from("daily_rc_sets")
    .select("id,challenge_date")
    .in("id", attemptedSetIds)
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
    const points = Number(attempt.score) || 0
    // Weekly ranking only aggregates the immutable composite score already
    // stored by Daily RC. It does not recalculate or alter Daily RC scoring.
    const storedCompositeScore = Number(attempt.composite_score) || 0
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

    aggregate.points += points
    aggregate.weeklyCompositeScore += storedCompositeScore
    aggregate.correct += correct
    aggregate.incorrect += incorrect
    aggregate.unanswered += unanswered
    aggregate.totalTime += Math.max(0, Number(attempt.time_taken) || 0)
    aggregate.attempts += 1
    if (attempt.completed_at > aggregate.lastCompletedAt) aggregate.lastCompletedAt = attempt.completed_at
    aggregates.set(attempt.user_id, aggregate)
  }

  const userIds = [...aggregates.keys()]
  const { data: profiles, error: profilesError } = await supabase
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

async function finalizeWeekIfNeeded(window) {
  const { data: existing, error: existingError } = await supabase
    .from("weekly_rc_competitions")
    .select("id")
    .eq("week_start", window.weekStart)
    .maybeSingle()

  if (existingError) {
    if (existingError.code === "PGRST205" || existingError.code === "42P01") return
    throw existingError
  }
  // Existing snapshots are immutable: a finalized week is never recalculated.
  if (!shouldFinalizeWeeklyRcCompetition(existing)) return

  const ranked = rankWeeklyRcPlayers(await calculateWeeklyStandings(window))
  const winner = ranked[0] || null
  const { error: insertError } = await supabase
    .from("weekly_rc_competitions")
    .insert({
      week_start: window.weekStart,
      week_end: window.weekEnd,
      status: "finalized",
      winner_user_id: winner?.userId || null,
      winner_name: winner?.name || null,
      winner_score: winner?.weeklyCompositeScore ?? null,
      winner_accuracy: winner?.accuracy ?? null,
      winner_time_seconds: winner?.totalTime ?? null,
      participant_count: ranked.length,
      finalized_at: new Date().toISOString(),
    })

  if (insertError?.code !== "23505") {
    if (insertError) throw insertError
  }
}
