import { supabaseAdmin } from "@/lib/supabaseAdmin"

const TABLE = "whatsapp_message_events"

export async function storeIncomingWhatsAppMessage(event) {
  return upsertEvent(event)
}

export async function storeWhatsAppMessageStatus(event) {
  return upsertEvent(event)
}

async function upsertEvent(event) {
  const row = {
    meta_message_id: event.messageId,
    event_kind: event.kind,
    phone: event.phone,
    whatsapp_user_id: event.whatsappUserId,
    contact_name: event.contactName || null,
    message_type: event.messageType || null,
    message_text: event.text || null,
    direction: event.direction,
    message_status: event.status,
    meta_timestamp: event.timestamp,
    phone_number_id: event.phoneNumberId,
    raw_event: event.raw || {},
  }
  const { error } = await supabaseAdmin
    .from(TABLE)
    .upsert(row, { onConflict: "meta_message_id,event_kind,message_status", ignoreDuplicates: true })
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { stored: false, reason: "table_not_applied" }
    throw error
  }
  return { stored: true }
}
