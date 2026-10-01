import { bootCampDate } from './calendar.mjs'

// Only release-date decisions use this clock. Database deadlines and entitlement
// expiry retain real time; request parameters can never change the calendar.
export function bootCampClock(env = process.env) {
  if (env.NODE_ENV !== 'development' || !env.BOOTCAMP_TEST_DATE) return new Date()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(env.BOOTCAMP_TEST_DATE)) throw Error('BOOTCAMP_TEST_DATE must be YYYY-MM-DD')
  return bootCampDate(env.BOOTCAMP_TEST_DATE)
}

export function isBootCampPreviewUser(email, env = process.env) {
  if (env.VERCEL_ENV !== 'preview' || typeof email !== 'string' || !email) return false
  return new Set(String(env.BOOTCAMP_PREVIEW_USERS || '').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean)).has(email.toLowerCase())
}

export function bootCampPreviewDate(value,email,env=process.env) {
  if(!isBootCampPreviewUser(email,env)||!value)return null
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('BOOTCAMP_TEST_DATE must be YYYY-MM-DD')
  return bootCampDate(value)
}
