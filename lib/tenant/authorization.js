export function authorizeTenantMembership(resolvedTenant, profile) {
  if (!resolvedTenant?.ok) return { allowed: false, reason: "unknown_hostname" }
  if (resolvedTenant.kind === "b2c") return { allowed: true, reason: null }
  if (!profile?.institute_id) return { allowed: false, reason: "institute_membership_required" }
  if (profile.institute_id !== resolvedTenant.institute.id) return { allowed: false, reason: "wrong_institute" }
  return { allowed: true, reason: null }
}
