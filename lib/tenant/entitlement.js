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
  if (subscription && (!Number.isFinite(subscriptionExpiry) || currentTime < subscriptionExpiry)) {
    return Object.freeze({ kind: "subscription", hasAccess: true, isPremium: true, isInstituteStudent: false })
  }

  const premiumExpiry = profile.premium_expires_at ? new Date(profile.premium_expires_at).getTime() : null
  if (profile.is_premium && (!Number.isFinite(premiumExpiry) || currentTime < premiumExpiry)) {
    return Object.freeze({ kind: "premium", hasAccess: true, isPremium: true, isInstituteStudent: false })
  }

  const trialExpiry = profile.trial_expires_at ? new Date(profile.trial_expires_at).getTime() : null
  if (Number.isFinite(trialExpiry) && currentTime < trialExpiry) {
    return Object.freeze({ kind: "trial", hasAccess: true, isPremium: false, isInstituteStudent: false })
  }

  return Object.freeze({ kind: "restricted", hasAccess: false, isPremium: false, isInstituteStudent: false })
}
