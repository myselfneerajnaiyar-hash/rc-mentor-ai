export const FULL_PLATFORM_PAID_PLANS = Object.freeze(["monthly", "quarterly", "half_yearly", "yearly"])
const FULL_PLATFORM_PAID_PLAN_SET = new Set(FULL_PLATFORM_PAID_PLANS)
const CAT_TEST_SERIES_PLAN = "cat_test_series"

function subscriptionRows({ subscription, subscriptions }) {
  const rows = Array.isArray(subscriptions) ? subscriptions : []
  return subscription ? [...rows, subscription] : rows
}

function isActiveSubscription(subscription, now) {
  const expiry = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : NaN
  return Number.isFinite(expiry) && now < expiry
}

export function hasActivePaidSubscription(subscriptions, now = new Date()) {
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const rows = Array.isArray(subscriptions) ? subscriptions : subscriptions ? [subscriptions] : []
  return rows.some((subscription) =>
    FULL_PLATFORM_PAID_PLAN_SET.has(subscription?.plan) && isActiveSubscription(subscription, currentTime)
  )
}

export function hasActiveCATSectionalSubscription(subscriptions, now = new Date()) {
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const rows = Array.isArray(subscriptions) ? subscriptions : subscriptions ? [subscriptions] : []
  return hasActivePaidSubscription(rows, currentTime) || rows.some((subscription) =>
    subscription?.plan === CAT_TEST_SERIES_PLAN && isActiveSubscription(subscription, currentTime)
  )
}

export function isInstituteStudent(profile, resolvedTenant) {
  return Boolean(
    profile?.institute_id &&
    resolvedTenant?.ok &&
    resolvedTenant.kind === "institute" &&
    resolvedTenant.institute?.id === profile.institute_id
  )
}

export function getEffectiveEntitlement({ profile, resolvedTenant, subscription = null, subscriptions = null, now = new Date() } = {}) {
  if (!profile) return Object.freeze({ kind: "none", hasAccess: false, isPremium: false, isInstituteStudent: false, hasCATSectionalAccess: false })

  const instituteAccess = isInstituteStudent(profile, resolvedTenant)
  if (instituteAccess) return Object.freeze({ kind: "institute", hasAccess: true, isPremium: true, isInstituteStudent: true, hasCATSectionalAccess: true })

  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const activeSubscriptions = subscriptionRows({ subscription, subscriptions }).filter((row) => isActiveSubscription(row, currentTime))
  const hasPlatformSubscription = hasActivePaidSubscription(activeSubscriptions, currentTime)
  const hasCATSectionalSubscription = hasActiveCATSectionalSubscription(activeSubscriptions, currentTime)
  if (hasPlatformSubscription) {
    return Object.freeze({ kind: "subscription", hasAccess: true, isPremium: true, isInstituteStudent: false, hasCATSectionalAccess: true })
  }
  // The separately named CAT Test Series product keeps its narrower product
  // scope while sharing the same CAT sectional access decision everywhere.
  if (hasCATSectionalSubscription) {
    return Object.freeze({ kind: "cat_test_series", hasAccess: false, isPremium: false, isInstituteStudent: false, hasCATSectionalAccess: true })
  }
  // Preserve existing callers that supplied a subscription without its plan,
  // but require a valid, future expiry instead of treating a missing expiry as active.
  const activeLegacySubscription = activeSubscriptions.some((row) => !row.plan)
  if (activeLegacySubscription) {
    return Object.freeze({ kind: "subscription", hasAccess: true, isPremium: true, isInstituteStudent: false, hasCATSectionalAccess: true })
  }

  const premiumExpiry = profile.premium_expires_at ? new Date(profile.premium_expires_at).getTime() : null
  // Preserve legacy premium profiles with no expiry, but do not let a malformed
  // non-null expiry grant access indefinitely.
  if (profile.is_premium && (profile.premium_expires_at == null || Number.isFinite(premiumExpiry) && currentTime < premiumExpiry)) {
    return Object.freeze({ kind: "premium", hasAccess: true, isPremium: true, isInstituteStudent: false, hasCATSectionalAccess: true })
  }

  const trialExpiry = profile.trial_expires_at ? new Date(profile.trial_expires_at).getTime() : null
  if (Number.isFinite(trialExpiry) && currentTime < trialExpiry) {
    return Object.freeze({ kind: "trial", hasAccess: true, isPremium: false, isInstituteStudent: false, hasCATSectionalAccess: false })
  }

  return Object.freeze({ kind: "restricted", hasAccess: false, isPremium: false, isInstituteStudent: false, hasCATSectionalAccess: false })
}
