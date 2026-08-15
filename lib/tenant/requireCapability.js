import { getAuthenticatedProfile } from "./getCurrentProfile.js"
import { authorizeTenantMembership, getRequestHostname, resolveHostname } from "./resolveHostname.js"

export async function requireCapability(request, capability) {
  const identity = await getAuthenticatedProfile(request)
  if (identity.error) return { ok: false, status: identity.error === "unauthorized" ? 401 : 403, identity }
  const tenant = await resolveHostname(getRequestHostname(request))
  const authorization = authorizeTenantMembership(tenant, identity.profile)
  if (!authorization.allowed) return { ok: false, status: 403, identity, tenant, reason: authorization.reason }
  if (!identity.capabilities?.[capability]) return { ok: false, status: 403, identity }
  return { ok: true, status: 200, identity, tenant }
}
