export const ANACADEMY_INSTITUTE_ID = "84e51c75-463e-46a1-a37f-75d993de56d7"

/**
 * Pricing visibility is based only on the authenticated profile returned by
 * the server session context. While that context is resolving, fail closed so
 * institute pricing UI cannot flash before the trusted profile arrives.
 */
export function canShowPricingForProfile(profile, { loading = false } = {}) {
  if (loading) return false
  if (profile?.institute_id !== ANACADEMY_INSTITUTE_ID) return true
  return profile?.role === "admin"
}
