import { WHATSAPP_SENDER_IMPLEMENTED } from "./events/config.js"
import { normalizeWhatsAppPhone } from "./phone.js"

const META_ERROR_CODES = Object.freeze({
  AUTHENTICATION: new Set([190]),
  RATE_LIMIT: new Set([4, 32, 613, 80007]),
  INVALID_PHONE: new Set([131026, 131047]),
  INVALID_TEMPLATE: new Set([132000, 132001, 132005, 132007, 132012, 132015, 132016]),
  INVALID_PARAMETER: new Set([100, 131008, 131009]),
})

export async function sendTemplateMessage(
  { phone, templateName, languageCode, components = [] },
  { env = process.env, fetchImpl = globalThis.fetch, senderImplemented = WHATSAPP_SENDER_IMPLEMENTED, timeoutMs = 10000 } = {}
) {
  const gate = getSenderGate(env, senderImplemented)
  if (!gate.ok) return gate

  const config = getMetaConfiguration(env)
  if (!config.ok) return config

  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized.ok) return permanentFailure(normalized.error, normalized.message)

  const testModeCheck = validateTestRecipient(normalized.phone, env)
  if (!testModeCheck.ok) return testModeCheck

  if (typeof templateName !== "string" || !templateName.trim()) {
    return permanentFailure("invalid_template", "Template name is required")
  }
  if (typeof languageCode !== "string" || !languageCode.trim()) {
    return permanentFailure("invalid_template", "Template language code is required")
  }
  if (!Array.isArray(components)) {
    return permanentFailure("invalid_template_parameters", "Template components must be an array")
  }
  if (typeof fetchImpl !== "function") {
    return permanentFailure("configuration_error", "Server fetch implementation is unavailable")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(
      `https://graph.facebook.com/${encodeURIComponent(config.apiVersion)}/${encodeURIComponent(config.phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalized.phone,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
        signal: controller.signal,
      }
    )

    const body = await readJsonSafely(response)
    if (response.ok && body?.messages?.[0]?.id) {
      return { ok: true, status: "sent", messageId: body.messages[0].id, recipient: normalized.phone }
    }

    return classifyMetaFailure({ status: response.status, body })
  } catch (error) {
    const timedOut = error?.name === "AbortError"
    return {
      ok: false,
      status: "failed",
      category: timedOut ? "timeout" : "network_error",
      retryable: true,
      message: timedOut ? "Meta request timed out" : "Meta request could not be completed",
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function classifyMetaFailure({ status, body }) {
  const code = Number(body?.error?.code)
  const subcode = Number(body?.error?.error_subcode)
  const metaCode = Number.isFinite(code) ? code : null
  const metaSubcode = Number.isFinite(subcode) ? subcode : null
  let category = "permanent_meta_error"
  let retryable = false

  if (status === 429 || META_ERROR_CODES.RATE_LIMIT.has(metaCode)) {
    category = "rate_limit"
    retryable = true
  } else if (status >= 500 || body?.error?.is_transient === true) {
    category = "temporary_meta_error"
    retryable = true
  } else if (status === 401 || status === 403 || META_ERROR_CODES.AUTHENTICATION.has(metaCode)) {
    category = "authentication_failure"
  } else if (META_ERROR_CODES.INVALID_PHONE.has(metaCode)) {
    category = "invalid_phone"
  } else if (META_ERROR_CODES.INVALID_TEMPLATE.has(metaCode)) {
    category = "invalid_template"
  } else if (META_ERROR_CODES.INVALID_PARAMETER.has(metaCode)) {
    category = "invalid_parameter"
  }

  return {
    ok: false,
    status: "failed",
    category,
    retryable,
    httpStatus: Number.isInteger(status) ? status : null,
    metaCode,
    metaSubcode,
    message: safeMetaMessage(body?.error?.message, category),
  }
}

export function getSenderGate(env = process.env, senderImplemented = WHATSAPP_SENDER_IMPLEMENTED) {
  if (env.WHATSAPP_AUTOMATION_ENABLED !== "true") {
    return { ok: false, status: "disabled", category: "sender_disabled", retryable: false, message: "WhatsApp automation is disabled" }
  }
  if (env.WHATSAPP_SENDER_READY !== "true" || senderImplemented !== true) {
    return { ok: false, status: "not_ready", category: "sender_not_ready", retryable: false, message: "WhatsApp sender is not ready" }
  }
  return { ok: true }
}

function getMetaConfiguration(env) {
  const required = {
    accessToken: env.META_WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.META_WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: env.META_GRAPH_API_VERSION,
  }
  const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name)
  if (missing.length) {
    return permanentFailure("configuration_error", `Missing Meta WhatsApp configuration: ${missing.join(", ")}`)
  }
  return { ok: true, ...required }
}

function validateTestRecipient(normalizedPhone, env) {
  if (env.WHATSAPP_TEST_MODE !== "true") return { ok: true }
  const configured = normalizeWhatsAppPhone(env.WHATSAPP_TEST_PHONE)
  if (!configured.ok) return permanentFailure("test_recipient_not_configured", "WhatsApp test recipient is not configured")
  if (configured.phone !== normalizedPhone) {
    return permanentFailure("test_recipient_rejected", "Recipient is not permitted in WhatsApp test mode")
  }
  return { ok: true }
}

function permanentFailure(category, message) {
  return { ok: false, status: "failed", category, retryable: false, message }
}

function safeMetaMessage(message, fallback) {
  if (typeof message !== "string" || !message.trim()) return fallback
  return message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 500)
}

async function readJsonSafely(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
