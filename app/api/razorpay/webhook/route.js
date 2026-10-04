import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpaySignatures.mjs"
import { processSuccessfulPayment } from "@/lib/payments/processSuccessfulPayment"

export const dynamic = "force-dynamic"

export async function POST(req) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-razorpay-signature") || ""
  if (!verifyRazorpayWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
    console.warn("[payment] WEBHOOK_SIGNATURE_INVALID")
    return Response.json({ received: false, error: "Invalid webhook signature." }, { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody)
    if (event.event !== "payment.captured" && event.event !== "order.paid") {
      return Response.json({ received: true, ignored: true })
    }

    const payment = event.payload?.payment?.entity
    const order = event.payload?.order?.entity
    const orderId = payment?.order_id || order?.id
    const paymentId = payment?.id || null
    if (!orderId) {
      console.error("[payment] WEBHOOK_ORDER_ID_MISSING", { event: event.event })
      return Response.json({ received: false, error: "Payment order ID is missing." }, { status: 400 })
    }

    const result = await processSuccessfulPayment({ orderId, paymentId, source: "razorpay_webhook" })
    return Response.json({ received: true, status: result.status })
  } catch (error) {
    console.error("[payment] WEBHOOK_PROCESSING_FAILED", {
      code: error.code || "WEBHOOK_FAILED",
      message: error instanceof Error ? error.message : "Unknown error",
    })
    // A non-2xx response asks Razorpay to retry transient provisioning failures.
    return Response.json({ received: false, error: "Payment processing will be retried." }, { status: 503 })
  }
}
