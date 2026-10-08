import { resend } from "@/lib/resend"

const PLAN_NAMES = {
  monthly: "Monthly Premium",
  quarterly: "3 Month Premium",
  half_yearly: "6 Month Premium",
  yearly: "Yearly Premium",
  cat_test_series: "CAT VARC Test Series",
  bootcamp_full_access: "CAT VARC Boot Camp 2026",
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function sendPaymentReceipt({ email, name, plan, amountPaise, expiresAt, paymentId }) {
  if (!email) throw new Error("Student receipt email is not configured")
  const displayPlan = PLAN_NAMES[plan]
  if (!displayPlan) throw new Error("Unknown receipt plan")

  const result = await resend.emails.send({
    from: "AuctorRC <hello@auctorlabs.in>",
    to: email,
    subject: "Your AuctorRC Subscription is Active",
    html: `<div style="font-family:Arial,sans-serif;color:#172033"><h1>Payment Successful</h1><p>Hey ${escapeHtml(name || "Champion")}, your AuctorRC subscription is active.</p><p><strong>Plan:</strong> ${displayPlan}<br/><strong>Amount Paid:</strong> ₹${(amountPaise / 100).toFixed(2)}<br/><strong>Access Valid Till:</strong> ${escapeHtml(new Date(expiresAt).toDateString())}</p><p><a href="https://rc.auctorlabs.in">Continue Training</a></p></div>`,
  }, { idempotencyKey: `payment-receipt/${paymentId}` })

  if (result.error) throw new Error(result.error.message)
  return result.data
}
