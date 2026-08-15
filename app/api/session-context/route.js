import { NextResponse } from "next/server"
import { getAuthenticatedProfile } from "@/lib/tenant/getCurrentProfile"
import { authorizeTenantMembership, getRequestHostname, resolveHostname } from "@/lib/tenant/resolveHostname"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const identity = await getAuthenticatedProfile(request)
    const resolved = await resolveHostname(getRequestHostname(request))
    if (identity.error === "unauthorized") return NextResponse.json({ error: identity.error }, { status: 401 })
    // New B2C users create their profile in the existing welcome flow. Institute
    // hosts require a pre-associated profile and never infer membership from host.
    if (identity.error === "profile_not_found" && resolved.ok && resolved.kind === "b2c") {
      return NextResponse.json({
        user: { id: identity.user.id, email: identity.user.email || null },
        profile: null,
        institute: null,
        tenant: { kind: resolved.kind, hostname: resolved.hostname },
        branding: resolved.branding,
        exam: "Unassigned",
        capabilities: { exam: "Unassigned", isCAT: false, showDailyRC: false, showCATSectionals: false },
      })
    }
    if (identity.error) return NextResponse.json({ error: identity.error }, { status: 403 })
    const authorization = authorizeTenantMembership(resolved, identity.profile)
    if (!authorization.allowed) return NextResponse.json({ error: authorization.reason }, { status: 403 })

    return NextResponse.json({
      user: { id: identity.user.id, email: identity.user.email || null },
      profile: identity.profile,
      institute: resolved.institute,
      tenant: { kind: resolved.kind, hostname: resolved.hostname },
      branding: resolved.branding,
      exam: identity.capabilities.exam,
      capabilities: identity.capabilities,
    })
  } catch (error) {
    console.error("Authenticated tenant context failed", { message: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "Unable to load session context" }, { status: 500 })
  }
}
