import { buildTrialLifecycleEvents } from "./lifecycle.js"

export function buildTrialEnrollment({ profile, siteUrl = "https://rc.auctorlabs.in" }) {
  const baseUrl = String(siteUrl || "https://rc.auctorlabs.in").replace(/\/$/, "")
  const firstName = String(profile.name || "Champion").trim().split(/\s+/)[0]
  const paymentPlanLink = `${baseUrl}/pricing`

  return buildTrialLifecycleEvents({
    userId: profile.user_id,
    trialExpiresAt: profile.trial_expires_at,
    trialDays: profile.trial_days,
    phone: profile.phone,
    payload: {
      firstName,
      loginLink: `${baseUrl}/login`,
      dailyWorkoutLink: baseUrl,
      paymentPlanLink,
      discountPercentage: "30%",
      discountWindow: "3 days",
      discountPaymentLink: `${paymentPlanLink}?coupon=AUCTOR30`,
    },
  })
}
