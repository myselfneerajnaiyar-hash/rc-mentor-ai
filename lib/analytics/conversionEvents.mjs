import { normalizeAttribution, postHogAttributionProperties, readBrowserAttribution } from "../attribution.mjs"

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

async function dispatchSignupToServer({ userId, method, surface }) {
  if (typeof globalThis.window === "undefined" || typeof globalThis.fetch !== "function") return
  const body = JSON.stringify({ userId, method, ...(surface ? { surface } : {}) })
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await globalThis.fetch("/api/conversions/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      })
      if (response.ok || response.status === 202) return
      if (response.status === 503 && attempt === 0) {
        const result = await response.clone().json().catch(() => null)
        if (result?.required?.length) console.error(`Meta CompleteRegistration configuration is missing: ${result.required.join(", ")}`)
      }
      if (response.status < 500 || attempt === 1) return
    } catch {
      if (attempt === 1) return
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}

export function identifyPostHogUser({ userId, posthog, attribution, userProperties = {} }) {
  if (typeof userId !== "string" || !userId || !posthog?.identify) return false
  const supplied = normalizeAttribution(attribution)
  const browser = readBrowserAttribution()
  const resolved = {
    firstTouch: Object.keys(supplied.firstTouch).length ? supplied.firstTouch : browser.firstTouch,
    lastTouch: Object.keys(browser.lastTouch).length ? browser.lastTouch : supplied.lastTouch,
  }
  const attributionProperties = postHogAttributionProperties(resolved)
  const firstTouchProperties = Object.fromEntries(Object.entries(attributionProperties).filter(([key]) => key.startsWith("first_touch_") || key === "landing_referrer"))
  const lastTouchProperties = Object.fromEntries(Object.entries(attributionProperties).filter(([key]) => key.startsWith("last_touch_")))
  try {
    posthog.identify(userId, { ...userProperties, ...lastTouchProperties }, firstTouchProperties)
    return true
  } catch {
    return false
  }
}

export function captureSignupConversion({ userId, method, createdAt, posthog, pixel, redditPixel, storage = browserStorage(), surface, attribution, placement }) {
  if (typeof userId !== "string" || !userId) return false
  const eventId = `signup:${userId}`
  const shouldCaptureBrowser = claimEvent(storage, `auctor.conversion.${eventId}`)
  const browserAttribution = readBrowserAttribution()
  const suppliedAttribution = normalizeAttribution(attribution)
  const signupAttribution = {
    firstTouch: Object.keys(suppliedAttribution.firstTouch).length ? suppliedAttribution.firstTouch : browserAttribution.firstTouch,
    lastTouch: Object.keys(browserAttribution.lastTouch).length ? browserAttribution.lastTouch : suppliedAttribution.lastTouch,
  }
  const attributionProperties = postHogAttributionProperties(signupAttribution)

  if (shouldCaptureBrowser) {
    identifyPostHogUser({ userId, posthog, attribution: signupAttribution })
    try {
      posthog?.capture?.("user_signed_up", {
        signup_method: method,
        ...(surface ? { signup_surface: surface } : {}),
        ...attributionProperties,
        ...(Object.keys(signupAttribution.firstTouch).length || Object.keys(signupAttribution.lastTouch).length ? { signup_attribution: signupAttribution } : {}),
        ...(surface === "preview_ad_inline" ? {
          placement: placement || "google_oauth_callback",
          viewport_width: typeof window !== "undefined" ? window.innerWidth : null,
          in_app_browser: typeof navigator !== "undefined" && /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS|FBMessenger/i.test(navigator.userAgent || ""),
        } : {}),
      }, {
        uuid: userId,
        ...(createdAt ? { timestamp: new Date(createdAt) } : {}),
      })
    } catch { /* Conversion tracking must not block signup. */ }
    if (surface === "preview_ad_inline") {
      try {
        posthog?.capture?.("signup_succeeded", {
          signup_surface: surface,
          placement: placement || "google_oauth_callback",
          method,
          viewport_width: typeof window !== "undefined" ? window.innerWidth : null,
          in_app_browser: typeof navigator !== "undefined" && /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS|FBMessenger/i.test(navigator.userAgent || ""),
        })
      } catch { /* Analytics must not block signup. */ }
    }
    try { pixel?.("track", "CompleteRegistration", {}, { eventID: eventId }) } catch { /* Pixel is best-effort. */ }
  }
  if (typeof redditPixel === "function" && claimEvent(storage, `auctor.reddit.conversion.${eventId}`)) {
    try { redditPixel("track", "SignUp", { conversionId: eventId }) } catch { /* Reddit Pixel is best-effort. */ }
  }
  // Server CAPI remains attempted even when browser storage suppresses a repeat
  // Pixel/PostHog event. The server outbox deduplicates safely by auth user ID.
  void dispatchSignupToServer({ userId, method, surface })
  return shouldCaptureBrowser
}

export function capturePurchasePixel({ paymentId, value, currency, contentName, contentId, orderId, pixel, redditPixel, storage = browserStorage() }) {
  if (typeof paymentId !== "string" || !paymentId || !Number.isFinite(Number(value)) || Number(value) <= 0) return false
  if (currency !== "INR") return false
  const eventId = `purchase:${paymentId}`
  let sent = false
  if (typeof pixel === "function" && claimEvent(storage, `auctor.conversion.${eventId}`)) {
    try {
      pixel("track", "Purchase", {
        value: Number(value), currency,
        ...(contentName ? { content_name: contentName } : {}),
        ...(contentId ? { content_ids: [contentId], content_type: "product" } : {}),
        ...(orderId ? { order_id: orderId } : {}),
      }, { eventID: eventId })
      sent = true
    } catch { /* Pixel is best-effort; server-side CAPI is authoritative. */ }
  }
  if (typeof redditPixel === "function" && claimEvent(storage, `auctor.reddit.conversion.${eventId}`)) {
    try {
      redditPixel("track", "Purchase", {
        value: Number(value), currency, conversionId: eventId,
      })
      sent = true
    } catch { /* Reddit Pixel is best-effort. */ }
  }
  return sent
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
