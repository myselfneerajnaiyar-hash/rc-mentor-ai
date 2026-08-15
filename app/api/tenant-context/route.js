import { NextResponse } from "next/server"
import { getRequestHostname, resolveHostname } from "@/lib/tenant/resolveHostname"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const resolved = await resolveHostname(getRequestHostname(request))
    if (!resolved.ok) return NextResponse.json({ error: "Unknown tenant hostname" }, { status: 404 })
    return NextResponse.json({ tenant: { kind: resolved.kind, hostname: resolved.hostname }, branding: resolved.branding })
  } catch (error) {
    console.error("Tenant hostname resolution failed", { message: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "Unable to resolve tenant" }, { status: 500 })
  }
}
