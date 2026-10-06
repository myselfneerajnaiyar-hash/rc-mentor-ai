import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getAuthenticatedProfile } from "@/lib/tenant/getCurrentProfile"
import { verifyRazorpayCheckoutSignature } from "@/lib/payments/razorpaySignatures.mjs"
import { processSuccessfulPayment } from "@/lib/payments/processSuccessfulPayment"

export async function POST(req) {
  try {
    const identity = await getAuthenticatedProfile(req)
    if (identity.error) {
      return Response.json({ success: false, error: "Sign in to verify this payment." }, { status: 401 })
    }

    const body = await req.json()
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body || {}
    if (![orderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 0)) {
      return Response.json({ success: false, error: "Payment verification details are incomplete." }, { status: 400 })
    }

    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("razorpay_payment_orders")
      .select("id,user_id,razorpay_order_id,plan,amount_paid_paise,currency")
      .eq("razorpay_order_id", orderId)
      .maybeSingle()

    if (purchaseError) throw purchaseError
    if (!purchase) {
      return Response.json({ success: false, error: "This payment order is not registered to an account." }, { status: 404 })
    }
    if (purchase.user_id !== identity.user.id) {
      return Response.json({ success: false, error: "This payment order belongs to another account." }, { status: 403 })
    }
    if (!verifyRazorpayCheckoutSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
      console.warn("[payment] CALLBACK_SIGNATURE_INVALID", { userId: identity.user.id, orderId, paymentId })
      return Response.json({ success: false, error: "Payment signature could not be verified." }, { status: 400 })
    }

    const result = await processSuccessfulPayment({ orderId, paymentId, source: "checkout_callback" })
    if (result.status === "pending") {
      return Response.json({ success: false, pending: true, error: "Payment capture is still being confirmed." }, { status: 202 })
    }
    return Response.json({
      success: true,
      status: result.status,
      purchase: {
        value: Number(purchase.amount_paid_paise) / 100,
        currency: purchase.currency,
        plan: purchase.plan,
        paymentId: result.paymentId,
        orderId: result.orderId,
      },
    })
  } catch (error) {
    console.error("[payment] CALLBACK_PROCESSING_FAILED", {
      code: error.code || "CALLBACK_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    })
    return Response.json({ success: false, error: "Payment was received but access confirmation is still processing. It will be retried automatically." }, { status: 503 })
  }
}
