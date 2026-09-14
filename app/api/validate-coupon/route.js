import { resolveCoupon } from "@/lib/payments/influencerCoupons"

export async function POST(req) {
  try {
    const { couponCode } = await req.json()
    const result = await resolveCoupon(couponCode)

    if (!result.valid) {
      return Response.json({ valid: false, code: result.code }, { status: 404 })
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
