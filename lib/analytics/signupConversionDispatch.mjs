import { randomUUID } from "node:crypto"
import { getMetaConfigurationError, sendMetaSignup } from "./serverConversionEvents.mjs"

export async function dispatchSignupConversion({
  userId,
  method,
  authUser,
  profile,
  db,
  env = process.env,
  sendEvent = sendMetaSignup,
  createClaimToken = randomUUID,
}) {
  if (!db?.rpc) throw new Error("Signup conversion dispatch requires a database RPC client")
  if (!userId || !authUser?.created_at || !["email", "google"].includes(method)) {
    throw new Error("A verified recent signup is required for conversion dispatch")
  }
  const configuration = getMetaConfigurationError(env)
  if (configuration) return { sent: false, provider: "meta", skipped: configuration.code, missing: configuration.missing, retryable: true }

  const eventId = `signup:${userId}`
  const claimToken = createClaimToken()
  const { data: claimed, error: claimError } = await db.rpc("claim_signup_conversion_dispatch", {
    p_user_id: userId,
    p_event_id: eventId,
    p_claim_token: claimToken,
  })
  if (claimError) throw claimError
  if (claimed !== true) return { sent: false, provider: "meta", skipped: "already_sent_or_in_progress", eventId }

  let result
  try {
    result = await sendEvent({ userId, method, authUser, profile, env })
  } catch {
    result = { sent: false, provider: "meta", error: "meta_transport_outcome_unknown", retryable: false, deliveryUnknown: true }
  }
  let rpcName
  let args
  if (result.sent) {
    rpcName = "complete_signup_conversion_dispatch"
    args = { p_user_id: userId, p_claim_token: claimToken }
  } else if (result.retryable) {
    rpcName = "fail_signup_conversion_dispatch"
    args = { p_user_id: userId, p_claim_token: claimToken, p_error: result.error || result.skipped || "conversion_delivery_failed" }
  } else {
    rpcName = "mark_signup_conversion_dispatch_unknown"
    args = { p_user_id: userId, p_claim_token: claimToken, p_error: result.error || "conversion_delivery_outcome_unknown" }
  }
  const { data: updated, error } = await db.rpc(rpcName, args)
  if (error) throw error
  if (updated !== true) throw new Error("Could not update signup conversion delivery status")
  return { ...result, eventId }
}
