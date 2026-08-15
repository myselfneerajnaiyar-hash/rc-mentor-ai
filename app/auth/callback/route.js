import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getRequestHostname, resolveHostname } from "@/lib/tenant/resolveHostname"

export async function GET(request) {

  const requestUrl = new URL(request.url)

  const code = requestUrl.searchParams.get("code")

  if (code) {

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    await supabase.auth.exchangeCodeForSession(code)
  }
const resolved = await resolveHostname(getRequestHostname(request))
if (!resolved.ok) return NextResponse.json({ error: "Unknown authentication hostname" }, { status: 403 })
const isLocal = resolved.hostname === "localhost" || resolved.hostname === "127.0.0.1"
const destination = new URL("/welcome", isLocal ? requestUrl.origin : `https://${resolved.hostname}`)
destination.searchParams.set("next", requestUrl.searchParams.get("next") || "")
destination.searchParams.set("free", requestUrl.searchParams.get("free") || "")
return NextResponse.redirect(destination)
  
}
