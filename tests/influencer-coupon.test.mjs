import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  calculateCouponAttribution,
  calculatePlanPricing,
  validateCouponCode,
} from "../lib/payments/pricing.js"

const dynamicCoupon = {
  active: true,
  discountPercent: 20,
  influencer: {
    name: "Bhoomi Gupta",
    commissionPercent: 20,
    commissionBasis: "ORIGINAL_PRICE",
  },
}

test("dynamic influencer coupon discounts 100 rupees to 80 and commissions 20 from original", () => {
  const result = calculateCouponAttribution({
    originalPaise: 10_000,
    amountPaidPaise: 8_000,
    couponCode: "BHOOMIGUPTA20",
    coupon: dynamicCoupon,
  })
  assert.equal(result.discountPaise, 2_000)
  assert.equal(result.amountPaidPaise, 8_000)
  assert.equal(result.commissionPaise, 2_000)
  assert.equal(result.revenueAfterCommissionPaise, 6_000)
})

test("dynamic influencer coupon discounts 1000 rupees to 800 and commissions 200 from original", () => {
  const result = calculateCouponAttribution({
    originalPaise: 100_000,
    amountPaidPaise: 80_000,
    couponCode: "BHOOMIGUPTA20",
    coupon: dynamicCoupon,
  })
  assert.equal(result.discountPaise, 20_000)
  assert.equal(result.amountPaidPaise, 80_000)
  assert.equal(result.commissionPaise, 20_000)
})

test("AZADI50 remains a 50 percent coupon", () => {
  const coupon = validateCouponCode("AZADI50")
  assert.equal(coupon.valid, true)
  assert.equal(coupon.coupon.discountPercent, 50)

  const configured = calculatePlanPricing("quarterly", { couponCode: "AZADI50" })
  assert.equal(configured.originalPaise, 99_900)
  assert.equal(configured.finalPaise, 49_950)
  assert.equal(configured.discountPaise, 49_950)
  assert.equal(calculateCouponAttribution({ originalPaise: 100_000, amountPaidPaise: 50_000, couponCode: "AZADI50" }), null)
})

test("dynamic coupon plan pricing uses the shared coupon calculation", () => {
  const configured = calculatePlanPricing("quarterly", {
    couponCode: "BHOOMIGUPTA20",
    coupon: dynamicCoupon,
  })
  assert.equal(configured.originalPaise, 99_900)
  assert.equal(configured.finalPaise, 79_920)
  assert.equal(configured.discountPaise, 19_980)
})

test("successful conversion persistence and email are idempotent by payment", async () => {
  const verificationRoute = await readFile(
    new URL("../app/api/verify-payment/route.js", import.meta.url),
    "utf8"
  )

  assert.match(verificationRoute, /onConflict: "payment_id"/)
  assert.match(verificationRoute, /ignoreDuplicates: true/)
  assert.match(verificationRoute, /attributionResult\?\.inserted/)

  const emailHelper = await readFile(
    new URL("../lib/email/sendInfluencerConversionEmail.js", import.meta.url),
    "utf8"
  )
  assert.match(emailHelper, /idempotencyKey: `influencer-conversion\/\$\{paymentId\}`/)
})
