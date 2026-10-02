import { normalizeDailyRcCategory } from "./categories.mjs"

export function selectDailyRcLeaderboardSet(query, category, today) {
  const selectedCategory = normalizeDailyRcCategory(category)
  let filtered = query
    .eq("challenge_date", today)
    .eq("category", selectedCategory)
  if (selectedCategory === "daily_rc_challenge") filtered = filtered.eq("is_published", true)
  return filtered
}
