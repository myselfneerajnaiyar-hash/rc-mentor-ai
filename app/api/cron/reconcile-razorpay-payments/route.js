import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { processSuccessfulPayment } from "@/lib/payments/processSuccessfulPayment"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function authorized(request) {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get("authorization") || ""
  if (!secret || !supplied.startsWith("Bearer ")) return false
  const received = Buffer.from(supplied.slice(7))
  const expected = Buffer.from(secret)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: orders, error } = await supabaseAdmin.rpc("claim_razorpay_reconciliation_batch", { p_limit: 20 })
  if (error) {
    console.error("[payment] RECONCILIATION_BATCH_FAILED", { code: error.code || "BATCH_QUERY_FAILED" })
    return Response.json({ error: "Payment reconciliation could not start." }, { status: 500 })
  }

  let provisioned = 0
  let pending = 0
  let failed = 0
  for (const order of orders || []) {
    try {
      const result = await processSuccessfulPayment({
        orderId: order.razorpay_order_id,
        paymentId: order.razorpay_payment_id || null,
        source: "scheduled_reconciliation",
      })
      if (result.status === "pending") pending += 1
      else provisioned += 1
    } catch {
      failed += 1
    }
  }

  console.info("[payment] RECONCILIATION_BATCH_COMPLETED", {
    scanned: orders?.length || 0,
    provisioned,
    pending,
    failed,
  })
  return Response.json({ scanned: orders?.length || 0, provisioned, pending, failed })
}
