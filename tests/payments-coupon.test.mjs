import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { calculateCouponAttribution, calculatePlanPricing, normalizeCouponCode, PLAN_PRICES, validateCouponCode } from "../lib/payments/pricing.js"

const createOrderSource = await readFile(new URL("../app/api/create-order/route.js", import.meta.url), "utf8")
const verifyPaymentSource = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")
const webhookSource = await readFile(new URL("../app/api/razorpay/webhook/route.js", import.meta.url), "utf8")
const reconciliationSource = await readFile(new URL("../app/api/cron/reconcile-razorpay-payments/route.js", import.meta.url), "utf8")
const subscribeSource = await readFile(new URL("../components/SubscribeButton.jsx", import.meta.url), "utf8")

test("normal purchases retain every existing base price", () => {
  assert.deepEqual(Object.fromEntries(Object.keys(PLAN_PRICES).map((plan) => [plan, calculatePlanPricing(plan).finalPaise])), {
    monthly: 39900, quarterly: 99900, half_yearly: 129900, yearly: 199900, cat_test_series: 79900,
  })
})

test("built-in coupon pricing remains authoritative and referral does not stack", () => {
  assert.equal(validateCouponCode("AZADI50").valid, true)
  assert.equal(calculatePlanPricing("yearly", { couponCode: "AUCTOR30" }).finalPaise, 139930)
  assert.equal(calculatePlanPricing("yearly", { couponCode: "AZADI50", validReferral: true }).finalPaise, 99950)
  assert.equal(validateCouponCode("NOTREAL").valid, false)
  assert.equal(normalizeCouponCode("  auctor30 "), "AUCTOR30")
})

test("AUCTOR20 influencer coupon retains its discount and commission on every plan", () => {
  const coupon = {
    active: true,
    discountPercent: 20,
    influencer: { name: "Auctor Campaign", commissionPercent: 20, commissionBasis: "ORIGINAL_PRICE" },
  }
  for (const plan of Object.keys(PLAN_PRICES)) {
    const price = calculatePlanPricing(plan, { couponCode: "AUCTOR20", coupon })
    assert.equal(price.finalPaise, Math.round(PLAN_PRICES[plan].basePaise * 0.8))
    const attribution = calculateCouponAttribution({
      originalPaise: price.originalPaise,
      amountPaidPaise: price.finalPaise,
      couponCode: "AUCTOR20",
      coupon,
    })
    assert.equal(attribution.couponCode, "AUCTOR20")
    assert.equal(attribution.commissionPaise, Math.round(PLAN_PRICES[plan].basePaise * 0.2))
  }
})

test("checkout trusts authenticated server profile and records server-calculated order amounts", () => {
  assert.match(createOrderSource, /getAuthenticatedProfile\(req\)/)
  assert.match(createOrderSource, /\.from\("razorpay_payment_orders"\)/)
  assert.match(createOrderSource, /amount_paid_paise: pricing\.finalPaise/)
  assert.match(createOrderSource, /amount: pricing\.finalPaise/)
  assert.match(createOrderSource, /purchase_id: purchase\.id/)
  assert.doesNotMatch(createOrderSource, /body\.amount/)
  assert.doesNotMatch(createOrderSource, /body\.user_id/)
})

test("verification binds callback to authenticated purchaser and server-stored order", () => {
  assert.match(verifyPaymentSource, /getAuthenticatedProfile\(req\)/)
  assert.match(verifyPaymentSource, /purchase\.user_id !== identity\.user\.id/)
  assert.match(verifyPaymentSource, /verifyRazorpayCheckoutSignature\(orderId, paymentId/)
  assert.match(verifyPaymentSource, /processSuccessfulPayment\(\{ orderId, paymentId/)
  assert.doesNotMatch(verifyPaymentSource, /body\.user_id|body\.plan|body\.couponCode/)
  assert.match(subscribeSource, /Authorization: `Bearer \$\{verificationSession\.access_token\}`/)
  assert.doesNotMatch(subscribeSource, /user_id:\s*user\.id/)
})

test("callback and signed webhook share the canonical processor; cron retries missed callbacks", () => {
  assert.match(verifyPaymentSource, /processSuccessfulPayment\(\{ orderId, paymentId, source: "checkout_callback" \}\)/)
  assert.match(webhookSource, /verifyRazorpayWebhookSignature\(rawBody, signature/)
  assert.match(webhookSource, /processSuccessfulPayment\(\{ orderId, paymentId, source: "razorpay_webhook" \}\)/)
  assert.match(webhookSource, /status: 503/)
  assert.match(reconciliationSource, /claim_razorpay_reconciliation_batch/)
  assert.match(reconciliationSource, /source: "scheduled_reconciliation"/)
})

test("pricing page continues to accept a validated coupon prefill", async () => {
  const source = await readFile(new URL("../app/pricing/page.jsx", import.meta.url), "utf8")
  assert.match(source, /searchParams\.get\("coupon"\)/)
  assert.match(source, /applyCoupon\(couponFromUrl\)/)
  assert.match(source, /couponCode=\{appliedCoupon\}/)
})
