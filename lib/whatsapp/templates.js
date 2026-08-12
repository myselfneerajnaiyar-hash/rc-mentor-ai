const REQUIRED_PARAMETERS = Object.freeze({
  trial_welcome: ["firstName", "loginLink"],
  trial_no_session: ["firstName", "dailyWorkoutLink"],
  trial_day1: ["firstName", "sessionsCount", "accuracyPercent", "averageSecondsPerQuestion", "paymentPlanLink"],
  trial_day2: ["firstName", "paymentPlanLink"],
  trial_day3: ["firstName", "paymentPlanLink"],
  trial_day4_discount: ["firstName", "discountPercentage", "discountWindow", "discountPaymentLink"],
  trial_day7_discount_expiry: ["firstName", "discountPercentage", "discountPaymentLink"],
})

export const WHATSAPP_TEMPLATES = Object.freeze(
  Object.fromEntries(
    Object.entries(REQUIRED_PARAMETERS).map(([eventType, parameterNames]) => [
      eventType,
      Object.freeze({
        eventType,
        metaTemplateName: eventType,
        languageCode: "en",
        expectedParameterCount: parameterNames.length,
        parameterNames: Object.freeze(parameterNames),
      }),
    ])
  )
)

export function buildTemplateComponents(eventType, values) {
  const definition = WHATSAPP_TEMPLATES[eventType]
  if (!definition) throw new Error(`Unknown WhatsApp event type: ${eventType}`)
  if (!isPlainObject(values)) throw new Error("Template values must be a plain object")

  const parameters = definition.parameterNames.map((name) => {
    const value = values[name]
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error(`Missing required template parameter: ${name}`)
    }
    return { type: "text", text: String(value) }
  })

  return [{ type: "body", parameters }]
}

export function validateTemplateComponents(eventType, components) {
  const definition = WHATSAPP_TEMPLATES[eventType]
  if (!definition) return { ok: false, error: "invalid_template" }
  const body = Array.isArray(components) ? components.find((component) => component?.type === "body") : null
  const parameters = body?.parameters
  if (!Array.isArray(parameters) || parameters.length !== definition.expectedParameterCount) {
    return { ok: false, error: "invalid_template_parameters" }
  }
  const valid = parameters.every((parameter) => parameter?.type === "text" && typeof parameter.text === "string" && parameter.text.trim())
  return valid ? { ok: true } : { ok: false, error: "invalid_template_parameters" }
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
