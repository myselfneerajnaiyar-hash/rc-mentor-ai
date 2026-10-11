import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { dispatchSignupConversion } from "@/lib/analytics/signupConversionDispatch.mjs"

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request) {
  let body
  try { body = await request.json() } catch { return Response.json({ error: "Invalid signup conversion request" }, { status: 400 }) }
  if (!USER_ID_PATTERN.test(body?.userId || "") || !["email", "google"].includes(body?.method)) {
    return Response.json({ error: "Invalid signup conversion request" }, { status: 400 })
  }

  const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.getUserById(body.userId)
  if (authError || !authResult?.user) return Response.json({ error: "Recent signup could not be verified" }, { status: 404 })
  const authUser = authResult.user
  const createdAt = Date.parse(authUser.created_at || "")
  if (!Number.isFinite(createdAt) || createdAt > Date.now() || Date.now() - createdAt > 24 * 60 * 60 * 1000) {
    return Response.json({ error: "Signup conversion is available only for a recent account" }, { status: 403 })
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, phone, signup_attribution_first_touch, signup_attribution_last_touch")
    .eq("user_id", authUser.id)
    .maybeSingle()

  try {
    const result = await dispatchSignupConversion({
      userId: authUser.id,
      method: body.method,
      authUser,
      profile: profile || {},
      db: supabaseAdmin,
    })
    if (result.skipped === "meta_capi_configuration_missing" || result.skipped === "meta_pixel_id_mismatch") {
      return Response.json({
        error: "Meta CompleteRegistration delivery is not configured",
        code: result.skipped,
        required: result.missing,
      }, { status: 503 })
    }
    if (result.deliveryUnknown) return Response.json({ status: "unknown" }, { status: 202 })
    if (result.retryable && !result.sent) return Response.json({ error: "Meta signup conversion was rejected; retry is safe" }, { status: 502 })
    return Response.json({ status: result.sent ? "sent" : "already_sent_or_in_progress" })
  } catch {
    // Do not put account identifiers, provider payloads, or secrets in logs/responses.
    console.error("Signup conversion dispatch failed")
    return Response.json({ error: "Signup conversion dispatch is temporarily unavailable" }, { status: 503 })
  }
}
