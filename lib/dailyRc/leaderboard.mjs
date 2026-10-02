import { normalizeDailyRcCategory } from "./categories.mjs"

export function selectDailyRcLeaderboardSet(query, category, today) {
  const selectedCategory = normalizeDailyRcCategory(category)
  let filtered = query
    .eq("challenge_date", today)
    .eq("category", selectedCategory)
  if (selectedCategory === "daily_rc_challenge") filtered = filtered.eq("is_published", true)
  return filtered
}

export async function loadDailyRcLeaderboard(db, { category, today, currentUserId }) {
  const { data: todaySet, error: setError } = await selectDailyRcLeaderboardSet(
    db.from("daily_rc_sets").select("id"),
    category,
    today,
  ).maybeSingle()

  if (setError) return { error: setError, stage: "set" }
  if (!todaySet) return { data: { top: [], yourRank: null, totalParticipants: 0 } }

  const { data: attempts, error: attemptsError } = await db
    .from("daily_rc_attempts")
    .select("user_id,score,time_taken")
    .eq("daily_rc_set_id", todaySet.id)
    .order("score", { ascending: false })
    .order("time_taken", { ascending: true })

  if (attemptsError) return { error: attemptsError, stage: "attempts" }

  const rows = attempts || []
  const rankIndex = rows.findIndex((row) => row.user_id === currentUserId)
  const topRows = rows.slice(0, 10)
  const userIds = [...new Set(topRows.map((row) => row.user_id).filter(Boolean))]
  const { data: profiles, error: profileError } = userIds.length
    ? await db.from("profiles").select("user_id,name").in("user_id", userIds)
    : { data: [], error: null }

  return {
    data: {
      top: topRows.map((row) => ({
        ...row,
        profiles: {
          name: profiles?.find((profile) => profile.user_id === row.user_id)?.name || "Reader",
        },
      })),
      yourRank: rankIndex === -1 ? null : rankIndex + 1,
      totalParticipants: rows.length,
    },
    profileError,
    selectedSetId: todaySet.id,
  }
}
