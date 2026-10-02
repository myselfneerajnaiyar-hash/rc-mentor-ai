const DAY_MS = 24 * 60 * 60 * 1000

function timestamp(value) {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

export function getTrialBannerState({ entitlement, trialStartedAt, trialExpiresAt, now = new Date() } = {}) {
  if (entitlement?.isInstituteStudent || entitlement?.isPremium || entitlement?.hasAccess && entitlement?.kind !== "trial") {
    return { type: "none" }
  }

  const currentTime = timestamp(now)
  const expiresAt = timestamp(trialExpiresAt)
  if (currentTime === null || expiresAt === null) return { type: "none" }
  if (expiresAt <= currentTime) return { type: "expired", expiresAt: new Date(expiresAt).toISOString() }

  const remainingMs = expiresAt - currentTime
  if (remainingMs <= DAY_MS) {
    return { type: "ending", expiresAt: new Date(expiresAt).toISOString(), remainingMs }
  }

  const startedAt = timestamp(trialStartedAt)
  if (startedAt === null || startedAt > currentTime) return { type: "none" }
  const elapsedMs = currentTime - startedAt
  const day = Math.floor(elapsedMs / DAY_MS) + 1
  if ((day === 2 || day === 3) && elapsedMs < 3 * DAY_MS) {
    return {
      type: "offer",
      day,
      startedAt: new Date(startedAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    }
  }

  return { type: "none" }
}

export function trialBannerDismissalKey(state) {
  if (!state || state.type === "none") return null
  return `trial-conversion:${state.type}:${state.startedAt || state.expiresAt || "unknown"}`
}
