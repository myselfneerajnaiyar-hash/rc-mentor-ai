import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { dispatchWhatsAppEvents, parseWhatsAppWebhook, verifyMetaWebhookSignature } from "../lib/whatsapp/webhook.js"

const migration = await readFile(new URL("../supabase/migrations/202608120002_create_whatsapp_message_events.sql", import.meta.url), "utf8")

test("Meta signature verification accepts only the matching raw-body HMAC", () => {
  const raw = JSON.stringify({ object: "whatsapp_business_account" })
  const secret = "test-app-secret"
  const signature = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`
  assert.equal(verifyMetaWebhookSignature(raw, signature, secret), true)
  assert.equal(verifyMetaWebhookSignature(`${raw} `, signature, secret), false)
  assert.equal(verifyMetaWebhookSignature(raw, "sha256=bad", secret), false)
  assert.equal(verifyMetaWebhookSignature(raw, signature, "wrong-secret"), false)
})

test("parser extracts incoming text and status events", () => {
  const events = parseWhatsAppWebhook(samplePayload())
  assert.equal(events.length, 3)
  assert.deepEqual(events[0], {
    kind: "message", messageId: "wamid.incoming", phone: "919876543210", whatsappUserId: "919876543210", contactName: "Reader", messageType: "text", text: "Hello", timestamp: "2026-08-12T10:00:00.000Z", phoneNumberId: "12345", displayPhoneNumber: "+91 11111 11111", direction: "incoming", status: "received", raw: samplePayload().entry[0].changes[0].value.messages[0],
  })
  assert.equal(events[1].status, "delivered")
  assert.equal(events[2].status, "failed")
  assert.equal(events[2].errors[0].code, 131026)
})

test("unknown and irrelevant payloads are ignored safely", () => {
  assert.deepEqual(parseWhatsAppWebhook(null), [])
  assert.deepEqual(parseWhatsAppWebhook({ object: "page", entry: [] }), [])
  assert.deepEqual(parseWhatsAppWebhook({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "account_update", value: {} }] }] }), [])
})

test("dispatcher isolates handler failures and continues other events", async () => {
  const handled = []
  const results = await dispatchWhatsAppEvents(parseWhatsAppWebhook(samplePayload()), {
    onMessage: async () => { throw new Error("storage unavailable") },
    onStatus: async (event) => { handled.push(event.messageId) },
  })
  assert.equal(results[0].ok, false)
  assert.deepEqual(handled, ["wamid.outgoing", "wamid.failed"])
})

test("message-event migration is private and duplicate-safe", () => {
  assert.match(migration, /unique \(meta_message_id, event_kind, message_status\)/i)
  assert.match(migration, /raw_event jsonb not null default '\{\}'::jsonb/i)
  assert.match(migration, /enable row level security/i)
  assert.doesNotMatch(migration, /create policy/i)
})

function samplePayload() {
  return {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ field: "messages", value: {
      metadata: { display_phone_number: "+91 11111 11111", phone_number_id: "12345" },
      contacts: [{ profile: { name: "Reader" }, wa_id: "919876543210" }],
      messages: [{ from: "919876543210", id: "wamid.incoming", timestamp: "1786528800", text: { body: "Hello" }, type: "text" }],
      statuses: [
        { id: "wamid.outgoing", recipient_id: "919876543210", status: "delivered", timestamp: "1786528801" },
        { id: "wamid.failed", recipient_id: "919876543210", status: "failed", timestamp: "1786528802", errors: [{ code: 131026 }] },
      ],
    } }] }],
  }
}
