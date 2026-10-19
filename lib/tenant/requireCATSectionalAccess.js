import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getEffectiveEntitlement } from "@/lib/tenant/entitlement"
import { requireCapability } from "@/lib/tenant/requireCapability"
import { canAccessCATSectional } from "@/lib/tenant/catTestSeriesAccess"

const STATIC_SECTIONAL_ID = /^sectional-(?:0[1-9]|10)$/

export async function requireCATSectionalAccess(request, sectionalId) {
  const access = await requireCapability(request, "showCATSectionals")
  if (!access.ok) return access

  let sectional
  if (STATIC_SECTIONAL_ID.test(sectionalId)) {
    sectional = { id: sectionalId, is_published: true, is_free: false }
  } else {
    const { data, error } = await supabaseAdmin
      .from("sectional_test_content")
      .select("id,is_published,is_free")
      .eq("id", sectionalId)
      .eq("exam", "CAT")
      .maybeSingle()
    if (error) return { ok: false, status: 503, error: "Could not verify sectional availability" }
    if (!data || data.is_published !== true) return { ok: false, status: 404, error: "CAT sectional not found" }
    sectional = data
  }

  let entitlement = getEffectiveEntitlement({
    profile: access.identity.profile,
    resolvedTenant: access.tenant,
  })
  if (sectional.is_free !== true && !entitlement.hasCATSectionalAccess) {
    const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("plan,expires_at")
      .eq("user_id", access.identity.user.id)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
    if (subscriptionError) return { ok: false, status: 503, error: "Could not verify your sectional access" }
    entitlement = getEffectiveEntitlement({
      profile: access.identity.profile,
      resolvedTenant: access.tenant,
      subscriptions,
    })
  }

  if (!canAccessCATSectional(sectional, entitlement)) {
    return { ok: false, status: 403, error: "An active CAT subscription is required for this sectional" }
  }

  return { ...access, sectional, entitlement }
}
