export function filterDailyRcHistorySets(query, { category, status, today, attemptedSetIds = [] }) {
  let filtered = query.eq("category", category)
  if (category === "daily_rc_challenge") filtered = filtered.eq("is_published", true)

  if (status === "attempted") {
    const dated = category === "daily_rc_challenge"
      ? filtered.lte("challenge_date", today)
      : filtered.lt("challenge_date", today)
    return dated.in("id", attemptedSetIds)
  }

  filtered = filtered.lt("challenge_date", today)
  if (attemptedSetIds.length) {
    filtered = filtered.not("id", "in", `(${attemptedSetIds.join(",")})`)
  }
  return filtered
}
