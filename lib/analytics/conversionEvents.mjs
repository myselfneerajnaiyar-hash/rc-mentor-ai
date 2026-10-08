function claimEvent(storage, key) {
  if (!storage) return true
  try {
    if (storage.getItem(key)) return false
    storage.setItem(key, "1")
  } catch {
    // Storage can be unavailable in privacy modes; the stable event ID is still
    // passed downstream so the analytics provider can collapse retries.
  }
  return true
}

function browserStorage() {
  try { return globalThis.window?.localStorage || null } catch { return null }
}

export function captureSignupConversion({ userId, method, createdAt, posthog, pixel, storage = browserStorage() }) {
  if (typeof userId !== "string" || !userId) return false
  const eventId = `signup:${userId}`
  if (!claimEvent(storage, `auctor.conversion.${eventId}`)) return false

  try { posthog?.identify?.(userId) } catch { /* Conversion tracking must not block signup. */ }
  try {
    posthog?.capture?.("user_signed_up", {
      signup_method: method,
    }, {
      uuid: userId,
      ...(createdAt ? { timestamp: new Date(createdAt) } : {}),
    })
  } catch { /* Conversion tracking must not block signup. */ }
  try { pixel?.("track", "CompleteRegistration", {}, { eventID: eventId }) } catch { /* Pixel is best-effort. */ }
  return true
}

export function capturePurchasePixel({ paymentId, value, currency, contentName, contentId, orderId, pixel, storage = browserStorage() }) {
  if (typeof paymentId !== "string" || !paymentId || !Number.isFinite(Number(value)) || Number(value) <= 0) return false
  if (typeof currency !== "string" || !currency) return false
  const eventId = `purchase:${paymentId}`
  if (!claimEvent(storage, `auctor.conversion.${eventId}`)) return false
  try {
    pixel?.("track", "Purchase", {
      value: Number(value), currency,
      ...(contentName ? { content_name: contentName } : {}),
      ...(contentId ? { content_ids: [contentId], content_type: "product" } : {}),
      ...(orderId ? { order_id: orderId } : {}),
    }, { eventID: eventId })
  } catch { /* Pixel is best-effort; server-side CAPI is authoritative. */ }
  return true
}

export function isNewGoogleSignup(user, now = Date.now()) {
  const googleIdentity = user?.identities?.find(identity => identity?.provider === "google")
  if (!googleIdentity) return false
  const createdAt = Date.parse(user.created_at || googleIdentity.created_at || "")
  if (!Number.isFinite(createdAt) || createdAt > now || now - createdAt > 5 * 60 * 1000) return false
  const lastSignInAt = Date.parse(user.last_sign_in_at || "")
  return !Number.isFinite(lastSignInAt) || Math.abs(lastSignInAt - createdAt) < 2 * 60 * 1000
}

export function captureGoogleLoginFailure({ posthog, surface, error, attemptId }) {
  try {
    posthog?.capture?.("google_login_failed", {
      surface,
      error_code: error?.code || error?.name || "oauth_failed",
      failure_id: attemptId,
    })
  } catch { /* Analytics must not block authentication feedback. */ }
}
