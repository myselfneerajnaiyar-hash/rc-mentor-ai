export const WHATSAPP_EVENT_TYPES = Object.freeze([
  "trial_welcome",
  "trial_no_session",
  "trial_day1",
  "trial_day2",
  "trial_day3",
  "trial_day4_discount",
  "trial_day7_discount_expiry",
])

export const WHATSAPP_EVENT_STATUSES = Object.freeze([
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
])

export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000
export const WHATSAPP_SENDER_IMPLEMENTED = false

export const TRIAL_EVENT_OFFSETS_MS = Object.freeze({
  trial_welcome: 0,
  trial_no_session: 5 * 60 * 60 * 1000,
  trial_day2: 48 * 60 * 60 * 1000,
  trial_day3: 72 * 60 * 60 * 1000,
  trial_day4_discount: 96 * 60 * 60 * 1000,
  trial_day7_discount_expiry: 168 * 60 * 60 * 1000,
})

export function isWhatsAppAutomationEnabled(env = process.env) {
  return env.WHATSAPP_AUTOMATION_ENABLED === "true"
}

export function isWhatsAppSenderReady(env = process.env) {
  return WHATSAPP_SENDER_IMPLEMENTED && env.WHATSAPP_SENDER_READY === "true"
}
