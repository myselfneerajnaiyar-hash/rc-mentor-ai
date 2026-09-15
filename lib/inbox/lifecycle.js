import { COUPONS } from "../payments/pricing.js"
import { DAY_MS, readAll } from "./activity.js"

// Read existing state only. Inbox never updates trials, subscriptions or payments.
export async function loadInboxSubscriptions(db, userIds, { signal } = {}) {
  return readAll(() => db.from("subscriptions").select("id,user_id,plan,created_at,expires_at").in("user_id", userIds).order("id", { ascending: true }), 500, { signal })
}

export function inboxAccountContext(profile, subscriptions, now) {
  const time = new Date(now).getTime()
  const own = subscriptions.filter((row) => row.user_id === profile.user_id)
  const active = own.some((row) => Number.isFinite(Date.parse(row.expires_at)) && Date.parse(row.expires_at) > time)
  const premium = profile.is_premium && (!profile.premium_expires_at || Date.parse(profile.premium_expires_at) > time)
  const exempt = Boolean(profile.institute_id || active || premium)
  return { time, own, exempt, trialExpiry: Date.parse(profile.trial_expires_at) }
}

export function chooseInboxLifecycle({ profile, subscriptions = [], now }) {
  const { time, own, exempt, trialExpiry } = inboxAccountContext(profile, subscriptions, now)
  const make = (type, key, title, body, actionUrl = "/pricing") => ({ userId: profile.user_id, type, source: "Auctor", title, body, preview: body, actionUrl, priority: 5, idempotencyKey: key, ruleKey: key, metadata: { actionLabel: "View account options" } })
  // State acknowledgements, not payment receipts: payment processing stays untouched.
  const newest = own.filter((row) => Date.parse(row.created_at) <= time && Date.parse(row.created_at) > time - DAY_MS && Date.parse(row.expires_at) > time).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
  if (newest) return make("ACCOUNT", "subscription-active:" + newest.id, "Your subscription is active", "Your " + newest.plan + " subscription is active through " + new Date(newest.expires_at).toISOString().slice(0, 10) + ".", "/")
  const latest = own.filter((row) => Number.isFinite(Date.parse(row.expires_at))).sort((a, b) => Date.parse(b.expires_at) - Date.parse(a.expires_at))[0]
  if (!profile.institute_id && latest) {
    const remaining = Date.parse(latest.expires_at) - time
    if (remaining > 0 && remaining <= DAY_MS) return make("ACCOUNT", "subscription-ending:" + latest.id + ":" + latest.expires_at, "Your subscription ends soon", "Your " + latest.plan + " subscription ends on " + new Date(latest.expires_at).toISOString().slice(0, 10) + ".")
    if (!exempt && remaining <= 0 && remaining > -DAY_MS) return make("ACCOUNT", "subscription-ended:" + latest.id + ":" + latest.expires_at, "Your subscription has ended", "Your " + latest.plan + " subscription period has ended. Review your account options when you are ready.")
  }
  if (exempt || !Number.isFinite(trialExpiry)) return null
  const expiry = new Date(trialExpiry).toISOString()
  if (trialExpiry > time && trialExpiry - time <= DAY_MS) return make("TRIAL", "trial-ending:" + expiry, "Your trial ends soon", "Your trial ends on " + expiry.slice(0, 10) + ". Review the available plans if you want to continue after it ends.")
  if (trialExpiry <= time && time - trialExpiry < DAY_MS) return make("TRIAL", "trial-ended:" + expiry, "Your trial has ended", "Your trial access has ended. You can review the available plans whenever you are ready.")
  if (trialExpiry > time && Date.parse(profile.created_at) <= time && Date.parse(profile.created_at) > time - DAY_MS) return make("TRIAL", "trial-active:" + expiry, "Your trial is active", "Your trial is available until " + expiry.slice(0, 10) + ". Start with a short practice session.", "/")
  return null
}

export function eligibleInboxOffer({ profile, subscriptions = [], now, coupons = COUPONS }) {
  const { time, exempt, trialExpiry } = inboxAccountContext(profile, subscriptions, now)
  if (exempt || !Number.isFinite(trialExpiry) || time - trialExpiry < DAY_MS || time - trialExpiry >= 7 * DAY_MS) return null
  // Only the existing public checkout catalog is authoritative. No invented codes.
  const entry = Object.entries(coupons).filter(([, value]) => value.active === true && Number.isFinite(value.discountPercent) && value.discountPercent > 0 && value.discountPercent <= 100).sort((a, b) => b[1].discountPercent - a[1].discountPercent || a[0].localeCompare(b[0]))[0]
  return entry ? { code: entry[0], discountPercent: entry[1].discountPercent, trialExpiry: new Date(trialExpiry).toISOString() } : null
}
