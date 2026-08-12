import { createHmac, timingSafeEqual } from "node:crypto"

const MESSAGE_STATUSES = new Set(["sent", "delivered", "read", "failed", "deleted"])

export function verifyMetaWebhookSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false
  const supplied = signatureHeader.slice("sha256=".length)
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex")
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"))
}

export function parseWhatsAppWebhook(payload) {
  if (!payload || payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) return []
  const events = []

  for (const entry of payload.entry) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      if (change?.field !== "messages" || !change.value) continue
      const value = change.value
      const metadata = value.metadata || {}
      const contacts = new Map((value.contacts || []).map((contact) => [contact.wa_id, contact]))

      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        if (!message?.id) continue
        const contact = contacts.get(message.from)
        events.push({
          kind: "message",
          messageId: message.id,
          phone: message.from || null,
          whatsappUserId: contact?.wa_id || message.from || null,
          contactName: contact?.profile?.name || null,
          messageType: message.type || "unknown",
          text: message.type === "text" ? message.text?.body || null : null,
          timestamp: parseMetaTimestamp(message.timestamp),
          phoneNumberId: metadata.phone_number_id || null,
          displayPhoneNumber: metadata.display_phone_number || null,
          direction: "incoming",
          status: "received",
          raw: message,
        })
      }

      for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
        if (!status?.id) continue
        events.push({
          kind: "status",
          messageId: status.id,
          phone: status.recipient_id || null,
          whatsappUserId: status.recipient_id || null,
          timestamp: parseMetaTimestamp(status.timestamp),
          phoneNumberId: metadata.phone_number_id || null,
          displayPhoneNumber: metadata.display_phone_number || null,
          direction: "outgoing",
          status: MESSAGE_STATUSES.has(status.status) ? status.status : "unknown",
          errors: Array.isArray(status.errors) ? status.errors : [],
          raw: status,
        })
      }
    }
  }

  return events
}

export async function dispatchWhatsAppEvents(events, handlers = {}) {
  return Promise.all(events.map(async (event) => {
    try {
      if (event.kind === "message" && handlers.onMessage) await handlers.onMessage(event)
      else if (event.kind === "status" && handlers.onStatus) await handlers.onStatus(event)
      return { ok: true, kind: event.kind, messageId: event.messageId }
    } catch (error) {
      return { ok: false, kind: event.kind, messageId: event.messageId, error: error instanceof Error ? error.message : "Handler failed" }
    }
  }))
}

function parseMetaTimestamp(value) {
  if (!value) return null
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}
