import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getAuthenticatedProfile } from "@/lib/tenant/getCurrentProfile"

const PRODUCTS = {
  monthly: { name: "Auctor Monthly", features: ["Daily RC workouts", "Birbal AI mentor", "Performance analytics and leaderboards"] },
  quarterly: { name: "Auctor Quarterly", features: ["Daily RC workouts", "Birbal AI mentor", "Performance analytics and leaderboards"] },
  half_yearly: { name: "Auctor Half-Yearly", features: ["Daily RC workouts", "Birbal AI mentor", "Performance analytics and leaderboards"] },
  yearly: { name: "Auctor Annual", features: ["Daily RC workouts", "Birbal AI mentor", "Performance analytics and leaderboards"] },
  cat_test_series: { name: "CAT VARC Test Series", features: ["Full CAT VARC Test Series access"] },
  bootcamp_full_access: { name: "CAT VARC Boot Camp 2026", features: ["All 50 guided Bootcamp days", "Birbal Bootcamp review and progress analytics"] },
}

export const dynamic = "force-dynamic"

export async function GET(request) {
  const headers = { "Cache-Control": "private, no-store" }
  try {
    const identity = await getAuthenticatedProfile(request)
    if (identity.error) return Response.json({ error: "Sign in to view this payment." }, { status: 401, headers })

    const orderId = new URL(request.url).searchParams.get("orderId")
    if (!orderId || orderId.length > 100) return Response.json({ error: "A verified payment order is required." }, { status: 400, headers })

    const { data: order, error } = await supabaseAdmin.from("razorpay_payment_orders")
      .select("user_id,razorpay_order_id,razorpay_payment_id,plan,amount_paid_paise,currency,paid_at,entitlement_expires_at,status")
      .eq("razorpay_order_id", orderId).eq("user_id", identity.user.id).maybeSingle()
    if (error) throw error
    if (!order) return Response.json({ error: "This verified payment could not be found for your account." }, { status: 404, headers })
    if (order.status !== "provisioned" || !order.razorpay_payment_id || !order.entitlement_expires_at) {
      return Response.json({ error: "Payment confirmation is still processing." }, { status: 409, headers })
    }

    const product = PRODUCTS[order.plan]
    if (!product) return Response.json({ error: "The purchased product could not be identified." }, { status: 409, headers })
    return Response.json({
      product: { id: order.plan, ...product },
      amountPaid: Number(order.amount_paid_paise) / 100,
      currency: order.currency,
      orderId: order.razorpay_order_id,
      paymentId: order.razorpay_payment_id,
      paidAt: order.paid_at,
      validUntil: order.entitlement_expires_at,
    }, { headers })
  } catch (error) {
    console.error("[payment-success] ORDER_SUMMARY_FAILED", { code: error?.code || "ORDER_SUMMARY_FAILED" })
    return Response.json({ error: "Unable to confirm this payment right now." }, { status: 503, headers })
  }
}
