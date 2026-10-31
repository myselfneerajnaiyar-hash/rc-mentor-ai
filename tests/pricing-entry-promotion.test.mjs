import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import {
  canShowTrialEndedOffer,
  claimTrialEndedOffer,
  getTrialPromotionState,
  trialEndedOfferKeys,
} from "../lib/tenant/trialPromotions.mjs"

const day = 24 * 60 * 60 * 1000
const now = new Date("2026-10-30T12:00:00.000Z")
const profile = {
  trial_started_at: "2026-10-29T12:00:00.000Z",
  trial_expires_at: "2026-11-01T12:00:00.000Z",
}
function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  }
}

test("trial promotion state shows accurate active days and expires without changing entitlement", () => {
  assert.deepEqual(getTrialPromotionState({ profile, now }), {
    type: "active", daysRemaining: 2, trialDay: 2, expiresAt: profile.trial_expires_at,
  })
  assert.equal(getTrialPromotionState({
    profile,
    entitlement: { kind: "trial", hasAccess: true },
    now: new Date(profile.trial_expires_at),
  }).type, "expired")
  assert.equal(getTrialPromotionState({ profile: {}, now }).type, "none")
})

test("paid, institute, and CAT Test Series users do not receive trial promotions", () => {
  for (const entitlement of [
    { kind: "subscription", isPremium: true },
    { kind: "premium", isPremium: true },
    { kind: "institute", isInstituteStudent: true },
    { kind: "cat_test_series", hasCATSectionalAccess: true },
  ]) {
    assert.equal(getTrialPromotionState({
      profile: { ...profile, trial_expires_at: "2026-10-29T12:00:00.000Z" }, entitlement, now,
    }).type, "none")
  }
})

test("expired offer is claimable once per India-local day and once per session", () => {
  const expiredProfile = { ...profile, trial_expires_at: "2026-10-29T12:00:00.000Z" }
  const dailyStorage = memoryStorage()
  const sessionStorage = memoryStorage()
  const options = { userId: "student-1", profile: expiredProfile, now, dailyStorage, sessionStorage }

  assert.equal(canShowTrialEndedOffer(options), true)
  assert.equal(claimTrialEndedOffer(options), true)
  assert.equal(canShowTrialEndedOffer(options), false)
  assert.equal(claimTrialEndedOffer(options), false)

  const nextDay = new Date("2026-10-31T00:00:00.000Z")
  assert.equal(claimTrialEndedOffer({ ...options, now: nextDay, sessionStorage: memoryStorage() }), true)
  assert.notEqual(
    trialEndedOfferKeys({ userId: "student-1", expiresAt: expiredProfile.trial_expires_at, now }).daily,
    trialEndedOfferKeys({ userId: "student-1", expiresAt: expiredProfile.trial_expires_at, now: nextDay }).daily,
  )
})

test("pricing entry points and tracking use source-tagged links and confirmed purchases", async () => {
  const [pricing, subscribe, resultStrip, shell, profile, bootcamp, dispatch, previewNav, firstSession, mobileShell, bootcampRoutes, bootcampErrors, emailRoutes, promotionCss, profileView] = await Promise.all([
    readFile(new URL("../app/pricing/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SubscribeButton.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CompletionPlansOffer.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.js", import.meta.url), "utf8"),
    readFile(new URL("../components/TrialPromotions.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/bootcamp/BootCampShell.jsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/analytics/serverConversionEvents.mjs", import.meta.url), "utf8"),
    readFile(new URL("../components/PreviewNavbar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/first-session/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/mobile/MobileShell.jsx", import.meta.url), "utf8"),
    Promise.all([
      readFile(new URL("../components/bootcamp/BootCampHomeCard.jsx", import.meta.url), "utf8"),
      readFile(new URL("../components/bootcamp/BootcampOffer.jsx", import.meta.url), "utf8"),
      readFile(new URL("../app/bootcamp-2026/start/AcquisitionStart.jsx", import.meta.url), "utf8"),
    ]),
    Promise.all([
      readFile(new URL("../components/bootcamp/BootCampSession.jsx", import.meta.url), "utf8"),
      readFile(new URL("../components/bootcamp/BootCampOverallAnalytics.jsx", import.meta.url), "utf8"),
    ]),
    Promise.all([
      readFile(new URL("../app/api/send-trial-ending-email/route.js", import.meta.url), "utf8"),
      readFile(new URL("../app/api/send-trial-expired-email/route.js", import.meta.url), "utf8"),
    ]),
    readFile(new URL("../components/trial-promotions.module.css", import.meta.url), "utf8"),
    readFile(new URL("../components/ProfileView.jsx", import.meta.url), "utf8"),
  ])

  assert.match(pricing, /captureLearningEvent\("pricing_viewed", \{ source, pricing_source: source \}\)/)
  assert.match(pricing, /captureLearningEvent\("coupon_applied", \{ coupon_code: result\.code/)
  assert.match(subscribe, /captureLearningEvent\("plan_tapped"/)
  assert.match(subscribe, /captureLearningEvent\("checkout_started"/)
  assert.match(resultStrip, /source=result_strip/)
  assert.match(shell, /source=mobile_footer/)
  assert.match(shell, /label: "See plans"/)
  assert.match(profile, /source=trial_chip/)
  assert.match(profile, /source=profile_plan/)
  const loadingProfile = profileView.slice(profileView.indexOf("if (!profile) return"), profileView.indexOf("const isCAT"))
  assert.match(loadingProfile, /<ProfilePlanRow \/>/)
  assert.match(profile, /source=trial_ended/)
  assert.match(bootcamp, /TrialOfferRibbon/)
  assert.match(mobileShell, /TrialOfferRibbon screen=\{view\}/)
  assert.match(bootcamp, /TrialOfferRibbon screen="bootcamp"/)
  assert.match(profile, /source=ribbon/)
  assert.match(profile, /pricing_ribbon_clicked/)
  assert.match(profile, /trial_tracker_seen/)
  assert.match(profile, /trial_day: trialDay/)
  assert.match(pricing, /const code = couponFromUrl \|\| "AUCTOR30"/)
  assert.match(pricing, /void applyCoupon\(code\)/)
  assert.match(previewNav, /source=preview_nav/)
  assert.match(firstSession, /source=first_session_offer/)
  assert.match(mobileShell, /!isBootCampSurface/)
  assert.match(mobileShell, /TrialPromotionProvider/)
  assert.match(promotionCss, /z-index:\s*2147483647/)
  assert.match(promotionCss, /pointer-events:\s*auto !important/)
  assert.match(pricing, /searchParams\.get\("offer"\) === "bootcamp" \? "bootcamp_offer"/)
  assert.ok(bootcampRoutes.some(source => /source:'bootcamp_home'/.test(source)))
  assert.ok(bootcampRoutes.some(source => /source: 'bootcamp_offer'/.test(source)))
  assert.ok(bootcampRoutes.some(source => /source: 'bootcamp_acquisition'/.test(source)))
  assert.ok(bootcampErrors.some(source => /source=bootcamp_(session|analytics)_error/.test(source)))
  assert.ok(emailRoutes.some(source => /source=trial_ending_email/.test(source)))
  assert.ok(emailRoutes.some(source => /source=trial_expired_email/.test(source)))
  assert.match(dispatch, /event: "purchase_completed"/)
  assert.doesNotMatch(pricing + subscribe, /captureLearningEvent\("purchase_completed"/)
})
