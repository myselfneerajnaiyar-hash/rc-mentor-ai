import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { ANACADEMY_INSTITUTE_ID, canShowPricingForProfile } from "../lib/tenant/pricingVisibility.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

test("hides pricing for authenticated AN ACADEMY students", () => {
  assert.equal(canShowPricingForProfile({ institute_id: ANACADEMY_INSTITUTE_ID, role: "student" }), false)
})

test("keeps pricing hidden until the trusted profile lookup completes", () => {
  assert.equal(canShowPricingForProfile({ institute_id: ANACADEMY_INSTITUTE_ID, role: "student" }, { loading: true }), false)
  assert.equal(canShowPricingForProfile(null, { loading: true }), false)
})

test("preserves pricing for other institutes and non-institute profiles", () => {
  assert.equal(canShowPricingForProfile({ institute_id: "another-institute", role: "student" }), true)
  assert.equal(canShowPricingForProfile({ role: "student" }), true)
  assert.equal(canShowPricingForProfile(null), true)
})

test("preserves existing institute-admin pricing behavior", () => {
  assert.equal(canShowPricingForProfile({ institute_id: ANACADEMY_INSTITUTE_ID, role: "admin" }), true)
})

test("pricing entry points use the shared profile visibility rule", async () => {
  const files = [
    "app/page.js",
    "app/pricing/page.jsx",
    "app/first-session/page.jsx",
    "app/preview/components/FaqSection.jsx",
    "app/preview-ad/PreviewAdSignupExperience.jsx",
    "components/PricingVisibility.jsx",
    "app/bootcamp-2026/page.jsx",
    "app/bootcamp-2026/start/AcquisitionStart.jsx",
    "app/bootcamp-2026/StickyStartCTA.jsx",
    "components/TrialPromotions.jsx",
    "components/TrialConversionBanner.jsx",
    "components/CompletionPlansOffer.jsx",
    "components/PersonalizedAnnouncementRibbon.jsx",
    "components/PreviewNavbar.jsx",
    "components/StudentDesktopSidebar.jsx",
    "components/ProfileView.jsx",
    "components/HomeView.jsx",
    "components/home-v2/PremiumCTA.jsx",
    "components/home-v2/TestSeriesHero.jsx",
    "components/mobile/PracticeHub.jsx",
    "components/mobile/PremiumLock.jsx",
    "components/bootcamp/BootCampHomeCard.jsx",
    "components/bootcamp/BootcampOffer.jsx",
    "components/bootcamp/BootCampSession.jsx",
    "components/bootcamp/BootCampOverallAnalytics.jsx",
  ]
  for (const file of files) {
    const source = await readFile(resolve(root, file), "utf8")
    assert.match(source, /usePricingVisibility/, `${file} should apply the shared AN ACADEMY visibility rule`)
  }
  const inbox = await readFile(resolve(root, "components/inbox/InboxApp.jsx"), "utf8")
  assert.match(inbox, /canShowPricingForProfile/, "inbox offer messages should use the shared visibility rule")
  assert.match(inbox, /loading: tenantLoading/, "inbox offers should stay hidden while the trusted profile is loading")
  assert.match(inbox, /FILTERS\.filter\(\(item\) => item !== "OFFERS"\)/, "AN ACADEMY should not see an offers filter tab")
  const catBootcamp = await readFile(resolve(root, "app/cat-varc-bootcamp/page.jsx"), "utf8")
  assert.match(catBootcamp, /<PricingVisibility>/, "the public Boot Camp preview should gate its purchase offer")
})
