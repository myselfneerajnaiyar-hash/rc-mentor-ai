import { resend } from "@/lib/resend"

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function rupees(paise) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100)
}

export async function sendInfluencerConversionEmail({
  email,
  influencerName,
  couponCode,
  plan,
  attribution,
  paymentId,
  purchasedAt,
}) {
  if (!email) throw new Error("Influencer email is not configured")

  const rows = [
    ["Influencer", influencerName],
    ["Coupon", couponCode],
    ["Student purchase / plan", plan],
    ["Original price", rupees(attribution.originalPaise)],
    ["Student discount", `${rupees(attribution.discountPaise)} (${attribution.discountPaise * 100 / attribution.originalPaise}%)`],
    ["Amount paid", rupees(attribution.amountPaidPaise)],
    ["Commission earned", `${rupees(attribution.commissionPaise)} (${attribution.commissionRate}%)`],
    ["Commission basis", "Original price"],
    ["Payment reference", paymentId],
    ["Date / time", purchasedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST"],
  ]

  const result = await resend.emails.send({
    from: "Auctor RC <hello@auctorlabs.in>",
    to: email,
    subject: `New paid conversion for ${couponCode}`,
    html: `<div style="font-family:Arial,sans-serif;color:#172033"><h2>New influencer coupon conversion</h2><p>A student purchase using your coupon has been successfully paid and verified.</p><table style="border-collapse:collapse;width:100%;max-width:640px">${rows.map(([label, value]) => `<tr><td style="padding:8px;border:1px solid #dde3ea;font-weight:600">${escapeHtml(label)}</td><td style="padding:8px;border:1px solid #dde3ea">${escapeHtml(value)}</td></tr>`).join("")}</table></div>`,
  }, {
    idempotencyKey: `influencer-conversion/${paymentId}`,
  })

  if (result.error) throw new Error(result.error.message)
  return result.data
}
