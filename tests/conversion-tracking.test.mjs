import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import {
  captureGoogleLoginFailure,
  capturePurchasePixel,
  captureSignupConversion,
  isNewGoogleSignup,
} from "../lib/analytics/conversionEvents.mjs"
import {
  getPurchaseEventIdentity,
  sendPurchaseConversionEvents,
} from "../lib/analytics/serverConversionEvents.mjs"

const paymentProcessor = await readFile(new URL("../lib/payments/processSuccessfulPayment.js", import.meta.url), "utf8")
const verifyRoute = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")
const checkout = await readFile(new URL("../components/SubscribeButton.jsx", import.meta.url), "utf8")
const signupPage = await readFile(new URL("../app/signup/page.jsx", import.meta.url), "utf8")
const inAppBrowserTest = await readFile(new URL("../tests/preview-ad.browser.mjs", import.meta.url), "utf8")
const welcomePage = await readFile(new URL("../app/welcome/page.jsx", import.meta.url), "utf8")
const loginPage = await readFile(new URL("../app/login/page.jsx", import.meta.url), "utf8")
const reportQuery = await readFile(new URL("../supabase/queries/meta_roas_by_first_touch.sql", import.meta.url), "utf8")

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  }
}

test("new email signup fires Meta and PostHog once; repeated renders and existing login do not", () => {
  const storage = memoryStorage()
  const posthogCalls = []
  const pixelCalls = []
  const posthog = {
    identify: (...args) => posthogCalls.push(["identify", ...args]),
    capture: (...args) => posthogCalls.push(["capture", ...args]),
  }
  const pixel = (...args) => pixelCalls.push(args)
  const options = { userId: "user-1", method: "email", createdAt: "2026-10-01T12:00:00Z", posthog, pixel, storage }

  assert.equal(captureSignupConversion(options), true)
  assert.equal(captureSignupConversion(options), false)
  assert.equal(posthogCalls.filter(([kind, event]) => kind === "capture" && event === "user_signed_up").length, 1)
  assert.equal(pixelCalls.filter(([, event]) => event === "CompleteRegistration").length, 1)
  assert.equal(posthogCalls.find(([kind]) => kind === "capture")[3].uuid, "user-1")
  assert.ok(signupPage.includes("captureSignupConversion({ userId: outcome.user.id"))
  assert.doesNotMatch(loginPage, /captureSignupConversion/)
  assert.ok(signupPage.includes('outcome.type === "existing_user"'))
})

test("Google signup conversion only recognizes a recent new Google identity; Google failures have their own event", () => {
  const now = Date.parse("2026-10-06T12:00:00Z")
  const recentUser = {
    created_at: "2026-10-06T11:59:30Z",
    last_sign_in_at: "2026-10-06T11:59:31Z",
    identities: [{ provider: "google", created_at: "2026-10-06T11:59:30Z" }],
  }
  assert.equal(isNewGoogleSignup(recentUser, now), true)
  assert.equal(isNewGoogleSignup({ ...recentUser, created_at: "2025-01-01T00:00:00Z" }, now), false)
  assert.ok(welcomePage.includes('searchParams.get("flow") === "signup"'))
  assert.ok(loginPage.includes("captureGoogleLoginFailure"))
  assert.ok(signupPage.includes("Instagram|FBAN|FBAV|FB_IAB|FBIOS"))
  assert.ok(signupPage.includes("setMetaInAppMobile(inMetaApp && isMobile)"))
  assert.ok(inAppBrowserTest.includes("['Instagram'"))
  assert.ok(inAppBrowserTest.includes("['Facebook'"))

  const captured = []
  captureGoogleLoginFailure({ posthog: { capture: (...args) => captured.push(args) }, surface: "login", error: { code: "oauth_denied" }, attemptId: "attempt-1" })
  assert.equal(captured.length, 1)
  assert.equal(captured[0][0], "google_login_failed")
  assert.equal(captured[0][1].error_code, "oauth_denied")
})

test("Meta Pixel Purchase fires only after verified callback response and is idempotent per payment", () => {
  const storage = memoryStorage()
  const calls = []
  const pixel = (...args) => calls.push(args)
  const purchase = { paymentId: "pay_123", value: 1399.3, currency: "INR" }
  assert.equal(capturePurchasePixel({ ...purchase, pixel, storage }), true)
  assert.equal(capturePurchasePixel({ ...purchase, pixel, storage }), false)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][1], "Purchase")
  assert.deepEqual(calls[0][2], { value: 1399.3, currency: "INR" })
  assert.equal(calls[0][3].eventID, "purchase:pay_123")
  assert.ok(verifyRoute.includes("success: true") && verifyRoute.includes("purchase: {"))
  assert.ok(checkout.includes("if (result.success)") && checkout.includes("capturePurchasePixel"))
  assert.ok(verifyRoute.includes("processSuccessfulPayment"))
})

test("verified purchase sends deduplicatable PostHog and Meta server events with revenue and user attribution", async () => {
  const requests = []
  const purchase = {
    razorpay_payment_id: "pay_123",
    razorpay_order_id: "order_123",
    amount_paid_paise: 139930,
    currency: "INR",
    plan: "yearly",
  }
  const profile = {
    email: "student@example.test",
    phone: "+919876543210",
    signup_attribution_first_touch: {
      campaign_id: "238901",
      adset_id: "238902",
      ad_id: "238903",
    },
    signup_attribution_last_touch: {
      fbc: "fb.1.1720000000000.click_123",
      fbp: "fb.1.1720000000000.12345",
    },
  }
  const env = {
    NEXT_PUBLIC_POSTHOG_KEY: "ph_test_key",
    NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
    META_CONVERSIONS_API_ACCESS_TOKEN: "meta_test_token",
    META_GRAPH_API_VERSION: "v24.0",
    META_PIXEL_ID: "pixel_123",
    NEXT_PUBLIC_SITE_URL: "https://app.example.test",
  }
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options, payload: JSON.parse(options.body) })
    return { ok: true, status: 200 }
  }
  const paidAt = "2026-10-01T12:00:00.000Z"
  const firstResult = await sendPurchaseConversionEvents({ purchase, profile, userId: "user-123", paidAt, env, fetchImpl })
  const retryResult = await sendPurchaseConversionEvents({ purchase, profile, userId: "user-123", paidAt, env, fetchImpl })
  assert.equal(firstResult.every(result => result.sent), true)
  assert.equal(retryResult.every(result => result.sent), true)

  const posthogRequest = requests.find(request => request.payload.event === "purchase_completed")
  const metaRequest = requests.find(request => request.payload.data)
  assert.equal(requests.length, 4)
  assert.equal(posthogRequest.url, "https://eu.i.posthog.com/i/v0/e/")
  assert.equal(posthogRequest.payload.distinct_id, "user-123")
  assert.equal(posthogRequest.payload.timestamp, paidAt)
  assert.equal(posthogRequest.payload.properties.amount, 1399.3)
  assert.equal(posthogRequest.payload.properties.currency, "INR")
  assert.equal(posthogRequest.payload.properties.payment_id, "pay_123")
  assert.equal(posthogRequest.payload.properties.order_id, "order_123")
  assert.equal(requests.filter(request => request.payload.event === "purchase_completed")[0].payload.uuid,
    requests.filter(request => request.payload.event === "purchase_completed")[1].payload.uuid)

  assert.ok(metaRequest.url.startsWith("https://graph.facebook.com/v24.0/pixel_123/events?access_token="))
  assert.equal(metaRequest.payload.data[0].event_name, "Purchase")
  assert.equal(metaRequest.payload.data[0].event_id, "purchase:pay_123")
  assert.equal(metaRequest.payload.data[0].custom_data.value, 1399.3)
  assert.equal(metaRequest.payload.data[0].custom_data.currency, "INR")
  assert.equal(metaRequest.payload.data[0].user_data.fbc, profile.signup_attribution_last_touch.fbc)
  assert.equal(metaRequest.payload.data[0].user_data.fbp, profile.signup_attribution_last_touch.fbp)
  assert.notEqual(metaRequest.payload.data[0].user_data.em[0], profile.email)

  const eventIdentity = getPurchaseEventIdentity({ purchase, userId: "user-123" })
  assert.equal(eventIdentity.metaEventId, "purchase:pay_123")
  assert.equal(eventIdentity.posthogUuid, posthogRequest.payload.uuid)
  assert.ok(paymentProcessor.includes("sendPurchaseConversionEvents("))
  assert.ok(paymentProcessor.indexOf('paidPayment.status !== "captured"') < paymentProcessor.indexOf('rpc("provision_razorpay_payment"'))
  assert.ok(paymentProcessor.indexOf('rpc("provision_razorpay_payment"') < paymentProcessor.indexOf("await runPostProvisionEffects("))
})

test("failed or cancelled payments cannot reach purchase tracking; ROAS query joins first touch to provisioned payments", () => {
  assert.ok(paymentProcessor.includes('paidPayment.status !== "captured"'))
  assert.ok(paymentProcessor.includes('Number(paidPayment.amount) !== Number(purchase.amount_paid_paise)'))
  assert.ok(paymentProcessor.includes('paidPayment.currency !== purchase.currency'))
  assert.ok(reportQuery.includes("join public.razorpay_payment_orders o") && reportQuery.includes("o.user_id = a.user_id"))
  assert.ok(reportQuery.includes("o.status = 'provisioned'"))
  assert.ok(reportQuery.includes("count(distinct a.user_id) as signups"))
  assert.ok(reportQuery.includes("sum(o.amount_paid_paise)"))
})
