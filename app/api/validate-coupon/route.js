import { findInfluencerCoupon } from "@/lib/payments/influencerCoupons"
import { normalizeCouponCode, validateCouponCode } from "@/lib/payments/pricing"

export async function POST(req) {
  try {
    const { couponCode } = await req.json()
    const code = normalizeCouponCode(couponCode)
    const staticCoupon = validateCouponCode(code)
    const result = staticCoupon.valid
      ? { code, coupon: staticCoupon.coupon }
      : await findInfluencerCoupon(code)

    if (!result) {
      return Response.json({ valid: false, code }, { status: 404 })
    }

    // This endpoint deliberately exposes no influencer identity, email, or commission data.
    return Response.json({
      valid: true,
      code: result.code,
      discountPercent: result.coupon.discountPercent,
    })
  } catch (error) {
    console.error("COUPON VALIDATION ERROR:", error)
    return Response.json({ valid: false, error: "Unable to validate coupon." }, { status: 500 })
  }
}
