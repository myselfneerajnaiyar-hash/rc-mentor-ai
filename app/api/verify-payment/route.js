import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import Razorpay from "razorpay"
import { findInfluencerCoupon } from "@/lib/payments/influencerCoupons"
import { sendInfluencerConversionEmail } from "@/lib/email/sendInfluencerConversionEmail"
import { calculateCouponAttribution, calculatePlanPricing } from "@/lib/payments/pricing"
import { cancelUserEvents } from "@/lib/whatsapp/events"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {

  const body = await req.json()
  console.log("VERIFY PAYMENT HIT");

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
    plan: requestedPlan
  } = body

  const sign = razorpay_order_id + "|" + razorpay_payment_id

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex")

  if (expected !== razorpay_signature) {
    return Response.json({ success: false })
  }

  // The order created by our server is authoritative for plan, discount and
  // amount. Client-supplied pricing/referral fields are never trusted here.
  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  const paidOrder = await razorpay.orders.fetch(razorpay_order_id)
  const paidPayment = await razorpay.payments.fetch(razorpay_payment_id)
  const plan = paidOrder.notes?.plan
  const couponCode = paidOrder.notes?.discount_type === "coupon"
    ? paidOrder.notes?.coupon_code || null
    : null
  const referralCode = paidOrder.notes?.discount_type === "referral"
    ? paidOrder.notes?.referral_code || null
    : null

  if (!plan || plan !== requestedPlan) {
    return Response.json({ success: false, error: "Payment plan mismatch" }, { status: 400 })
  }

  const influencerCoupon = couponCode ? await findInfluencerCoupon(couponCode) : null
  const pricing = calculatePlanPricing(plan, {
    couponCode,
    coupon: influencerCoupon?.coupon,
  })
  const paymentCompleted = paidOrder.status === "paid"
    && paidPayment.status === "captured"
    && paidPayment.order_id === razorpay_order_id
    && Number(paidPayment.amount) === pricing.finalPaise
    && paidPayment.currency === "INR"

  if (!paymentCompleted) {
    return Response.json({ success: false, error: "Payment is not completed" }, { status: 400 })
  }

  const couponAttribution = calculateCouponAttribution({
    originalPaise: pricing.originalPaise,
    amountPaidPaise: Number(paidPayment.amount),
    couponCode,
    coupon: influencerCoupon?.coupon,
  })

  async function recordInfluencerConversion(subscriptionId) {
    if (!couponAttribution) return null

    const { data: insertedAttribution, error: attributionError } = await supabase
      .from("influencer_coupon_conversions")
      .upsert({
        coupon_code: couponAttribution.couponCode,
        influencer_name: couponAttribution.influencerName,
        original_price: couponAttribution.originalPaise,
        discount_amount: couponAttribution.discountPaise,
        amount_paid: couponAttribution.amountPaidPaise,
        commission_rate: couponAttribution.commissionRate,
        commission_basis: couponAttribution.commissionBasis,
        commission_amount: couponAttribution.commissionPaise,
        revenue_after_commission: couponAttribution.revenueAfterCommissionPaise,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        subscription_id: String(subscriptionId || ""),
        user_id,
        currency: paidPayment.currency,
        payment_status: paidPayment.status,
      }, {
        onConflict: "payment_id",
        ignoreDuplicates: true,
      })
      .select("id")

    if (attributionError) return { error: attributionError, inserted: false }
    return { error: null, inserted: Boolean(insertedAttribution?.length) }
  }

  async function notifyInfluencerIfNew(attributionResult) {
    if (!attributionResult?.inserted || !influencerCoupon) return
    try {
      await sendInfluencerConversionEmail({
        email: influencerCoupon.email,
        influencerName: couponAttribution.influencerName,
        couponCode: couponAttribution.couponCode,
        plan,
        attribution: couponAttribution,
        paymentId: razorpay_payment_id,
        purchasedAt: new Date(),
      })
    } catch (emailError) {
      // Payment fulfillment must not be rolled back by a notification failure.
      console.error("INFLUENCER CONVERSION EMAIL ERROR:", emailError)
    }
  }

  async function cancelTrialMessagesAfterPurchase() {
    try {
      await cancelUserEvents(user_id, "purchase_completed")
    } catch (error) {
      console.error("WHATSAPP PURCHASE CANCELLATION ERROR:", error)
    }
  }

  /* ---------- plan expiry ---------- */

  let expiry = new Date()

  if (plan === "monthly") {
  expiry.setMonth(expiry.getMonth() + 1)
}

if (plan === "quarterly") {
  expiry.setMonth(expiry.getMonth() + 3)
}

if (plan === "half_yearly") {
  expiry.setMonth(expiry.getMonth() + 6)
}

if (plan === "yearly") {
  expiry.setFullYear(expiry.getFullYear() + 1)
}

if (plan === "cat_test_series") {
  expiry.setFullYear(expiry.getFullYear() + 1)
}
  // ---------- get profile ----------

  const {
  data: profile,
  error: profileError,
} = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", user_id)
  .single();


// ---------- prevent duplicate processing ----------

const { data: existingPayment } = await supabase
  .from("subscriptions")
  .select("id")
  .eq("razorpay_payment_id", razorpay_payment_id)
  .maybeSingle();

if (existingPayment) {
  const attributionResult = await recordInfluencerConversion(existingPayment.id)
  if (attributionResult?.error) {
    return Response.json({ success: false, error: attributionResult.error.message }, { status: 500 })
  }
  await notifyInfluencerIfNew(attributionResult)
  await cancelTrialMessagesAfterPurchase()
  if (plan !== "cat_test_series") {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_premium: true, premium_expires_at: expiry })
      .eq("user_id", user_id)

    if (updateError) {
      return Response.json({ success: false, error: updateError.message }, { status: 500 })
    }
  }
  return Response.json({
    success: true,
    message: "Payment already processed",
  });
}

  /* ---------- save subscription ---------- */

  const { data, error } = await supabase
  .from("subscriptions")
  .insert({
    user_id,
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    exam: profile?.exam || "",
    attempt_year: profile?.attempt_year || "",
    plan,
    expires_at: expiry,
    referral_code: referralCode ||
    null,
    razorpay_payment_id,
  })
  .select();


if (error) {
  return Response.json(
    {
      success: false,
      error: error.message,
    },
    { status: 500 }
  );
}

const attributionResult = await recordInfluencerConversion(data?.[0]?.id)
if (attributionResult?.error) {
  return Response.json(
    { success: false, error: attributionResult.error.message },
    { status: 500 }
  )
}

await notifyInfluencerIfNew(attributionResult)
await cancelTrialMessagesAfterPurchase()

// ---------- update ambassador commission ----------

const commissionMap = {
  monthly: 75,
  quarterly: 125,
  half_yearly: 150,
  yearly: 200,
  cat_test_series: 100,
};

if (referralCode) {
  const { data: ambassador } = await supabase
    .from("campus_ambassadors")
    .select("*")
    .eq("referral_code", referralCode)
    .single();

  if (ambassador) {
    await supabase
      .from("campus_ambassadors")
      .update({
        total_referrals: ambassador.total_referrals + 1,
        total_commission:
          ambassador.total_commission +
          commissionMap[plan],
      })
      .eq("id", ambassador.id);
  }
}

  // ---------- update profile ----------

 if (plan !== "cat_test_series") {
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      is_premium: true,
      premium_expires_at: expiry,
    })
    .eq("user_id", user_id);

  console.log("PROFILE UPDATE ERROR:", updateError);
}

   const planNames = {
  monthly: "Monthly Premium",
  quarterly: "3 Month Premium",
  half_yearly: "6 Month Premium",
  yearly: "Yearly Premium",
  cat_test_series: "CAT VARC Test Series",
}

    await fetch("https://rc.auctorlabs.in/api/send-payment-email", {

  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

 body: JSON.stringify({

  email: profile?.email,

  name: profile?.name || "Champion",

  plan: planNames[plan],

  amount: Number(paidOrder.amount) / 100,

  expiry: new Date(expiry).toDateString(),

}),
})

  return Response.json({
    success: true
  })
}
