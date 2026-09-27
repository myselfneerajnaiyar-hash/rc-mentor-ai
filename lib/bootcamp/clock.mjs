import { bootCampDate } from './calendar.mjs'

// Only release-date decisions use this clock. Database deadlines and entitlement
// expiry retain real time; request parameters can never change the calendar.
export function bootCampClock(env = process.env) {
  if (env.NODE_ENV !== 'development' || !env.BOOTCAMP_TEST_DATE) return new Date()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(env.BOOTCAMP_TEST_DATE)) throw Error('BOOTCAMP_TEST_DATE must be YYYY-MM-DD')
  return bootCampDate(env.BOOTCAMP_TEST_DATE)
}
