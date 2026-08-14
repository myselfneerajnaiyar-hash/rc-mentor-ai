import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import Razorpay from "razorpay"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {

  const body = await req.json()
  console.log("VERIFY PAYMENT HIT");
console.log(body);

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
  const plan = paidOrder.notes?.plan
  const referralCode = paidOrder.notes?.discount_type === "referral"
    ? paidOrder.notes?.referral_code || null
    : null

  if (!plan || plan !== requestedPlan) {
    return Response.json({ success: false, error: "Payment plan mismatch" }, { status: 400 })
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

console.log("PROFILE:", profile);
console.log("PROFILE ERROR:", profileError);

// ---------- prevent duplicate processing ----------

const { data: existingPayment } = await supabase
  .from("subscriptions")
  .select("id")
  .eq("razorpay_payment_id", razorpay_payment_id)
  .maybeSingle();

if (existingPayment) {
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

console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", error);

if (error) {
  return Response.json(
    {
      success: false,
      error: error.message,
    },
    { status: 500 }
  );
}

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
