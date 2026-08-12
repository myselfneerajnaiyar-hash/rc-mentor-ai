import { TRIAL_DURATION_MS, TRIAL_EVENT_OFFSETS_MS } from "./config.js"

export function getTrialLifecycle(trialExpiresAt) {
  const expiry = new Date(trialExpiresAt)
  if (Number.isNaN(expiry.getTime())) throw new Error("A valid trial_expires_at is required")

  const start = new Date(expiry.getTime() - TRIAL_DURATION_MS)
  return {
    trialStart: start,
    trialExpiry: expiry,
    lifecycleKey: `trial:${expiry.toISOString()}`,
  }
}

export function buildTrialLifecycleEvents({ userId, trialExpiresAt, trialDays, phone, payload = {} }) {
  if (!userId) throw new Error("userId is required")
  if (trialDays !== 3) {
    throw new Error("WhatsApp trial lifecycle is restricted to the current three-day trial")
  }
  const { trialStart, lifecycleKey } = getTrialLifecycle(trialExpiresAt)

  return Object.entries(TRIAL_EVENT_OFFSETS_MS).map(([eventType, offset]) => ({
    userId,
    eventType,
    lifecycleKey,
    scheduledFor: new Date(trialStart.getTime() + offset),
    phoneSnapshot: phone || null,
    payload,
  }))
}
