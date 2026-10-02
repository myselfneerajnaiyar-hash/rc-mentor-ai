export const DAILY_RC_CATEGORIES = Object.freeze({
  CAT_PYQ: "cat_pyq",
  DAILY_RC_CHALLENGE: "daily_rc_challenge",
})

/** @typedef {"cat_pyq" | "daily_rc_challenge"} DailyRcCategory */

/** Legacy rows without metadata remain CAT PYQs. */
export function normalizeDailyRcCategory(category) {
  return category === DAILY_RC_CATEGORIES.DAILY_RC_CHALLENGE
    ? DAILY_RC_CATEGORIES.DAILY_RC_CHALLENGE
    : DAILY_RC_CATEGORIES.CAT_PYQ
}

/** Filter passages by category and attempt status as independent dimensions. */
export function filterDailyRcHistory(sets, category, status, attemptedSetIds = new Set()) {
  const normalizedCategory = normalizeDailyRcCategory(category)
  return (sets || []).filter((set) => {
    if (normalizeDailyRcCategory(set.category) !== normalizedCategory) return false
    const attempted = attemptedSetIds.has(set.id)
    if (status === "attempted") return attempted
    if (status === "unattempted") return !attempted
    return true
  })
}
