import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { calculatePlanPricing, normalizeCouponCode, PLAN_PRICES, validateCouponCode } from "../lib/payments/pricing.js"

const createOrderSource = await readFile(new URL("../app/api/create-order/route.js", import.meta.url), "utf8")
const verifyPaymentSource = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")

test("normal purchases retain every existing base price", () => {
  assert.deepEqual(Object.fromEntries(Object.keys(PLAN_PRICES).map((plan) => [plan, calculatePlanPricing(plan).finalPaise])), {
    monthly: 39900,
    quarterly: 99900,
    half_yearly: 129900,
    yearly: 199900,
    cat_test_series: 79900,
  })
})

test("AZADI50 is case-insensitive and applies exactly fifty percent", () => {
  for (const code of ["AZADI50", "azadi50", "Azadi50"]) {
    assert.equal(validateCouponCode(code).valid, true)
    const pricing = calculatePlanPricing("cat_test_series", { couponCode: code })
    assert.equal(pricing.originalPaise, 79900)
    assert.equal(pricing.discountPaise, 39950)
    assert.equal(pricing.finalPaise, 39950)
  }
  assert.equal(normalizeCouponCode("  azadi50 "), "AZADI50")
})

test("invalid coupon is rejected and cannot alter normal pricing", () => {
  assert.equal(validateCouponCode("NOTREAL").valid, false)
  assert.equal(calculatePlanPricing("monthly", { couponCode: "NOTREAL" }).finalPaise, 39900)
})

test("existing referral prices remain unchanged", () => {
  assert.equal(calculatePlanPricing("monthly", { validReferral: true }).finalPaise, 31900)
  assert.equal(calculatePlanPricing("quarterly", { validReferral: true }).finalPaise, 79900)
  assert.equal(calculatePlanPricing("half_yearly", { validReferral: true }).finalPaise, 103900)
  assert.equal(calculatePlanPricing("yearly", { validReferral: true }).finalPaise, 159900)
  assert.equal(calculatePlanPricing("cat_test_series", { validReferral: true }).finalPaise, 63900)
})

test("coupon takes precedence over referral without stacking", () => {
  const pricing = calculatePlanPricing("yearly", { couponCode: "AZADI50", validReferral: true })
  assert.equal(pricing.finalPaise, 99950)
  assert.equal(pricing.discountType, "coupon")
})

test("order creation uses server pricing rather than a browser amount", () => {
  assert.match(createOrderSource, /amount: pricing\.finalPaise/)
  assert.doesNotMatch(createOrderSource, /body\.amount/)
  assert.match(createOrderSource, /discount_type: pricing\.discountType/)
})

test("verification uses authoritative Razorpay order metadata and amount", () => {
  assert.match(verifyPaymentSource, /razorpay\.orders\.fetch\(razorpay_order_id\)/)
  assert.match(verifyPaymentSource, /const plan = paidOrder\.notes\?\.plan/)
  assert.match(verifyPaymentSource, /amount: Number\(paidOrder\.amount\) \/ 100/)
  assert.match(verifyPaymentSource, /paidOrder\.notes\?\.discount_type === "referral"/)
})
