import assert from "node:assert/strict"
import test from "node:test"
import { classifyMetaFailure, sendTemplateMessage } from "../lib/whatsapp/client.js"
import { normalizeWhatsAppPhone } from "../lib/whatsapp/phone.js"
import { buildTemplateComponents, validateTemplateComponents, WHATSAPP_TEMPLATES } from "../lib/whatsapp/templates.js"

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
  assert.equal(normalizeWhatsAppPhone("9876543210").ok, false)
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
  const disabled = await sendTemplateMessage(message, { env: {}, fetchImpl, senderImplemented: true })
  const notReady = await sendTemplateMessage(message, { env: { ...enabledEnv, WHATSAPP_SENDER_READY: "false" }, fetchImpl, senderImplemented: true })
  const notImplemented = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl, senderImplemented: false })
  assert.equal(disabled.category, "sender_disabled")
  assert.equal(notReady.category, "sender_not_ready")
  assert.equal(notImplemented.category, "sender_not_ready")
  assert.equal(calls, 0)
})

test("missing Meta configuration and invalid phone fail before requesting", async () => {
  let calls = 0
  const fetchImpl = async () => { calls += 1 }
  const missing = await sendTemplateMessage(message, { env: { WHATSAPP_AUTOMATION_ENABLED: "true", WHATSAPP_SENDER_READY: "true" }, fetchImpl, senderImplemented: true })
  const invalid = await sendTemplateMessage({ ...message, phone: "9876543210" }, { env: enabledEnv, fetchImpl, senderImplemented: true })
  assert.equal(missing.category, "configuration_error")
  assert.equal(invalid.category, "country_code_required")
  assert.equal(calls, 0)
})

test("test mode permits only the configured normalized recipient", async () => {
  let calls = 0
  const fetchImpl = async () => { calls += 1; return jsonResponse(200, { messages: [{ id: "wamid.test" }] }) }
  const env = { ...enabledEnv, WHATSAPP_TEST_MODE: "true", WHATSAPP_TEST_PHONE: "+91 98765 43210" }
  const rejected = await sendTemplateMessage({ ...message, phone: "+1 202 555 0123" }, { env, fetchImpl, senderImplemented: true })
  const accepted = await sendTemplateMessage(message, { env, fetchImpl, senderImplemented: true })
  assert.equal(rejected.category, "test_recipient_rejected")
  assert.equal(accepted.ok, true)
  assert.equal(calls, 1)
})

test("enabled sender creates the correct Meta request and preserves message id", async () => {
  let captured
  const fetchImpl = async (url, options) => { captured = { url, options }; return jsonResponse(200, { messages: [{ id: "wamid.success" }] }) }
  const result = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl, senderImplemented: true })
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
  const network = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl: async () => { throw new Error("request failed with secret-access-token") }, senderImplemented: true })
  const timeout = await sendTemplateMessage(message, { env: enabledEnv, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))), senderImplemented: true, timeoutMs: 1 })
  assert.deepEqual(pick(network), { category: "network_error", retryable: true })
  assert.deepEqual(pick(timeout), { category: "timeout", retryable: true })
  assert.equal(JSON.stringify([network, timeout]).includes("secret-access-token"), false)
})

test("Meta error messages redact bearer credentials", () => {
  const result = classifyMetaFailure({ status: 400, body: { error: { code: 100, message: "Bad request Bearer secret-access-token" } } })
  assert.equal(result.message.includes("secret-access-token"), false)
  assert.equal(result.message.includes("[REDACTED]"), true)
})

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function pick(value) {
  return { category: value.category, retryable: value.retryable }
}
