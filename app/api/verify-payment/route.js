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

  // ---------- get profile ----------

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single()

  /* ---------- save subscription ---------- */

  await supabase.from("subscriptions").insert({
    user_id,
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    exam: profile?.exam || "",
    attempt_year: profile?.attempt_year || "",
    plan,
    expires_at: expiry
  })

  // ---------- update profile ----------

  await supabase
    .from("profiles")
    .update({
      is_premium: true,
      premium_expires_at: expiry
    })
    .eq("user_id", user_id)

    await fetch("https://rc.auctorlabs.in/api/send-payment-email", {

  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({

    email: profile?.email,

    name: profile?.name || "Champion",

    plan:
      plan === "monthly"
        ? "Monthly Premium"
        : "Yearly Premium",

    amount:
      plan === "monthly"
        ? 399
        : 1999,

    expiry: new Date(expiry).toDateString(),

  }),
})

  return Response.json({
    success: true
  })
}