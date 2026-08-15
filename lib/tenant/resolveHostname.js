import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { AUCTOR_BRANDING, AUCTOR_HOSTNAME, buildInstituteBranding, isDevelopmentHostname, normalizeHostname } from "./branding.js"

const INSTITUTE_FIELDS = "id,name,slug,hostname,logo_url,primary_color,secondary_color,favicon_url"

export function getRequestHostname(request) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]
  return normalizeHostname(forwarded || request.headers.get("host") || new URL(request.url).hostname)
}

export async function resolveHostname(hostname, client = supabaseAdmin) {
  const normalized = normalizeHostname(hostname)
  if (normalized === AUCTOR_HOSTNAME || isDevelopmentHostname(normalized)) {
    return { ok: true, kind: "b2c", hostname: normalized, institute: null, branding: AUCTOR_BRANDING }
  }

  const { data, error } = await client.from("institutes").select(INSTITUTE_FIELDS).eq("hostname", normalized).maybeSingle()
  if (error) throw error
  if (!data) return { ok: false, kind: "unknown", hostname: normalized, institute: null, branding: null }
  return { ok: true, kind: "institute", hostname: normalized, institute: data, branding: buildInstituteBranding(data) }
}

export { authorizeTenantMembership } from "./authorization.js"
