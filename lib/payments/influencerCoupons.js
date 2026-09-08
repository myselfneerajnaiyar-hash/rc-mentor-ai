import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { normalizeCouponCode } from "@/lib/payments/pricing"

function firstDefined(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key]
  }
  return undefined
}

function percentage(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null
}

function isActive(record) {
  if (record.status != null) return String(record.status).toLowerCase() === "active"
  if (record.is_active != null) return record.is_active === true
  if (record.active != null) return record.active === true
  return true
}

export async function findInfluencerCoupon(value) {
  const code = normalizeCouponCode(value)
  if (!code) return null

  const { data, error } = await supabaseAdmin
    .from("instagram_influencers")
    .select("*")
    .eq("coupon_code", code)
    .maybeSingle()

  if (error) throw new Error(`Unable to validate influencer coupon: ${error.message}`)
  if (!data || !isActive(data)) return null

  const discountPercent = percentage(firstDefined(data, [
    "student_discount", "student_discount_rate", "student_discount_percent",
    "student_discount_percentage", "discount_rate", "discount_percentage",
  ]))
  const commissionPercent = percentage(data.commission_rate)
  const commissionBasis = String(data.commission_basis || "original_price").toUpperCase()

  if (discountPercent === null || commissionPercent === null || commissionBasis !== "ORIGINAL_PRICE") {
    console.error("Invalid Instagram influencer coupon configuration", { id: data.id, code })
    return null
  }

  return {
    id: data.id,
    code,
    email: data.email,
    coupon: {
      active: true,
      discountPercent,
      influencer: {
        name: data.influencer_name || data.name,
        commissionPercent,
        commissionBasis,
      },
    },
  }
}
