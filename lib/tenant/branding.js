export const AUCTOR_HOSTNAME = "rc.auctorlabs.in"

export const AUCTOR_BRANDING = Object.freeze({
  brandName: "Auctor RC",
  logoUrl: "/logo.png",
  faviconUrl: "/icon-192.png",
  primaryColor: "#4f46e5",
  secondaryColor: "#0ea5e9",
  isInstitute: false,
  instituteId: null,
  hostname: AUCTOR_HOSTNAME,
})

export function buildInstituteBranding(institute) {
  return Object.freeze({
    brandName: cleanText(institute?.name) || AUCTOR_BRANDING.brandName,
    logoUrl: safeAssetUrl(institute?.logo_url) || AUCTOR_BRANDING.logoUrl,
    faviconUrl: safeAssetUrl(institute?.favicon_url) || AUCTOR_BRANDING.faviconUrl,
    primaryColor: safeColor(institute?.primary_color) || AUCTOR_BRANDING.primaryColor,
    secondaryColor: safeColor(institute?.secondary_color) || AUCTOR_BRANDING.secondaryColor,
    isInstitute: true,
    instituteId: institute.id,
    hostname: normalizeHostname(institute.hostname),
  })
}

export function normalizeHostname(value) {
  return String(value || "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "")
}

export function isDevelopmentHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".vercel.app")
}

function safeColor(value) {
  const color = String(value || "").trim()
  return /^#[0-9a-f]{6}$/i.test(color) ? color : null
}

function safeAssetUrl(value) {
  const url = String(value || "").trim()
  if (!url) return null
  if (url.startsWith("/")) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" ? parsed.toString() : null
  } catch {
    return null
  }
}

function cleanText(value) {
  const text = String(value || "").trim()
  return text ? text.slice(0, 120) : null
}
