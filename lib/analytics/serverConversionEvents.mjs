import { createHash } from "node:crypto"
import { sanitizeAttributionValue } from "../attribution.mjs"

function hash(value) {
  if (!value) return undefined
  return createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex")
}

function deterministicUuid(value) {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function sourceUrl(env, path) {
  const configured = env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "")
  if (!configured) return undefined
  try { return new URL(path, configured).toString() } catch { return undefined }
}

export function getMetaConfigurationError(env = process.env) {
  const missing = []
  if (!/^\d+$/.test(String(env.NEXT_PUBLIC_META_PIXEL_ID || ""))) missing.push("NEXT_PUBLIC_META_PIXEL_ID (numeric Meta Pixel ID)")
  if (!env.META_CONVERSIONS_API_ACCESS_TOKEN) missing.push("META_CONVERSIONS_API_ACCESS_TOKEN")
  if (!env.META_GRAPH_API_VERSION) missing.push("META_GRAPH_API_VERSION")
  if (!env.NEXT_PUBLIC_SITE_URL && !env.NEXT_PUBLIC_APP_URL && !env.VERCEL_URL) missing.push("NEXT_PUBLIC_SITE_URL")
  else if (!sourceUrl(env, "/")) missing.push("NEXT_PUBLIC_SITE_URL (must be an absolute URL)")
  if (env.META_PIXEL_ID && env.NEXT_PUBLIC_META_PIXEL_ID && env.META_PIXEL_ID !== env.NEXT_PUBLIC_META_PIXEL_ID) {
    return { code: "meta_pixel_id_mismatch", missing: ["META_PIXEL_ID must match NEXT_PUBLIC_META_PIXEL_ID"] }
  }
  return missing.length ? { code: "meta_capi_configuration_missing", missing } : null
}

function metaUrl(env) {
  return `https://graph.facebook.com/${encodeURIComponent(env.META_GRAPH_API_VERSION)}/${encodeURIComponent(env.NEXT_PUBLIC_META_PIXEL_ID)}/events?access_token=${encodeURIComponent(env.META_CONVERSIONS_API_ACCESS_TOKEN)}`
}

async function postMetaEvent({ event, env, fetchImpl }) {
  const response = await fetchImpl(metaUrl(env), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: [event] }),
  })
  if (!response.ok) {
    const error = `Meta Conversions API returned HTTP ${response.status}`
    return response.status >= 500
      ? { sent: false, provider: "meta", error, retryable: false, deliveryUnknown: true }
      : { sent: false, provider: "meta", error, retryable: true }
  }
  let body
  try { body = await response.json() } catch {
    return { sent: false, provider: "meta", error: "Meta response could not confirm delivery", retryable: false, deliveryUnknown: true }
  }
  if (!Number.isFinite(body?.events_received)) {
    return { sent: false, provider: "meta", error: "Meta response could not confirm delivery", retryable: false, deliveryUnknown: true }
  }
  if (body.events_received < 1) return { sent: false, provider: "meta", error: "Meta did not accept the conversion event", retryable: true }
  return { sent: true, provider: "meta" }
}

function attributionIds(profile = {}, authUser = {}) {
  const metadata = authUser.user_metadata?.signup_attribution || {}
  const firstTouch = {
    ...(metadata.firstTouch || metadata.first_touch || {}),
    ...(profile.signup_attribution_first_touch || {}),
  }
  const lastTouch = {
    ...(metadata.lastTouch || metadata.last_touch || {}),
    ...(profile.signup_attribution_last_touch || {}),
  }
  const ids = {}
  const fbc = sanitizeAttributionValue("fbc", lastTouch.fbc || firstTouch.fbc || "")
  const fbp = sanitizeAttributionValue("fbp", lastTouch.fbp || firstTouch.fbp || "")
  if (fbc) ids.fbc = fbc
  if (fbp) ids.fbp = fbp
  return ids
}

function metaUserData({ userId, profile, authUser }) {
  const email = profile?.email || authUser?.email
  const phone = String(profile?.phone || authUser?.phone || "").replace(/\D/g, "")
  return {
    external_id: [hash(userId)],
    ...(email ? { em: [hash(email)] } : {}),
    ...(phone ? { ph: [hash(phone)] } : {}),
    ...attributionIds(profile, authUser),
  }
}

async function sendPostHogPurchase({ purchase, userId, paidAt, env, fetchImpl }) {
  const apiKey = env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return { sent: false, provider: "posthog", skipped: "missing_posthog_key", retryable: true }
  const timestamp = new Date(paidAt).toISOString()
  const eventUuid = deterministicUuid(`purchase_completed:${purchase.razorpay_payment_id}:${userId}`)
  const amount = Number(purchase.amount_paid_paise) / 100
  const base = String(env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/+$/, "")
  const response = await fetchImpl(`${base}/i/v0/e/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event: "purchase_completed",
      distinct_id: userId,
      uuid: eventUuid,
      timestamp,
      properties: {
        amount,
        currency: purchase.currency,
        product: purchase.plan,
        plan: purchase.plan,
        payment_id: purchase.razorpay_payment_id,
        order_id: purchase.razorpay_order_id,
        user_id: userId,
      },
    }),
  })
  if (!response.ok) return { sent: false, provider: "posthog", error: `PostHog capture returned HTTP ${response.status}`, retryable: response.status < 500 }
  return { sent: true, provider: "posthog", eventUuid }
}

async function sendMetaPurchase({ purchase, profile, userId, paidAt, env, fetchImpl }) {
  const configError = getMetaConfigurationError(env)
  if (configError) return { sent: false, provider: "meta", skipped: configError.code, missing: configError.missing, retryable: true }
  const eventId = `purchase:${purchase.razorpay_payment_id}`
  const result = await postMetaEvent({
    env,
    fetchImpl,
    event: {
      event_name: "Purchase",
      event_time: Math.floor(new Date(paidAt).getTime() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: sourceUrl(env, "/payment-success"),
      user_data: metaUserData({ userId, profile }),
      custom_data: {
        value: Number(purchase.amount_paid_paise) / 100,
        currency: purchase.currency,
        content_name: purchase.plan,
        content_type: "product",
        content_ids: [purchase.plan],
      },
    },
  })
  return result.sent ? { ...result, eventId } : result
}

export async function sendMetaSignup({ userId, method, authUser, profile = {}, env = process.env, fetchImpl = fetch }) {
  const configError = getMetaConfigurationError(env)
  if (configError) return { sent: false, provider: "meta", skipped: configError.code, missing: configError.missing, retryable: true }
  const eventId = `signup:${userId}`
  const result = await postMetaEvent({
    env,
    fetchImpl,
    event: {
      event_name: "CompleteRegistration",
      event_time: Math.floor(new Date(authUser.created_at).getTime() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: sourceUrl(env, "/signup"),
      user_data: metaUserData({ userId, profile, authUser }),
      custom_data: { signup_method: method },
    },
  })
  return result.sent ? { ...result, eventId } : result
}

export async function sendPurchaseConversionForProvider({ provider, ...args }) {
  try {
    if (provider === "posthog") return await sendPostHogPurchase(args)
    if (provider === "meta") return await sendMetaPurchase(args)
    throw new Error(`Unsupported purchase conversion provider: ${provider}`)
  } catch {
    // A network exception may happen after Meta accepted the request. Never
    // automatically retry an event with an uncertain delivery outcome.
    return { sent: false, provider, error: `${provider}_transport_outcome_unknown`, retryable: false, deliveryUnknown: true }
  }
}

export async function sendPurchaseConversionEvents({ purchase, profile, userId, paidAt, env = process.env, fetchImpl = fetch }) {
  const results = await Promise.allSettled([
    sendPurchaseConversionForProvider({ provider: "posthog", purchase, userId, paidAt, env, fetchImpl }),
    sendPurchaseConversionForProvider({ provider: "meta", purchase, profile, userId, paidAt, env, fetchImpl }),
  ])
  return results.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { sent: false, provider: index === 0 ? "posthog" : "meta", error: "conversion_delivery_unknown", deliveryUnknown: true })
}

export function getPurchaseEventIdentity({ purchase, userId }) {
  return {
    metaEventId: `purchase:${purchase.razorpay_payment_id}`,
    posthogUuid: deterministicUuid(`purchase_completed:${purchase.razorpay_payment_id}:${userId}`),
  }
}
