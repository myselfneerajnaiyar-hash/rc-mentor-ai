import assert from "node:assert/strict"
import test from "node:test"
import { classifyMetaFailure, sendTemplateMessage } from "../lib/whatsapp/client.js"
import { normalizeWhatsAppPhone, normalizeWhatsAppPhoneE164 } from "../lib/whatsapp/phone.js"
import { buildTemplateComponents, validateTemplateComponents, WHATSAPP_TEMPLATES } from "../lib/whatsapp/templates.js"
import { processClaimedEvents } from "../lib/whatsapp/processor.js"
import { buildDayOneEvent, getQualifyingActivitySummary } from "../lib/whatsapp/events/activity.js"

const enabledEnv = Object.freeze({
  WHATSAPP_AUTOMATION_ENABLED: "true",
  WHATSAPP_SENDER_READY: "true",
  META_WHATSAPP_ACCESS_TOKEN: "secret-access-token",
  META_WHATSAPP_PHONE_NUMBER_ID: "phone-number-id",
  META_GRAPH_API_VERSION: "v23.0",
})

const message = Object.freeze({
  phone: "+91 98765-43210",
  templateName: "approved_welcome_name",
  languageCode: "en",
  components: [{ type: "body", parameters: [{ type: "text", text: "Reader" }, { type: "text", text: "https://example.com/login" }] }],
})

test("phone normalization preserves explicit international country codes", () => {
  assert.deepEqual(normalizeWhatsAppPhone("+91 (98765) 43210"), { ok: true, phone: "919876543210" })
  assert.deepEqual(normalizeWhatsAppPhone("0044 20 7946 0958"), { ok: true, phone: "442079460958" })
  assert.deepEqual(normalizeWhatsAppPhone("9876543210"), { ok: true, phone: "919876543210" })
  assert.deepEqual(normalizeWhatsAppPhoneE164("98765-43210"), { ok: true, phone: "+919876543210" })
  assert.deepEqual(normalizeWhatsAppPhoneE164("+91 98765 43210"), { ok: true, phone: "+919876543210" })
  assert.deepEqual(normalizeWhatsAppPhoneE164("919876543210"), { ok: true, phone: "+919876543210" })
  assert.equal(normalizeWhatsAppPhoneE164("+91+919876543210").ok, false)
  assert.equal(normalizeWhatsAppPhone("+12").ok, false)
})

test("all seven template definitions are separate and parameter-counted", () => {
  assert.deepEqual(Object.keys(WHATSAPP_TEMPLATES), ["trial_welcome", "trial_no_session", "trial_day1", "trial_day2", "trial_day3", "trial_day4_discount", "trial_day7_discount_expiry"])
  assert.equal(WHATSAPP_TEMPLATES.trial_day1.expectedParameterCount, 5)
  assert.equal(WHATSAPP_TEMPLATES.trial_day7_discount_expiry.expectedParameterCount, 3)
})

test("template builders reject missing values and validators reject wrong counts", () => {
  assert.throws(() => buildTemplateComponents("trial_welcome", { firstName: "Reader" }), /loginLink/)
  const components = buildTemplateComponents("trial_welcome", { firstName: "Reader", loginLink: "https://example.com" })
  assert.equal(validateTemplateComponents("trial_welcome", components).ok, true)
  assert.equal(validateTemplateComponents("trial_welcome", [{ type: "body", parameters: [] }]).ok, false)
})

test("disabled and not-ready senders make zero requests", async () => {
  let calls = 0
  const fetchImpl = async () => { calls += 1 }
  const disabled = await sendTemplateMessage(message, { env: {}, fetchImpl })
  const notReady = await sendTemplateMessage(message, { env: { ...enabledEnv, WHATSAPP_SENDER_READY: "false" }, fetchImpl })
  const incomplete = await sendTemplateMessage(message, { env: { WHATSAPP_AUTOMATION_ENABLED: "true", WHATSAPP_SENDER_READY: "true" }, fetchImpl })
  assert.equal(disabled.category, "sender_disabled")
  assert.equal(notReady.category, "sender_not_ready")
  assert.equal(incomplete.category, "sender_not_ready")
  assert.equal(calls, 0)
})

test("missing Meta configuration and invalid phone fail before requesting", async () => {
  let calls = 0
  const fetchImpl = async () => { calls += 1 }
  const invalid = await sendTemplateMessage({ ...message, phone: "not-a-phone" }, { env: enabledEnv, fetchImpl })
  assert.equal(invalid.category, "invalid_phone")
  assert.equal(calls, 0)
})

test("test mode permits only the configured normalized recipient", async () => {
  let calls = 0
  const fetchImpl = async () => { calls += 1; return jsonResponse(200, { messages: [{ id: "wamid.test" }] }) }
  const env = { ...enabledEnv, WHATSAPP_TEST_MODE: "true", WHATSAPP_TEST_PHONE: "+91 98765 43210" }
  const rejected = await sendTemplateMessage({ ...message, phone: "+1 202 555 0123" }, { env, fetchImpl })
  const accepted = await sendTemplateMessage(message, { env, fetchImpl })
  assert.equal(rejected.category, "test_recipient_rejected")
  assert.equal(accepted.ok, true)
  assert.equal(calls, 1)
})

test("production queue processor does not claim lifecycle events in test mode", async () => {
  const route = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../app/api/whatsapp/process/route.js", import.meta.url), "utf8")
  )
  assert.match(route, /WHATSAPP_TEST_MODE === "true"/)
  assert.match(route, /testMode: true, recovered: 0, claimed: 0/)
})

test("enabled sender creates the correct Meta request and preserves message id", async () => {
  let captured
  const fetchImpl = async (url, options) => { captured = { url, options }; return jsonResponse(200, { messages: [{ id: "wamid.success" }] }) }
  const result = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl })
  const body = JSON.parse(captured.options.body)
  assert.equal(result.messageId, "wamid.success")
  assert.equal(captured.url, "https://graph.facebook.com/v23.0/phone-number-id/messages")
  assert.equal(captured.options.headers.Authorization, "Bearer secret-access-token")
  assert.deepEqual(body, { messaging_product: "whatsapp", to: "919876543210", type: "template", template: { name: "approved_welcome_name", language: { code: "en" }, components: message.components } })
})

test("Meta failures distinguish permanent and retryable categories", () => {
  assert.equal(classifyMetaFailure({ status: 400, body: { error: { code: 132001 } } }).category, "invalid_template")
  assert.equal(classifyMetaFailure({ status: 400, body: { error: { code: 131026 } } }).category, "invalid_phone")
  assert.deepEqual(pick(classifyMetaFailure({ status: 429, body: { error: { code: 80007 } } })), { category: "rate_limit", retryable: true })
  assert.deepEqual(pick(classifyMetaFailure({ status: 503, body: { error: { code: 2 } } })), { category: "temporary_meta_error", retryable: true })
  assert.equal(classifyMetaFailure({ status: 401, body: { error: { code: 190 } } }).category, "authentication_failure")
})

test("network and timeout failures are retryable and never expose the token", async () => {
  const network = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl: async () => { throw new Error("request failed with secret-access-token") } })
  const timeout = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))), timeoutMs: 1 })
  assert.deepEqual(pick(network), { category: "network_error", retryable: true })
  assert.deepEqual(pick(timeout), { category: "timeout", retryable: true })
  assert.equal(JSON.stringify([network, timeout]).includes("secret-access-token"), false)
})

test("Meta error messages redact bearer credentials", () => {
  const result = classifyMetaFailure({ status: 400, body: { error: { code: 100, message: "Bad request Bearer secret-access-token" } } })
  assert.equal(result.message.includes("secret-access-token"), false)
  assert.equal(result.message.includes("[REDACTED]"), true)
})

test("queue processor completes successful sends and retries transient failures", async () => {
  const calls = []
  const dependencies = {
    hasPurchased: async () => false,
    markSent: async (...args) => calls.push(["sent", ...args]),
    markFailed: async (...args) => calls.push(["failed", ...args]),
    markCancelled: async (...args) => calls.push(["cancelled", ...args]),
  }
  const event = {
    id: "event-1",
    user_id: "user-1",
    event_type: "trial_welcome",
    claim_token: "claim-1",
    phone_snapshot: "+919876543210",
    payload: { firstName: "Reader", loginLink: "https://example.com/login" },
  }

  const sent = await processClaimedEvents([event], {
    ...dependencies,
    send: async () => ({ ok: true, messageId: "wamid.sent" }),
  })
  assert.deepEqual(sent, { processed: 1, sent: 1, failed: 0, cancelled: 0 })
  assert.deepEqual(calls.pop(), ["sent", "event-1", "claim-1", "wamid.sent"])

  const retried = await processClaimedEvents([event], {
    ...dependencies,
    send: async () => ({ ok: false, retryable: true, category: "rate_limit", message: "retry later" }),
  })
  assert.deepEqual(retried, { processed: 1, sent: 0, failed: 1, cancelled: 0 })
  assert.deepEqual(calls.pop(), ["failed", "event-1", "claim-1", "rate_limit: retry later"])
})

test("queue processor cancels purchased users without sending", async () => {
  let sends = 0
  const calls = []
  const result = await processClaimedEvents([{
    id: "event-2",
    user_id: "paid-user",
    event_type: "trial_day2",
    claim_token: "claim-2",
    phone_snapshot: "+919876543210",
    payload: {},
  }], {
    hasPurchased: async () => true,
    markSent: async () => {},
    markFailed: async () => {},
    markCancelled: async (...args) => calls.push(args),
    send: async () => { sends += 1 },
  })
  assert.equal(sends, 0)
  assert.deepEqual(calls, [["event-2", "claim-2", "purchase_completed"]])
  assert.deepEqual(result, { processed: 1, sent: 0, failed: 0, cancelled: 1 })
})

test("queue processor cancels users without consent and rechecks consent before Meta", async () => {
  let checks = 0
  let sends = 0
  const cancelled = []
  await processClaimedEvents([queueEvent("consent", "user-1")], {
    hasWhatsAppConsent: async () => ++checks === 1,
    hasPurchased: async () => false,
    send: async () => { sends += 1 },
    markSent: async () => {},
    markFailed: async () => {},
    markCancelled: async (...args) => cancelled.push(args),
  })
  assert.equal(checks, 2)
  assert.equal(sends, 0)
  assert.equal(cancelled[0][2], "whatsapp_opt_in_required")
})

test("queue processor sends, retries transient failures, and cancels purchasers", async () => {
  const calls = { sent: [], failed: [], cancelled: [] }
  const events = [
    queueEvent("send", "user-free"),
    queueEvent("retry", "user-free"),
    queueEvent("purchased", "user-paid"),
  ]
  const summary = await processClaimedEvents(events, {
    hasPurchased: async (userId) => userId === "user-paid",
    send: async ({ phone }) => phone.includes("1111")
      ? { ok: true, messageId: "wamid.sent" }
      : { ok: false, retryable: true, category: "rate_limit", message: "retry later" },
    markSent: async (...args) => calls.sent.push(args),
    markFailed: async (...args) => calls.failed.push(args),
    markCancelled: async (...args) => calls.cancelled.push(args),
  })
  assert.deepEqual(summary, { processed: 3, sent: 1, failed: 1, cancelled: 1 })
  assert.equal(calls.sent[0][2], "wamid.sent")
  assert.match(calls.failed[0][2], /rate_limit/)
  assert.equal(calls.cancelled[0][2], "purchase_completed")
})

test("qualifying activity aggregates only supported question metrics", async () => {
  const summary = await getQualifyingActivitySummary(activityDb({
    daily_rc_attempts: [{ completed_at: "2026-08-12T01:00:00Z", correct_count: 3, incorrect_count: 1, unanswered_count: 0, time_taken: 120 }],
    editorial_history: [{ created_at: "2026-08-12T02:00:00Z" }],
  }), "user-1", "2026-08-12T00:00:00Z")
  assert.deepEqual(summary, { activitiesCount: 2, questionActivitiesCount: 1, hasActivity: true, hasDayOneMetrics: true, accuracyPercent: 75, averageSecondsPerQuestion: 30 })
})

test("non-question activity is real engagement but cannot create a misleading Day-1", async () => {
  const summary = await getQualifyingActivitySummary(activityDb({ mentor_chat_history: [{ created_at: "2026-08-12T01:00:00Z", role: "user" }] }), "user-1", "2026-08-12T00:00:00Z")
  assert.equal(summary.hasActivity, true)
  assert.equal(summary.hasDayOneMetrics, false)
  assert.throws(() => buildDayOneEvent({ profile: { user_id: "user-1", name: "Reader", phone: "+919876543210", siteUrl: "https://example.com" }, lifecycleKey: "trial:2026-08-15T00:00:00.000Z", summary }), /real question performance/)
})

test("no-session is cancelled for any qualifying activity and sent for zero activity", async () => {
  const event = { ...queueEvent("no-session", "user-1"), event_type: "trial_no_session", payload: { firstName: "Reader", dailyWorkoutLink: "https://example.com" } }
  let sends = 0
  const cancelled = []
  await processClaimedEvents([event], { hasPurchased: async () => false, hasCompletedActivity: async () => true, send: async () => { sends += 1 }, markSent: async () => {}, markFailed: async () => {}, markCancelled: async (...args) => cancelled.push(args) })
  assert.equal(sends, 0)
  assert.equal(cancelled[0][2], "qualifying_activity_completed")
  await processClaimedEvents([event], { hasPurchased: async () => false, hasCompletedActivity: async () => false, send: async () => { sends += 1; return { ok: true, messageId: "wamid.no-session" } }, markSent: async () => {}, markFailed: async () => {}, markCancelled: async () => {} })
  assert.equal(sends, 1)
})

test("final purchase check blocks a purchase occurring after claim", async () => {
  let checks = 0
  let sends = 0
  const cancelled = []
  await processClaimedEvents([queueEvent("race", "user-1")], {
    hasPurchased: async () => ++checks === 2,
    send: async () => { sends += 1 },
    markSent: async () => {}, markFailed: async () => {},
    markCancelled: async (...args) => cancelled.push(args),
  })
  assert.equal(checks, 2)
  assert.equal(sends, 0)
  assert.equal(cancelled[0][2], "purchase_completed")
})

test("first and subsequent activity summaries produce the same idempotent Day-1 identity", () => {
  const base = { profile: { user_id: "user-1", name: "Reader", phone: "+919876543210" }, lifecycleKey: "trial:2026-08-15T00:00:00.000Z" }
  const first = buildDayOneEvent({ ...base, summary: { hasActivity: true, hasDayOneMetrics: true, questionActivitiesCount: 1, accuracyPercent: 75, averageSecondsPerQuestion: 30 } })
  const later = buildDayOneEvent({ ...base, summary: { hasActivity: true, hasDayOneMetrics: true, questionActivitiesCount: 2, accuracyPercent: 80, averageSecondsPerQuestion: 28 } })
  assert.equal(`${first.userId}:${first.eventType}:${first.lifecycleKey}`, `${later.userId}:${later.eventType}:${later.lifecycleKey}`)
})

function queueEvent(id, userId) {
  return {
    id,
    user_id: userId,
    claim_token: `claim-${id}`,
    event_type: "trial_welcome",
    phone_snapshot: id === "send" ? "+919999991111" : "+919999992222",
    payload: { firstName: "Reader", loginLink: "https://example.com/login" },
  }
}

function activityDb(rowsByTable) {
  return { from(table) { const result = { data: rowsByTable[table] || [], error: null }; const query = { select: () => query, eq: () => query, gte: () => query, then: (resolve) => resolve(result) }; return query } }
}

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function pick(value) {
  return { category: value.category, retryable: value.retryable }
}
