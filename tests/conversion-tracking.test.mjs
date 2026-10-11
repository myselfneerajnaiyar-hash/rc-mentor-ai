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
  getMetaConfigurationError,
  sendMetaSignup,
  sendPurchaseConversionEvents,
} from "../lib/analytics/serverConversionEvents.mjs"
import { dispatchPurchaseConversionEvents } from "../lib/analytics/purchaseConversionDispatch.mjs"
import { dispatchSignupConversion } from "../lib/analytics/signupConversionDispatch.mjs"

const paymentProcessor = await readFile(new URL("../lib/payments/processSuccessfulPayment.js", import.meta.url), "utf8")
const verifyRoute = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")
const checkout = await readFile(new URL("../components/SubscribeButton.jsx", import.meta.url), "utf8")
const paymentSuccessPage = await readFile(new URL("../app/payment-success/page.js", import.meta.url), "utf8")
const paymentSuccessRoute = await readFile(new URL("../app/api/payment-success/route.js", import.meta.url), "utf8")
const signupPage = await readFile(new URL("../app/signup/page.jsx", import.meta.url), "utf8")
const inAppBrowserTest = await readFile(new URL("../tests/preview-ad.browser.mjs", import.meta.url), "utf8")
const welcomePage = await readFile(new URL("../app/welcome/page.jsx", import.meta.url), "utf8")
const loginPage = await readFile(new URL("../app/login/page.jsx", import.meta.url), "utf8")
const reportQuery = await readFile(new URL("../supabase/queries/meta_roas_by_first_touch.sql", import.meta.url), "utf8")
const conversionDispatchMigration = await readFile(new URL("../supabase/migrations/202610110001_purchase_conversion_dispatch.sql", import.meta.url), "utf8")
const signupDispatchMigration = await readFile(new URL("../supabase/migrations/202610110002_signup_conversion_dispatch.sql", import.meta.url), "utf8")
const signupApi = await readFile(new URL("../app/api/conversions/signup/route.js", import.meta.url), "utf8")
const layout = await readFile(new URL("../app/layout.js", import.meta.url), "utf8")

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
  assert.ok(welcomePage.includes('captureSignupConversion({ userId: user.id, method: "google"'))
  assert.ok(layout.includes("process.env.NEXT_PUBLIC_META_PIXEL_ID"))
  assert.doesNotMatch(layout, /1724851152297636/)
  assert.ok(signupApi.includes("auth.admin.getUserById"))
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

test("Meta Pixel Purchase fires on the verified payment summary page and is idempotent per payment", () => {
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
  assert.ok(checkout.includes("if (result.success)") && checkout.includes("/payment-success?"))
  assert.doesNotMatch(checkout, /capturePurchasePixel|fbq\("track",\s*"Purchase"/)
  assert.ok(paymentSuccessPage.includes("capturePurchasePixel") && paymentSuccessPage.includes("/api/payment-success?orderId="))
  assert.ok(paymentSuccessRoute.includes('order.status !== "provisioned"') && paymentSuccessRoute.includes('.eq("user_id", identity.user.id)'))
  assert.match(paymentSuccessRoute, /amountPaid: Number\(order\.amount_paid_paise\) \/ 100/)
  assert.ok(verifyRoute.includes("processSuccessfulPayment"))
})

test("browser Purchase payload includes verified product and order identifiers when supplied", () => {
  const calls = []
  assert.equal(capturePurchasePixel({
    paymentId: "pay_details", value: 799, currency: "INR", contentName: "CAT VARC Boot Camp 2026",
    contentId: "bootcamp_full_access", orderId: "order_details", pixel: (...args) => calls.push(args), storage: memoryStorage(),
  }), true)
  assert.deepEqual(calls[0][2], {
    value: 799, currency: "INR", content_name: "CAT VARC Boot Camp 2026",
    content_ids: ["bootcamp_full_access"], content_type: "product", order_id: "order_details",
  })
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
    NEXT_PUBLIC_META_PIXEL_ID: "123456789012345",
    META_PIXEL_ID: "123456789012345",
    NEXT_PUBLIC_SITE_URL: "https://app.example.test",
  }
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options, payload: JSON.parse(options.body) })
    return { ok: true, status: 200, json: async () => ({ events_received: 1 }) }
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

  assert.ok(metaRequest.url.startsWith("https://graph.facebook.com/v24.0/123456789012345/events?access_token="))
  assert.equal(metaRequest.payload.data[0].event_name, "Purchase")
  assert.equal(metaRequest.payload.data[0].event_id, "purchase:pay_123")
  assert.equal(metaRequest.payload.data[0].custom_data.value, 1399.3)
  assert.equal(metaRequest.payload.data[0].event_time, Math.floor(Date.parse(paidAt) / 1000))
  assert.equal(metaRequest.payload.data[0].event_source_url, "https://app.example.test/payment-success")
  assert.equal(metaRequest.payload.data[0].custom_data.currency, "INR")
  assert.equal(metaRequest.payload.data[0].user_data.fbc, profile.signup_attribution_last_touch.fbc)
  assert.equal(metaRequest.payload.data[0].user_data.fbp, profile.signup_attribution_last_touch.fbp)
  assert.notEqual(metaRequest.payload.data[0].user_data.em[0], profile.email)
  assert.equal(decodeURIComponent(metaRequest.url).includes("meta_test_token"), true)

  const eventIdentity = getPurchaseEventIdentity({ purchase, userId: "user-123" })
  assert.equal(eventIdentity.metaEventId, "purchase:pay_123")
  assert.equal(eventIdentity.posthogUuid, posthogRequest.payload.uuid)
  assert.ok(paymentProcessor.includes("dispatchPurchaseConversionEvents("))
  assert.match(conversionDispatchMigration, /primary key \(payment_id, provider\)/)
  assert.match(conversionDispatchMigration, /status in \('pending', 'failed'\)/)
  assert.match(conversionDispatchMigration, /for update of p skip locked/)
  const provisionIndex = paymentProcessor.indexOf("await supabaseAdmin.rpc(provisionRpc")
  assert.ok(paymentProcessor.indexOf('paidPayment.status !== "captured"') < provisionIndex)
  assert.ok(provisionIndex < paymentProcessor.indexOf("await runPostProvisionEffects("))
})

test("Meta config is actionable and purchase CAPI treats rejected delivery as retryable and ambiguous delivery as unknown", async () => {
  const missing = getMetaConfigurationError({})
  assert.deepEqual(missing.missing, ["NEXT_PUBLIC_META_PIXEL_ID (numeric Meta Pixel ID)", "META_CONVERSIONS_API_ACCESS_TOKEN", "META_GRAPH_API_VERSION", "NEXT_PUBLIC_SITE_URL"])
  assert.equal(getMetaConfigurationError({
    NEXT_PUBLIC_META_PIXEL_ID: "123", META_PIXEL_ID: "456", META_CONVERSIONS_API_ACCESS_TOKEN: "secret",
    META_GRAPH_API_VERSION: "v24.0", NEXT_PUBLIC_SITE_URL: "https://app.example.test",
  }).code, "meta_pixel_id_mismatch")

  const purchase = { razorpay_payment_id: "pay_fail", amount_paid_paise: 79900, currency: "INR", plan: "quarterly" }
  const env = { NEXT_PUBLIC_META_PIXEL_ID: "123456789012345", META_PIXEL_ID: "123456789012345", META_CONVERSIONS_API_ACCESS_TOKEN: "secret", META_GRAPH_API_VERSION: "v24.0", NEXT_PUBLIC_SITE_URL: "https://app.example.test" }
  const rejected = await sendPurchaseConversionEvents({
    purchase, userId: "user", paidAt: "2026-10-01T12:00:00Z", env,
    fetchImpl: async () => ({ ok: false, status: 429 }),
  })
  assert.equal(rejected.find(result => result.provider === "meta").retryable, true)
  const unknown = await sendPurchaseConversionEvents({
    purchase, userId: "user", paidAt: "2026-10-01T12:00:00Z", env,
    fetchImpl: async () => ({ ok: false, status: 500 }),
  })
  assert.equal(unknown.find(result => result.provider === "meta").deliveryUnknown, true)
  assert.equal(JSON.stringify(unknown).includes("secret"), false)
})

test("signup CAPI uses the browser CompleteRegistration event ID and retries only explicit failures", async () => {
  const env = { NEXT_PUBLIC_META_PIXEL_ID: "123456789012345", META_PIXEL_ID: "123456789012345", META_CONVERSIONS_API_ACCESS_TOKEN: "secret", META_GRAPH_API_VERSION: "v24.0", NEXT_PUBLIC_SITE_URL: "https://app.example.test" }
  const authUser = {
    id: "11111111-1111-4111-8111-111111111111",
    created_at: "2026-10-11T10:00:00.000Z",
    email: "student@example.test",
    user_metadata: { signup_attribution: { firstTouch: { fbc: "fb.1.1720000000000.click_1" }, lastTouch: { fbp: "fb.1.1720000000000.123" } } },
  }
  const eventCalls = []
  const sendEvent = async args => {
    if (args.validateOnly) return { sent: false }
    eventCalls.push(args)
    if (eventCalls.length === 1) return { sent: false, provider: "meta", retryable: true, error: "Meta Conversions API returned HTTP 429" }
    return sendMetaSignup({ ...args, env, fetchImpl: async (url, options) => {
      const event = JSON.parse(options.body).data[0]
      assert.ok(String(url).startsWith("https://graph.facebook.com/v24.0/123456789012345/events?"))
      assert.equal(event.event_name, "CompleteRegistration")
      assert.equal(event.event_id, `signup:${authUser.id}`)
      assert.equal(event.event_time, Math.floor(Date.parse(authUser.created_at) / 1000))
      assert.equal(event.event_source_url, "https://app.example.test/signup")
      assert.ok(event.user_data.em[0])
      assert.equal(event.user_data.fbc, "fb.1.1720000000000.click_1")
      assert.equal(event.user_data.fbp, "fb.1.1720000000000.123")
      return { ok: true, status: 200, json: async () => ({ events_received: 1 }) }
    } })
  }
  const rows = new Map()
  const db = { async rpc(name, args) {
    const current = rows.get(args.p_user_id) || { status: "pending", attempts: 0 }
    if (name === "claim_signup_conversion_dispatch") {
      if (!["pending", "failed"].includes(current.status)) return { data: false, error: null }
      rows.set(args.p_user_id, { status: "processing", token: args.p_claim_token, attempts: current.attempts + 1 })
      return { data: true, error: null }
    }
    if (current.status !== "processing" || current.token !== args.p_claim_token) return { data: false, error: null }
    const nextStatus = name === "complete_signup_conversion_dispatch" ? "sent"
      : name === "fail_signup_conversion_dispatch" ? "failed" : "unknown"
    rows.set(args.p_user_id, { ...current, status: nextStatus, token: null })
    return { data: true, error: null }
  } }
  const options = { userId: authUser.id, method: "email", authUser, profile: {}, db, env, sendEvent, createClaimToken: (() => { let n = 0; return () => `token-${++n}` })() }
  assert.equal((await dispatchSignupConversion(options)).retryable, true)
  assert.equal(rows.get(authUser.id).status, "failed")
  assert.equal((await dispatchSignupConversion(options)).sent, true)
  assert.equal(rows.get(authUser.id).status, "sent")
  assert.equal((await dispatchSignupConversion(options)).skipped, "already_sent_or_in_progress")
  assert.equal(eventCalls.length, 2)
  assert.match(signupDispatchMigration, /status in \('pending', 'failed'\)/)
  assert.match(signupDispatchMigration, /u.created_at >= now\(\) - interval '24 hours'/)
  assert.ok(signupApi.includes("dispatchSignupConversion"))
})

function conversionOutboxDb() {
  const rows = new Map()
  return {
    rows,
    async rpc(name, args) {
      const key = `${args.p_payment_id}:${args.p_provider}`
      const row = rows.get(key) || { status: "pending", attempts: 0 }
      if (name === "claim_purchase_conversion_dispatch") {
        if (!new Set(["pending", "failed"]).has(row.status)) return { data: false, error: null }
        rows.set(key, { ...row, status: "processing", token: args.p_claim_token, attempts: row.attempts + 1 })
        return { data: true, error: null }
      }
      if (row.status !== "processing" || row.token !== args.p_claim_token) return { data: false, error: null }
      if (name === "complete_purchase_conversion_dispatch") rows.set(key, { ...row, status: "sent", token: null })
      if (name === "fail_purchase_conversion_dispatch") rows.set(key, { ...row, status: "failed", token: null, error: args.p_error })
      if (name === "mark_purchase_conversion_dispatch_unknown") rows.set(key, { ...row, status: "unknown", token: null, error: args.p_error })
      return { data: true, error: null }
    },
  }
}

test("purchase conversion dispatch claims once across concurrent repeats and retries only failed delivery", async () => {
  const purchase = { razorpay_payment_id: "dispatch_pay", razorpay_order_id: "dispatch_order", amount_paid_paise: 79900, currency: "INR", plan: "quarterly" }
  const db = conversionOutboxDb()
  const calls = { posthog: 0, meta: 0 }
  let failPosthogOnce = true
  const sendEvent = async ({ provider }) => {
    calls[provider]++
    await Promise.resolve()
    if (provider === "posthog" && failPosthogOnce) {
      failPosthogOnce = false
      return { sent: false, provider, error: "temporary provider rejection", retryable: true }
    }
    return { sent: true, provider }
  }
  const options = { purchase, userId: "dispatch_user", paidAt: "2026-10-01T12:00:00Z", db, sendEvent }

  await Promise.all([
    dispatchPurchaseConversionEvents(options),
    dispatchPurchaseConversionEvents(options),
  ])
  assert.equal(calls.posthog, 1)
  assert.equal(calls.meta, 1)
  assert.equal(db.rows.get("dispatch_pay:posthog").status, "failed")
  assert.equal(db.rows.get("dispatch_pay:meta").status, "sent")

  await dispatchPurchaseConversionEvents(options)
  await dispatchPurchaseConversionEvents(options)
  assert.equal(calls.posthog, 2, "explicitly failed PostHog delivery is retried once and then marked sent")
  assert.equal(calls.meta, 1, "a successful Meta delivery is never sent again")
  assert.equal(db.rows.get("dispatch_pay:posthog").status, "sent")
  assert.equal(db.rows.get("dispatch_pay:posthog").attempts, 2)
  assert.equal(db.rows.get("dispatch_pay:meta").attempts, 1)
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
