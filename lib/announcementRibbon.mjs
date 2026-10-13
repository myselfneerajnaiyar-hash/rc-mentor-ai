import { normalizeExam } from "./tenant/capabilities.js"

export const ANNOUNCEMENT_RIBBON_SESSION_KEY = "auctor-announcement-ribbon-dismissed"

const BOOTCAMP_LANDING_HREF = "/bootcamp-2026"
const BOOTCAMP_HOME_HREF = "/boot-camp"
const DAILY_WORKOUT_HREF = "/?view=today"
const PRICING_HREF = "/pricing?coupon=AUCTOR20"

const MESSAGES = Object.freeze({
  cat_prospect: Object.freeze([
    Object.freeze({
      text: "45 days of guided VARC practice. Try Day 1 free →",
      beforeLink: "45 days of guided VARC practice. ",
      linkText: "Try Day 1 free →",
      href: BOOTCAMP_LANDING_HREF,
    }),
  ]),
  non_cat: Object.freeze([
    Object.freeze({
      text: "Build your RC, vocabulary & speed. Practise daily with Auctor →",
      beforeLink: "Build your RC, vocabulary & speed. ",
      linkText: "Practise daily with Auctor →",
      href: DAILY_WORKOUT_HREF,
    }),
    Object.freeze({
      text: "Premium is 20% off. Use AUCTOR20 →",
      beforeLink: "Premium is 20% off. ",
      linkText: "Use AUCTOR20 →",
      href: PRICING_HREF,
    }),
  ]),
  bootcamp_member: Object.freeze([
    Object.freeze({
      text: "Continue your VARC Bootcamp →",
      beforeLink: "",
      linkText: "Continue your VARC Bootcamp →",
      href: BOOTCAMP_HOME_HREF,
    }),
  ]),
  neutral: Object.freeze([
    Object.freeze({
      text: "Build your RC, vocabulary & speed. Practise daily with Auctor →",
      beforeLink: "Build your RC, vocabulary & speed. ",
      linkText: "Practise daily with Auctor →",
      href: DAILY_WORKOUT_HREF,
    }),
    Object.freeze({
      text: "Premium is 20% off. Use AUCTOR20 →",
      beforeLink: "Premium is 20% off. ",
      linkText: "Use AUCTOR20 →",
      href: PRICING_HREF,
    }),
  ]),
})

const KNOWN_EXAMS = new Set(["CAT", "CLAT", "IPMAT", "CUET", "Banking", "GMAT", "SSC", "SAT", "XAT"])

function isBootcampMember(access) {
  if (!access || typeof access !== "object") return null
  if (access.allowed !== true) return false
  return access.source !== "day1_free" || access.firstFreeClaimed === true
}

/**
 * Audience is based on the tenant's canonical exam capability and the
 * authenticated Boot Camp access resolver. Missing data remains neutral.
 */
export function getAnnouncementRibbonAudience({ profile, exam, capabilities, bootcampAccess, bootcampAccessReady } = {}) {
  if (!bootcampAccessReady) return "neutral"
  const member = isBootcampMember(bootcampAccess)
  if (member === null) return "neutral"
  if (member) return "bootcamp_member"
  const profileExam = normalizeExam(profile?.exam)
  const contextExam = typeof exam === "string" ? normalizeExam(exam) : null
  const capabilityExam = typeof capabilities?.exam === "string" ? normalizeExam(capabilities.exam) : null
  if (profileExam !== "CAT") return KNOWN_EXAMS.has(profileExam) ? "non_cat" : "neutral"
  if (
    capabilities?.isCAT === true &&
    capabilityExam === "CAT" &&
    (contextExam === null || contextExam === "CAT")
  ) return "cat_prospect"
  return "neutral"
}

export function getAnnouncementRibbonMessages(audience) {
  return MESSAGES[audience] || []
}

const EXCLUDED_ROUTE_PREFIXES = Object.freeze([
  "/login", "/signup", "/welcome", "/about", "/contact", "/preview", "/preview-ad",
  "/daily-challenge", "/rc-session", "/cat-arena", "/cat-test-series", "/birbal-test",
  "/test-diagnosis", "/shadow-test", "/boot-camp", "/bootcamp-2026/start",
  "/bootcamp-2026/signup", "/payment-success", "/checkout", "/payment", "/pricing",
  "/preview/pricing",
])

function matchesRoute(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function isAnnouncementRibbonExcludedPath(pathname, searchParams) {
  if (!pathname) return true
  if (pathname === "/") {
    const view = searchParams?.get?.("view") || "home"
    return view === "home" || Boolean(searchParams?.has?.("activity"))
  }
  return EXCLUDED_ROUTE_PREFIXES.some(route => matchesRoute(pathname, route))
}

export function shouldShowAnnouncementRibbon({ pathname, searchParams, user, loading, audience, dismissed } = {}) {
  return Boolean(pathname && !isAnnouncementRibbonExcludedPath(pathname, searchParams) && user?.id && !loading && audience && !dismissed)
}
