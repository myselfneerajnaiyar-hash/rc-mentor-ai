import Razorpay from "razorpay"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { findInfluencerCoupon } from "@/lib/payments/influencerCoupons"
import { calculateCouponAttribution, calculatePlanPricing, validateCouponCode } from "@/lib/payments/pricing"

export async function POST(req) {

  try {

    const body = await req.json()

    const couponCode = body.couponCode || ""
    const staticCoupon = validateCouponCode(couponCode)
    const influencerCoupon = staticCoupon.valid ? null : await findInfluencerCoupon(couponCode)
    const coupon = staticCoupon.valid
      ? staticCoupon
      : influencerCoupon
        ? { valid: true, code: influencerCoupon.code, coupon: influencerCoupon.coupon }
        : { valid: false, code: couponCode, coupon: null }
    if (couponCode.trim() && !coupon.valid) {
      return Response.json({ error: "Invalid or expired coupon code." }, { status: 400 })
    }

    let validReferral = false
    let activeReferralCode = null
    if (!coupon.valid && body.referralCode) {
      const normalizedReferral = String(body.referralCode).trim().toUpperCase()
      const { data: ambassador } = await supabaseAdmin
        .from("campus_ambassadors")
        .select("referral_code")
        .eq("referral_code", normalizedReferral)
        .eq("status", "active")
        .maybeSingle()
      validReferral = Boolean(ambassador)
      activeReferralCode = validReferral ? normalizedReferral : null
    }

    const pricing = calculatePlanPricing(body.plan, {
      couponCode: coupon.code,
      coupon: coupon.coupon,
      validReferral,
    })
    const attribution = calculateCouponAttribution({
      originalPaise: pricing.originalPaise,
      amountPaidPaise: pricing.finalPaise,
      couponCode: pricing.discountCode,
      coupon: pricing.coupon,
    })

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      amount: pricing.finalPaise,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      notes: {
        plan: body.plan,
        discount_type: pricing.discountType || "none",
        coupon_code: pricing.discountCode || "",
        referral_code: activeReferralCode || "",
        original_price: String(pricing.originalPaise),
        discount_amount: String(pricing.discountPaise),
        influencer_name: attribution?.influencerName || "",
        commission_rate: attribution ? String(attribution.commissionRate) : "",
        commission_basis: attribution?.commissionBasis || "",
        commission_amount: attribution ? String(attribution.commissionPaise) : "",
        influencer_id: influencerCoupon ? String(influencerCoupon.id) : "",
      },
    }

    const order = await razorpay.orders.create(options)

    return Response.json({
      ...order,
      pricing: {
        originalPaise: pricing.originalPaise,
        discountPaise: pricing.discountPaise,
        finalPaise: pricing.finalPaise,
        discountType: pricing.discountType,
        discountCode: pricing.discountCode,
      },
    })

  } catch (err) {

    console.error("RAZORPAY ORDER ERROR:", err)

    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    )
  }
}
