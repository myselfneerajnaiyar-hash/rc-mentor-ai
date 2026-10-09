import Razorpay from "razorpay"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getAuthenticatedProfile } from "@/lib/tenant/getCurrentProfile"
import { resolveCoupon } from "@/lib/payments/influencerCoupons"
import { calculateCouponAttribution, calculatePlanPricing } from "@/lib/payments/pricing"

export async function POST(req) {
  let purchaseId = null
  try {
    const identity = await getAuthenticatedProfile(req)
    if (identity.error === "unauthorized") {
      return Response.json({ error: "Please sign in before starting checkout." }, { status: 401 })
    }
    if (identity.error) {
      return Response.json({ error: "Finish setting up your student profile before checkout." }, { status: 409 })
    }

    const body = await req.json()
    if (["quarterly", "bootcamp_full_access"].includes(body.plan)
      && process.env.BOOTCAMP_PLATFORM_BUNDLE_READY !== "true") {
      return Response.json({ error: "This combined offer is temporarily unavailable while its access setup is completed." }, { status: 503 })
    }
    const couponInput = typeof body.couponCode === "string" ? body.couponCode : ""
    if (body.plan === "bootcamp_full_access" && (
      (couponInput.trim() && couponInput.trim().toUpperCase() !== "AUCTOR20")
      || (typeof body.referralCode === "string" && body.referralCode.trim())
    )) {
      return Response.json({ error: "The Bootcamp offer accepts AUCTOR20 only and cannot be combined with a referral discount." }, { status: 400 })
    }
    const coupon = await resolveCoupon(couponInput)
    if (couponInput.trim() && !coupon.valid) {
      return Response.json({ error: "Invalid or expired coupon code." }, { status: 400 })
    }

    let validReferral = false
    let referralCode = null
    if (!coupon.valid && typeof body.referralCode === "string" && body.referralCode.trim()) {
      const normalizedReferral = body.referralCode.trim().toUpperCase()
      const { data: ambassador, error } = await supabaseAdmin
        .from("campus_ambassadors")
        .select("referral_code")
        .eq("referral_code", normalizedReferral)
        .eq("status", "active")
        .maybeSingle()
      if (error) throw error
      validReferral = Boolean(ambassador)
      referralCode = validReferral ? normalizedReferral : null
    }

    const pricing = calculatePlanPricing(body.plan, {
      couponCode: coupon.code,
      coupon: coupon.coupon,
      validReferral,
    })
    const attribution = calculateCouponAttribution({
      originalPaise: pricing.basePaise,
      amountPaidPaise: pricing.finalPaise,
      couponCode: pricing.discountCode,
      coupon: pricing.coupon,
    })

    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("razorpay_payment_orders")
      .insert({
        user_id: identity.user.id,
        plan: pricing.plan,
        entitlement_bundle_version: ["quarterly", "bootcamp_full_access"].includes(pricing.plan) ? 1 : null,
        original_amount_paise: pricing.originalPaise,
        discount_amount_paise: pricing.discountPaise,
        amount_paid_paise: pricing.finalPaise,
        currency: "INR",
        discount_type: pricing.discountType,
        coupon_code: pricing.discountCode,
        referral_code: referralCode,
        influencer_id: coupon.influencerCoupon?.id ? String(coupon.influencerCoupon.id) : null,
        influencer_name: attribution?.influencerName || null,
        influencer_email: coupon.influencerCoupon?.email || null,
        influencer_attribution: attribution,
        status: "creating",
      })
      .select("id")
      .single()

    if (purchaseError || !purchase) throw purchaseError || new Error("Could not register checkout")
    purchaseId = purchase.id

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    const order = await razorpay.orders.create({
      amount: pricing.finalPaise,
      currency: "INR",
      receipt: purchase.id,
      notes: {
        purchase_id: purchase.id,
        internal_user_id: identity.user.id,
        plan: pricing.plan,
        discount_type: pricing.discountType || "none",
        coupon_code: pricing.discountCode || "",
        referral_code: referralCode || "",
        original_price: String(pricing.originalPaise),
        discount_amount: String(pricing.discountPaise),
        amount_paid: String(pricing.finalPaise),
        influencer_name: attribution?.influencerName || "",
        commission_rate: attribution ? String(attribution.commissionRate) : "",
        commission_basis: attribution?.commissionBasis || "",
        commission_amount: attribution ? String(attribution.commissionPaise) : "",
        influencer_id: coupon.influencerCoupon ? String(coupon.influencerCoupon.id) : "",
      },
    })

    const { data: savedOrder, error: orderSaveError } = await supabaseAdmin
      .from("razorpay_payment_orders")
      .update({ razorpay_order_id: order.id, status: "created", updated_at: new Date().toISOString() })
      .eq("id", purchase.id)
      .eq("user_id", identity.user.id)
      .select("id")
      .maybeSingle()

    if (orderSaveError || !savedOrder) {
      console.error("[payment] Order mapping could not be saved", {
        purchaseId: purchase.id,
        orderId: order.id,
        code: orderSaveError?.code || "MISSING_UPDATED_ROW",
      })
      return Response.json({ error: "Checkout could not be safely registered. Contact support before retrying." }, { status: 500 })
    }

    console.info("[payment] PAYMENT_ORDER_CREATED", {
      userId: identity.user.id,
      purchaseId: purchase.id,
      orderId: order.id,
      plan: pricing.plan,
      amountPaise: pricing.finalPaise,
      couponCode: pricing.discountCode || null,
    })

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
  } catch (error) {
    if (purchaseId) {
      await supabaseAdmin.from("razorpay_payment_orders")
        .update({ last_error_code: "ORDER_CREATION_FAILED", updated_at: new Date().toISOString() })
        .eq("id", purchaseId)
        .eq("status", "creating")
    }
    console.error("[payment] ORDER_CREATION_FAILED", {
      purchaseId,
      message: error instanceof Error ? error.message : "Unknown error",
    })
    return Response.json({ error: "Unable to create a secure payment order. Please try again." }, { status: 500 })
  }
}
