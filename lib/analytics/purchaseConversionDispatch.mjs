import { randomUUID } from "node:crypto"
import { getPurchaseEventIdentity, sendPurchaseConversionForProvider } from "./serverConversionEvents.mjs"

const PROVIDERS = ["posthog", "meta"]

export async function dispatchPurchaseConversionEvents({
  purchase,
  profile,
  userId,
  paidAt,
  db,
  sendEvent = sendPurchaseConversionForProvider,
  createClaimToken = randomUUID,
}) {
  if (!db?.rpc) throw new Error("Purchase conversion dispatch requires a database RPC client")
  if (!purchase?.razorpay_payment_id) throw new Error("Verified Razorpay payment ID is required for conversion dispatch")

  const identities = getPurchaseEventIdentity({ purchase, userId })
  const results = []

  for (const provider of PROVIDERS) {
    const claimToken = createClaimToken()
    const eventId = provider === "posthog" ? identities.posthogUuid : identities.metaEventId
    const { data: claimed, error: claimError } = await db.rpc("claim_purchase_conversion_dispatch", {
      p_payment_id: purchase.razorpay_payment_id,
      p_provider: provider,
      p_event_id: eventId,
      p_claim_token: claimToken,
    })
    if (claimError) throw claimError
    if (claimed !== true) {
      results.push({ sent: false, provider, skipped: "already_sent_or_in_progress" })
      continue
    }

    const result = await sendEvent({ provider, purchase, profile, userId, paidAt })
    if (result.sent) {
      const { data: completed, error: completeError } = await db.rpc("complete_purchase_conversion_dispatch", {
        p_payment_id: purchase.razorpay_payment_id,
        p_provider: provider,
        p_claim_token: claimToken,
      })
      if (completeError) throw completeError
      if (completed !== true) throw new Error(`Could not complete ${provider} purchase conversion dispatch`)
    } else if (result.retryable) {
      const { error: failError } = await db.rpc("fail_purchase_conversion_dispatch", {
        p_payment_id: purchase.razorpay_payment_id,
        p_provider: provider,
        p_claim_token: claimToken,
        p_error: result.error || result.skipped || "conversion_delivery_failed",
      })
      if (failError) throw failError
    } else {
      const { error: unknownError } = await db.rpc("mark_purchase_conversion_dispatch_unknown", {
        p_payment_id: purchase.razorpay_payment_id,
        p_provider: provider,
        p_claim_token: claimToken,
        p_error: result.error || "conversion_delivery_outcome_unknown",
      })
      if (unknownError) throw unknownError
    }
    results.push(result)
  }

  return results
}
