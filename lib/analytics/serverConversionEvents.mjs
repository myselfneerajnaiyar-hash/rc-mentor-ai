import { createHash } from "node:crypto"

const DEFAULT_PIXEL_ID = "1724851152297636"

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

function sourceUrl(env) {
  const configured = env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL
  if (configured) {
    try { return new URL("/pricing", configured).toString() } catch { return undefined }
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL.replace(/^https?:\/\//, "")}/pricing`
  return undefined
}

function posthogCaptureUrl(host) {
  const base = String(host || "https://us.i.posthog.com").replace(/\/+$/, "")
  return `${base}/i/v0/e/`
}

async function sendPostHogPurchase({ purchase, userId, paidAt, env, fetchImpl }) {
  const apiKey = env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return { sent: false, skipped: "missing_posthog_key" }
  const timestamp = new Date(paidAt).toISOString()
  const eventUuid = deterministicUuid(`purchase_completed:${purchase.razorpay_payment_id}:${userId}`)
  const amount = Number(purchase.amount_paid_paise) / 100
  const response = await fetchImpl(posthogCaptureUrl(env.NEXT_PUBLIC_POSTHOG_HOST), {
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
  if (!response.ok) throw new Error(`PostHog capture returned HTTP ${response.status}`)
  return { sent: true, eventUuid }
}

async function sendMetaPurchase({ purchase, profile, userId, paidAt, env, fetchImpl }) {
  const accessToken = env.META_CONVERSIONS_API_ACCESS_TOKEN
  const graphVersion = env.META_GRAPH_API_VERSION
  const eventSourceUrl = sourceUrl(env)
  if (!accessToken || !graphVersion || !eventSourceUrl) {
    return { sent: false, skipped: "missing_meta_capi_configuration" }
  }

  const attribution = profile?.signup_attribution_first_touch || {}
  const lastTouch = profile?.signup_attribution_last_touch || {}
  const phone = String(profile?.phone || "").replace(/\D/g, "")
  const userData = {
    external_id: [hash(userId)],
    em: profile?.email ? [hash(profile.email)] : undefined,
    ph: phone ? [hash(phone)] : undefined,
    fbc: attribution.fbc || lastTouch.fbc || undefined,
    fbp: attribution.fbp || lastTouch.fbp || undefined,
  }
  const amount = Number(purchase.amount_paid_paise) / 100
  const url = `https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(env.META_PIXEL_ID || env.NEXT_PUBLIC_META_PIXEL_ID || DEFAULT_PIXEL_ID)}/events`
  const response = await fetchImpl(`${url}?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(new Date(paidAt).getTime() / 1000),
        event_id: `purchase:${purchase.razorpay_payment_id}`,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: {
          value: amount,
          currency: purchase.currency,
          content_name: purchase.plan,
          content_type: "product",
          content_ids: [purchase.plan],
        },
      }],
    }),
  })
  if (!response.ok) throw new Error(`Meta Conversions API returned HTTP ${response.status}`)
  return { sent: true, eventId: `purchase:${purchase.razorpay_payment_id}` }
}

export async function sendPurchaseConversionEvents({ purchase, profile, userId, paidAt, env = process.env, fetchImpl = fetch }) {
  const results = await Promise.allSettled([
    sendPostHogPurchase({ purchase, userId, paidAt, env, fetchImpl }),
    sendMetaPurchase({ purchase, profile, userId, paidAt, env, fetchImpl }),
  ])
  return results.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { sent: false, provider: index === 0 ? "posthog" : "meta", error: result.reason?.message || "send_failed" })
}

export function getPurchaseEventIdentity({ purchase, userId }) {
  return {
    metaEventId: `purchase:${purchase.razorpay_payment_id}`,
    posthogUuid: deterministicUuid(`purchase_completed:${purchase.razorpay_payment_id}:${userId}`),
  }
}
