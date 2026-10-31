// Keep the production host aligned with the existing public Auctor RC domain.
export const CANONICAL_PRODUCTION_APP_URL = "https://rc.auctorlabs.in"

const APP_LINK_FIELDS = Object.freeze([
  "loginLink",
  "dailyWorkoutLink",
  "paymentPlanLink",
  "discountPaymentLink",
])

export function resolveWhatsAppAppUrl(requestUrl, env = process.env) {
  if (env.VERCEL_ENV === "production") return CANONICAL_PRODUCTION_APP_URL

  try {
    return new URL(requestUrl).origin
  } catch {
    const configured = env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL || env.APP_URL
    if (configured) {
      try { return new URL(configured).origin } catch { /* use canonical fallback */ }
    }
    return CANONICAL_PRODUCTION_APP_URL
  }
}

export function normalizeWhatsAppAppLinks(payload, env = process.env) {
  if (env.VERCEL_ENV !== "production" || !payload || typeof payload !== "object") return payload

  const normalized = { ...payload }
  for (const field of APP_LINK_FIELDS) {
    const value = normalized[field]
    if (typeof value !== "string" || !value.trim()) continue
    try {
      const url = new URL(value, CANONICAL_PRODUCTION_APP_URL)
      if (url.protocol !== "http:" && url.protocol !== "https:") continue
      normalized[field] = `${CANONICAL_PRODUCTION_APP_URL}${url.pathname}${url.search}${url.hash}`
    } catch {
      // Leave invalid template input intact so existing validation reports it.
    }
  }
  return normalized
}
