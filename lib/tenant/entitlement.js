export function isInstituteStudent(profile, resolvedTenant) {
  return Boolean(
    profile?.institute_id &&
    resolvedTenant?.ok &&
    resolvedTenant.kind === "institute" &&
    resolvedTenant.institute?.id === profile.institute_id
  )
}

export function getEffectiveEntitlement({ profile, resolvedTenant, subscription = null, now = new Date() } = {}) {
  if (!profile) return Object.freeze({ kind: "none", hasAccess: false, isPremium: false, isInstituteStudent: false })

  const instituteAccess = isInstituteStudent(profile, resolvedTenant)
  if (instituteAccess) return Object.freeze({ kind: "institute", hasAccess: true, isPremium: true, isInstituteStudent: true })

  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const subscriptionExpiry = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : null
  // A CAT test-series purchase is a separate product; it must not grant the
  // general premium features included with monthly/quarterly subscriptions.
  const isPremiumPlan = !subscription?.plan || ["monthly", "quarterly", "half_yearly", "yearly"].includes(subscription.plan)
  if (subscription && isPremiumPlan && (!Number.isFinite(subscriptionExpiry) || currentTime < subscriptionExpiry)) {
    return Object.freeze({ kind: "subscription", hasAccess: true, isPremium: true, isInstituteStudent: false })
  }

  const premiumExpiry = profile.premium_expires_at ? new Date(profile.premium_expires_at).getTime() : null
  // Preserve legacy premium profiles with no expiry, but do not let a malformed
  // non-null expiry grant access indefinitely.
  if (profile.is_premium && (profile.premium_expires_at == null || Number.isFinite(premiumExpiry) && currentTime < premiumExpiry)) {
    return Object.freeze({ kind: "premium", hasAccess: true, isPremium: true, isInstituteStudent: false })
  }

  const trialExpiry = profile.trial_expires_at ? new Date(profile.trial_expires_at).getTime() : null
  if (Number.isFinite(trialExpiry) && currentTime < trialExpiry) {
    return Object.freeze({ kind: "trial", hasAccess: true, isPremium: false, isInstituteStudent: false })
  }

  return Object.freeze({ kind: "restricted", hasAccess: false, isPremium: false, isInstituteStudent: false })
}
