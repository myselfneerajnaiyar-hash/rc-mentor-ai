import { bootCampDate } from './calendar.mjs'

function previewDateOnly(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('BOOTCAMP_TEST_DATE must be YYYY-MM-DD')
  const parsed=new Date(`${value}T00:00:00Z`)
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new Error('Invalid calendar date')
  // Keep calendar-date input as a date string; converting it through local
  // midnight can shift the selected day when the runtime timezone differs.
  return value
}

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
  return previewDateOnly(value)
}
