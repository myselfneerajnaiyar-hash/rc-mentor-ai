import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

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
const next = requestUrl.searchParams.get("next") || "";
const free = requestUrl.searchParams.get("free") || "";

return NextResponse.redirect(
  `https://rc.auctorlabs.in/welcome?next=${next}&free=${free}`
);
  
}