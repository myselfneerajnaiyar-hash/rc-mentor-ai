const DAY_MS = 24 * 60 * 60 * 1000

function time(value) {
  const parsed = value instanceof Date ? value.getTime() : new Date(value || "").getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function hasPaidAccess(entitlement) {
  return Boolean(
    entitlement?.isPremium ||
    entitlement?.isInstituteStudent ||
    entitlement?.kind === "cat_test_series" ||
    entitlement?.kind === "subscription" ||
    entitlement?.kind === "premium" ||
    entitlement?.kind === "institute" ||
    entitlement?.hasAccess && entitlement?.kind !== "trial"
  )
}

export function getTrialPromotionState({ profile, entitlement, now = new Date() } = {}) {
  if (hasPaidAccess(entitlement)) return { type: "none" }

  const currentTime = time(now)
  const expiresAt = time(profile?.trial_expires_at)
  if (currentTime === null || expiresAt === null) return { type: "none" }

  if (expiresAt <= currentTime) {
    return { type: "expired", expiresAt: new Date(expiresAt).toISOString() }
  }

  const startedAt = time(profile?.trial_started_at)
  const daysRemaining = Math.max(1, Math.ceil((expiresAt - currentTime) / DAY_MS))
  const trialDay = startedAt === null || startedAt > currentTime
    ? null
    : Math.floor((currentTime - startedAt) / DAY_MS) + 1

  return {
    type: "active",
    daysRemaining,
    trialDay,
    expiresAt: new Date(expiresAt).toISOString(),
  }
}

export function trialEndedOfferKeys({ userId, expiresAt, now = new Date() } = {}) {
  const currentTime = time(now)
  if (!userId || !expiresAt || currentTime === null) return null
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(currentTime))
  const expiry = new Date(expiresAt).toISOString()
  return {
    daily: `auctor:trial-ended-offer:${userId}:${expiry}:${date}`,
    session: `auctor:pricing-prompt-shown:${userId}`,
  }
}

export function canShowTrialEndedOffer({ userId, profile, entitlement, now = new Date(), dailyStorage, sessionStorage } = {}) {
  const state = getTrialPromotionState({ profile, entitlement, now })
  if (state.type !== "expired") return false

  const keys = trialEndedOfferKeys({ userId, expiresAt: state.expiresAt, now })
  if (!keys) return false

  try {
    if (dailyStorage?.getItem(keys.daily) || sessionStorage?.getItem(keys.session)) return false
  } catch {
    // Storage can be unavailable; the caller still gates this once per mount.
  }
  return true
}

export function claimTrialEndedOffer({ userId, profile, entitlement, now = new Date(), dailyStorage, sessionStorage } = {}) {
  if (!canShowTrialEndedOffer({ userId, profile, entitlement, now, dailyStorage, sessionStorage })) return false
  const state = getTrialPromotionState({ profile, entitlement, now })
  const keys = trialEndedOfferKeys({ userId, expiresAt: state.expiresAt, now })
  try {
    dailyStorage?.setItem(keys.daily, "1")
    sessionStorage?.setItem(keys.session, "1")
  } catch {
    // The component also keeps an in-memory claim for storage-restricted browsers.
  }
  return true
}
