import Razorpay from "razorpay"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendInfluencerConversionEmail } from "@/lib/email/sendInfluencerConversionEmail"
import { sendPaymentReceipt } from "@/lib/email/sendPaymentReceipt"
import { cancelUserEvents } from "@/lib/whatsapp/events"
import { sendPurchaseConversionEvents } from "@/lib/analytics/serverConversionEvents.mjs"

function logPayment(event, order, paymentId, extra = {}) {
  console.info(`[payment] ${event}`, {
    userId: order?.user_id || null,
    purchaseId: order?.id || null,
    orderId: order?.razorpay_order_id || null,
    paymentId: paymentId || null,
    plan: order?.plan || null,
    amountPaise: order?.amount_paid_paise || null,
    couponCode: order?.coupon_code || null,
    ...extra,
  })
}

async function runPostProvisionEffects(order, paymentId, expiresAt) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("name,email,phone,signup_attribution_first_touch,signup_attribution_last_touch")
    .eq("user_id", order.user_id)
    .maybeSingle()
  if (profileError) throw profileError

  const conversionResults = await sendPurchaseConversionEvents({
    purchase: { ...order, razorpay_payment_id: paymentId },
    profile,
    userId: order.user_id,
    paidAt: order.paid_at || new Date().toISOString(),
  })
  for (const result of conversionResults) {
    if (!result.sent) {
      console.warn("[analytics] PURCHASE_CONVERSION_NOT_SENT", {
        purchaseId: order.id,
        provider: result.provider || result.skipped,
        reason: result.error || result.skipped,
      })
    }
  }

  try {
    await sendPaymentReceipt({
      email: profile?.email,
      name: profile?.name,
      plan: order.plan,
      amountPaise: order.amount_paid_paise,
      expiresAt,
      paymentId,
    })
  } catch (receiptError) {
    // Receipt delivery is retried by duplicate callbacks and uses a stable
    // provider idempotency key. It must not undo the paid entitlement.
    console.warn("[payment] RECEIPT_DELIVERY_FAILED", {
      purchaseId: order.id,
      orderId: order.razorpay_order_id,
      paymentId,
      code: receiptError.code || "RECEIPT_FAILED",
    })
  }

  const { data: referralResult, error: referralError } = await supabaseAdmin.rpc("apply_razorpay_referral_commission", {
    p_razorpay_order_id: order.razorpay_order_id,
  })
  if (referralError) throw referralError
  if (referralResult !== true) throw new Error("Referral commission was not reconciled")

  const attribution = order.influencer_attribution
  if (attribution) {
    const { data: insertedAttribution, error: attributionError } = await supabaseAdmin
      .from("influencer_coupon_conversions")
      .upsert({
        coupon_code: attribution.couponCode,
        influencer_name: attribution.influencerName,
        original_price: attribution.originalPaise,
        discount_amount: attribution.discountPaise,
        amount_paid: attribution.amountPaidPaise,
        commission_rate: attribution.commissionRate,
        commission_basis: attribution.commissionBasis,
        commission_amount: attribution.commissionPaise,
        revenue_after_commission: attribution.revenueAfterCommissionPaise,
        payment_id: paymentId,
        order_id: order.razorpay_order_id,
        subscription_id: "",
        user_id: order.user_id,
        currency: "INR",
        payment_status: "captured",
      }, { onConflict: "payment_id", ignoreDuplicates: true })
      .select("id")

    if (attributionError) throw attributionError
    if (insertedAttribution?.length && order.influencer_email) {
      await sendInfluencerConversionEmail({
        email: order.influencer_email,
        influencerName: attribution.influencerName,
        couponCode: attribution.couponCode,
        plan: order.plan,
        attribution,
        paymentId,
        purchasedAt: new Date(order.paid_at || Date.now()),
      })
    }
  }

  await cancelUserEvents(order.user_id, "purchase_completed")

  const { error: completedError } = await supabaseAdmin
    .from("razorpay_payment_orders")
    .update({ side_effects_completed_at: new Date().toISOString(), last_reconciled_at: new Date().toISOString(), last_error_code: null, updated_at: new Date().toISOString() })
    .eq("id", order.id)
  if (completedError) throw completedError
  return expiresAt
}

export async function processSuccessfulPayment({ orderId, paymentId = null, source = "unknown" }) {
  let purchase = null
  try {
    console.info("[payment] PAYMENT_RECEIVED", { orderId, paymentId, source })
    const { data, error: purchaseError } = await supabaseAdmin
      .from("razorpay_payment_orders")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .maybeSingle()
    if (purchaseError || !data) {
      throw Object.assign(new Error(purchaseError?.message || "Registered purchase was not found"), {
        code: purchaseError?.code || "PAYMENT_ORDER_NOT_FOUND",
        stage: "lookup",
      })
    }
    purchase = data
    logPayment("PAYMENT_ORDER_FOUND", purchase, paymentId, { source })

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    const paidOrder = await razorpay.orders.fetch(orderId)
    if (paidOrder.id !== orderId || Number(paidOrder.amount) !== Number(purchase.amount_paid_paise) || paidOrder.currency !== purchase.currency) {
      throw Object.assign(new Error("Razorpay order does not match the registered purchase"), { code: "ORDER_MISMATCH", stage: "order_validation" })
    }
    if (paidOrder.notes?.purchase_id !== purchase.id
      || paidOrder.notes?.internal_user_id !== purchase.user_id
      || paidOrder.notes?.plan !== purchase.plan
      || Number(paidOrder.notes?.amount_paid) !== Number(purchase.amount_paid_paise)) {
      throw Object.assign(new Error("Razorpay order metadata does not match the registered purchase"), { code: "ORDER_METADATA_MISMATCH", stage: "order_validation" })
    }

    if (!paymentId) {
      const { items = [] } = await razorpay.orders.fetchPayments(orderId)
      paymentId = items.find((item) => item.order_id === orderId && item.status === "captured")?.id || null
    }
    if (!paymentId) {
      await supabaseAdmin.from("razorpay_payment_orders")
        .update({ last_reconciled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", purchase.id)
      return { status: "pending", orderId }
    }

    const paidPayment = await razorpay.payments.fetch(paymentId)
    if (paidPayment.id !== paymentId
      || paidPayment.order_id !== orderId
      || paidPayment.status !== "captured"
      || Number(paidPayment.amount) !== Number(purchase.amount_paid_paise)
      || paidPayment.currency !== purchase.currency) {
      throw Object.assign(new Error("Razorpay payment is not a matching captured payment"), { code: "PAYMENT_NOT_CAPTURED_OR_MISMATCHED", stage: "payment_validation" })
    }

    logPayment("PAYMENT_VERIFIED", purchase, paymentId, { source, paymentStatus: paidPayment.status })
    logPayment("ENTITLEMENT_PROVISION_STARTED", purchase, paymentId)
    const paidAt = new Date(Number(paidPayment.created_at || Math.floor(Date.now() / 1000)) * 1000).toISOString()
    const { data: provisioned, error: provisionError } = await supabaseAdmin.rpc("provision_razorpay_payment", {
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId,
      p_amount_paid_paise: Number(paidPayment.amount),
      p_currency: paidPayment.currency,
      p_paid_at: paidAt,
    })
    if (provisionError) throw Object.assign(provisionError, { code: provisionError.code || "PROVISION_RPC_FAILED", stage: "database_provision" })

    logPayment("PAYMENT_RECORDED", purchase, paymentId, { status: provisioned?.status })
    logPayment(provisioned?.status === "reconciled" ? "ENTITLEMENT_RECONCILED" : "ENTITLEMENT_PROVISIONED", purchase, paymentId, {
      expiresAt: provisioned?.expires_at,
      source,
    })

    // Access is committed before non-critical attribution/notification work. A
    // later callback or cron pass safely retries these idempotent effects.
    try {
      await runPostProvisionEffects({ ...purchase, paid_at: paidAt }, paymentId, provisioned?.expires_at)
    } catch (effectError) {
      console.error("[payment] PAYMENT_SIDE_EFFECTS_RETRY_REQUIRED", {
        userId: purchase.user_id,
        purchaseId: purchase.id,
        orderId,
        paymentId,
        code: effectError.code || "SIDE_EFFECT_FAILED",
      })
      await supabaseAdmin.from("razorpay_payment_orders")
        .update({ last_error_code: effectError.code || "SIDE_EFFECT_FAILED", updated_at: new Date().toISOString() })
        .eq("id", purchase.id)
    }

    return { status: provisioned?.status || "provisioned", orderId, paymentId, userId: purchase.user_id, plan: purchase.plan }
  } catch (error) {
    logPayment("PROVISION_FAILED", purchase, paymentId, {
      source,
      stage: error.stage || "processing",
      code: error.code || "PAYMENT_PROCESSING_FAILED",
    })
    if (purchase) {
      await supabaseAdmin.from("razorpay_payment_orders")
        .update({
          reconciliation_attempts: (purchase.reconciliation_attempts || 0) + 1,
          last_error_code: error.code || "PAYMENT_PROCESSING_FAILED",
          last_reconciled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id)
    }
    throw error
  }
}
