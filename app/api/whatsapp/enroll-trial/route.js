import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { createEvents } from "@/lib/whatsapp/events"
import { buildTrialEnrollment } from "@/lib/whatsapp/events/enrollment"

export async function POST(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id,name,phone,trial_days,trial_expires_at,is_premium")
    .eq("user_id", user.id)
    .single()
  if (error) return NextResponse.json({ error: "Profile unavailable" }, { status: 400 })
  if (profile.is_premium) return NextResponse.json({ enrolled: 0, skipped: "purchase_completed" })

  try {
    const events = buildTrialEnrollment({ profile, siteUrl: new URL(request.url).origin })
    const created = await createEvents(events)
    return NextResponse.json({ enrolled: created.length })
  } catch (enrollmentError) {
    console.error("WhatsApp trial enrollment failed", { userId: user.id, message: enrollmentError instanceof Error ? enrollmentError.message : "Unknown error" })
    return NextResponse.json({ error: "Trial enrollment failed" }, { status: 500 })
  }
}
