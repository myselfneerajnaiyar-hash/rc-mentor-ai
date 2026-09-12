export function normalizeWhatsAppPhoneE164(phone) {
  if (typeof phone !== "string") {
    return { ok: false, error: "invalid_phone", message: "Phone must be a string" }
  }

  const trimmed = phone.trim()
  if (!trimmed || /[A-Za-z]/.test(trimmed)) {
    return { ok: false, error: "invalid_phone", message: "Phone format is invalid" }
  }

  const hasPlus = trimmed.startsWith("+")
  const hasDoubleZero = trimmed.startsWith("00")
  const plusCount = (trimmed.match(/\+/g) || []).length
  if (plusCount > (hasPlus ? 1 : 0)) {
    return { ok: false, error: "invalid_phone", message: "Phone format is invalid" }
  }
  let digits = trimmed.replace(/\D/g, "")
  if (hasDoubleZero) digits = digits.replace(/^00/, "")
  if (!hasPlus && !hasDoubleZero && /^[6-9]\d{9}$/.test(digits)) digits = `91${digits}`
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return { ok: false, error: "invalid_phone", message: "Phone must contain 8 to 15 international digits" }
  }

  return { ok: true, phone: `+${digits}` }
}

export function normalizeWhatsAppPhone(phone) {
  const normalized = normalizeWhatsAppPhoneE164(phone)
  if (!normalized.ok) return normalized
  return { ok: true, phone: normalized.phone.slice(1) }
}
