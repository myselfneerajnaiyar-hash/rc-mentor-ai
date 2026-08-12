import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { WHATSAPP_EVENT_TYPES } from "./config.js"
import { validateEventInput } from "./validation.js"
export { buildTrialLifecycleEvents, getTrialLifecycle } from "./lifecycle.js"

const TABLE = "whatsapp_automation_events"

function assertServer() {
  if (typeof window !== "undefined") throw new Error("WhatsApp automation events are server-only")
}

export function serializeEvent(event) {
  if (!event?.userId) throw new Error("userId is required")
  if (!WHATSAPP_EVENT_TYPES.includes(event.eventType)) throw new Error("Unsupported eventType")
  if (!event.lifecycleKey) throw new Error("lifecycleKey is required")
  const scheduledFor = new Date(event.scheduledFor)
  if (Number.isNaN(scheduledFor.getTime())) throw new Error("scheduledFor must be a valid date")
  const { payload, maxAttempts } = validateEventInput(event)
  return {
    user_id: event.userId,
    event_type: event.eventType,
    lifecycle_key: event.lifecycleKey,
    scheduled_for: scheduledFor.toISOString(),
    payload,
    phone_snapshot: event.phoneSnapshot || null,
    max_attempts: maxAttempts,
  }
}

export async function createEvent(event) {
  const [created] = await createEvents([event])
  return created
}

export async function createEvents(events) {
  assertServer()
  if (!events.length) return []
  const rows = events.map(serializeEvent)
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .upsert(rows, { onConflict: "user_id,event_type,lifecycle_key", ignoreDuplicates: true })
    .select()
  if (error) throw error
  return data || []
}

export async function cancelUserEvents(userId, reason = "cancelled") {
  assertServer()
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason, locked_at: null, locked_by: null })
    .eq("user_id", userId)
    .in("status", ["pending", "failed"])
    .select()
  if (error) throw error
  return data || []
}

export async function claimDueEvents({ processorId, batchSize = 20 }) {
  assertServer()
  const { data, error } = await supabaseAdmin.rpc("claim_due_whatsapp_automation_events", {
    p_locked_by: processorId,
    p_batch_size: batchSize,
  })
  if (error) throw error
  return data || []
}

export async function markEventSent(eventId, claimToken, metaMessageId = null) {
  return completeClaim("mark_whatsapp_automation_event_sent", {
    p_event_id: eventId,
    p_claim_token: claimToken,
    p_meta_message_id: metaMessageId,
  })
}

export async function markEventFailed(eventId, claimToken, errorMessage) {
  return completeClaim("mark_whatsapp_automation_event_failed", {
    p_event_id: eventId,
    p_claim_token: claimToken,
    p_error_message: String(errorMessage || "Unknown error"),
  })
}

export async function markEventCancelled(eventId, claimToken, reason = "cancelled") {
  return completeClaim("mark_whatsapp_automation_event_cancelled", {
    p_event_id: eventId,
    p_claim_token: claimToken,
    p_reason: reason,
  })
}

export async function recoverStaleEvents({ staleBefore }) {
  assertServer()
  const date = new Date(staleBefore)
  if (Number.isNaN(date.getTime())) throw new Error("staleBefore must be a valid date")
  const { data, error } = await supabaseAdmin.rpc("recover_stale_whatsapp_automation_events", { p_stale_before: date.toISOString() })
  if (error) throw error
  return data || 0
}

async function completeClaim(rpcName, parameters) {
  assertServer()
  if (!parameters.p_event_id || !parameters.p_claim_token) throw new Error("eventId and claimToken are required")
  const { data, error } = await supabaseAdmin.rpc(rpcName, parameters)
  if (error) throw error
  return data?.[0] || null
}
