export const PLAN_PRICES = Object.freeze({
  monthly: { basePaise: 39900, referralPaise: 31900 },
  quarterly: { basePaise: 99900, referralPaise: 79900 },
  half_yearly: { basePaise: 129900, referralPaise: 103900 },
  yearly: { basePaise: 199900, referralPaise: 159900 },
  cat_test_series: { basePaise: 79900, referralPaise: 63900 },
})

export const COUPONS = Object.freeze({
  AZADI50: Object.freeze({ discountPercent: 50, active: true }),
})

export function normalizeCouponCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

export function validateCouponCode(value) {
  const code = normalizeCouponCode(value)
  const coupon = COUPONS[code]
  return coupon?.active ? { valid: true, code, coupon } : { valid: false, code, coupon: null }
}

export function calculatePlanPricing(plan, { couponCode = "", validReferral = false } = {}) {
  const configured = PLAN_PRICES[plan]
  if (!configured) throw new Error("Unsupported payment plan")

  const couponResult = validateCouponCode(couponCode)
  let finalPaise = configured.basePaise
  let discountType = null
  let discountCode = null

  if (couponResult.valid) {
    finalPaise = Math.round(configured.basePaise * (100 - couponResult.coupon.discountPercent) / 100)
    discountType = "coupon"
    discountCode = couponResult.code
  } else if (validReferral) {
    // Preserve the existing referral prices exactly; do not recompute them.
    finalPaise = configured.referralPaise
    discountType = "referral"
  }

  return {
    plan,
    originalPaise: configured.basePaise,
    discountPaise: configured.basePaise - finalPaise,
    finalPaise,
    discountType,
    discountCode,
  }
}
