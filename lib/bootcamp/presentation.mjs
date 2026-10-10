const FREE_DAY_ACCESS_SOURCES = new Set(['day1_free', 'first_free'])
const PAID_ACCESS_SOURCES = new Set(['subscription', 'test_series', 'institute', 'purchase'])

export function canPromoteBootCampFreeDay(access) {
  return access?.allowed === true && FREE_DAY_ACCESS_SOURCES.has(access.source)
}

export function hasPaidBootCampAccess(access) {
  return access?.allowed === true && PAID_ACCESS_SOURCES.has(access.source)
}
