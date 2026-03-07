import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {

  const body = await req.json()

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
    plan
  } = body

  const sign = razorpay_order_id + "|" + razorpay_payment_id

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex")

  if (expected !== razorpay_signature) {
    return Response.json({ success: false })
  }

  /* ---------- plan expiry ---------- */

  let expiry = new Date()

  if (plan === "monthly") {
    expiry.setMonth(expiry.getMonth() + 1)
  }

  if (plan === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1)
  }

  /* ---------- save subscription ---------- */

  await supabase.from("subscriptions").insert({
    user_id,
    plan,
    expires_at: expiry
  })

  return Response.json({
    success: true
  })
}