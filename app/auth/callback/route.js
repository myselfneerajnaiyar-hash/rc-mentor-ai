import { NextResponse } from "next/server"
import { getRequestHostname, resolveHostname } from "@/lib/tenant/resolveHostname"
import { attributionFromParams, attributionParams } from "@/lib/attribution.mjs"

export async function GET(request) {

  const requestUrl = new URL(request.url)
const resolved = await resolveHostname(getRequestHostname(request))
if (!resolved.ok) return NextResponse.json({ error: "Unknown authentication hostname" }, { status: 403 })
// OAuth callbacks initiated on localhost must return to that same origin even
// when a proxy supplies a production x-forwarded-host header.
const callbackHostname = requestUrl.hostname.toLowerCase()
const isLocal = callbackHostname === "localhost" || callbackHostname === "127.0.0.1" || callbackHostname === "[::1]"
const destination = new URL("/welcome", isLocal ? requestUrl.origin : `https://${resolved.hostname}`)
destination.searchParams.set("next", requestUrl.searchParams.get("next") || "")
destination.searchParams.set("free", requestUrl.searchParams.get("free") || "")
// Let the browser's persisted Supabase client exchange PKCE codes so the
// resulting session is saved where the rest of this app reads it.
for (const key of ["code", "error", "error_code", "error_description"]) {
  const value = requestUrl.searchParams.get(key)
  if (value) destination.searchParams.set(key, value)
}
for (const [key, value] of attributionParams(attributionFromParams(requestUrl.searchParams))) destination.searchParams.set(key, value)
return NextResponse.redirect(destination)
  
}
