import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireCapability } from "@/lib/tenant/requireCapability"
import {
  formatWeeklyRcDisplayDate,
  getPreviousWeeklyRcWindow,
  getWeeklyRcWindow,
  loadWeeklyRcStandings,
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
  return loadWeeklyRcStandings(supabase, window)
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
