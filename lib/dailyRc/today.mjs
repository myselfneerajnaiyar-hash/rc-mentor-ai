export const DAILY_RC_CHALLENGE_CATEGORY = "daily_rc_challenge"

export function dailyRcTodayDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

/** Apply the eligibility rules shared by the homepage and today's challenge API. */
export function filterTodaysDailyRc(query, challengeDate = dailyRcTodayDate()) {
  return query
    .eq("challenge_date", challengeDate)
    .eq("category", DAILY_RC_CHALLENGE_CATEGORY)
    .eq("is_published", true)
}
