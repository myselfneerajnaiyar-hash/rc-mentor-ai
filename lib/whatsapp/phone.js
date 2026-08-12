export function normalizeWhatsAppPhone(phone) {
  if (typeof phone !== "string") {
    return { ok: false, error: "invalid_phone", message: "Phone must be a string" }
  }

  const trimmed = phone.trim()
  if (!trimmed || /[A-Za-z]/.test(trimmed)) {
    return { ok: false, error: "invalid_phone", message: "Phone format is invalid" }
  }

  const hasInternationalPrefix = trimmed.startsWith("+") || trimmed.startsWith("00")
  if (!hasInternationalPrefix) {
    return {
      ok: false,
      error: "country_code_required",
      message: "An explicit international country code is required",
    }
  }

  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "")
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return { ok: false, error: "invalid_phone", message: "Phone must contain 8 to 15 international digits" }
  }

  return { ok: true, phone: digits }
}
