export function validateEventInput(event) {
  const payload = event.payload === undefined ? {} : event.payload
  const maxAttempts = event.maxAttempts ?? 5

  if (!isPlainJsonObject(payload)) throw new Error("payload must be a plain JSON object")
  if (!Number.isInteger(maxAttempts) || maxAttempts <= 0) {
    throw new Error("maxAttempts must be a positive integer")
  }

  let serializedPayload
  try {
    serializedPayload = JSON.parse(JSON.stringify(payload))
  } catch {
    throw new Error("payload must be JSON-serializable")
  }

  return { payload: serializedPayload, maxAttempts }
}

function isPlainJsonObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
