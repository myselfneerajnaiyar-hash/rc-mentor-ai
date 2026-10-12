import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { getExamCapabilities } from "../lib/tenant/capabilities.js"

test("CAT 2026 and CAT 2027 product tours start with Boot Camp before existing tour items", async () => {
  const tour = await readFile(new URL("../components/ProductTour.jsx", import.meta.url), "utf8")
  const bootcampStep = "if(isCatStudent)add('#home-bootcamp-title','CAT VARC Boot Camp'"
  const dailyStep = "if(capabilities.showDailyRC)add('#daily-rc'"

  assert.ok(tour.indexOf(bootcampStep) >= 0)
  assert.ok(tour.indexOf(bootcampStep) < tour.indexOf(dailyStep))
  for (const attemptYear of ["2026", "2027"]) {
    const profile = { exam: "CAT", attempt_year: attemptYear }
    const capabilities = getExamCapabilities(profile.exam)
    assert.equal(capabilities.isCAT, true, `CAT ${attemptYear} remains eligible`)
  }
  assert.match(tour, /if\(isCatStudent\)add\('#home-bootcamp-title'/)
})

test("sidebar keeps its existing Pricing destination and permission logic", async () => {
  const homepage = await readFile(new URL("../app/page.js", import.meta.url), "utf8")
  assert.match(homepage, /id: "premium", label: "Pricing", icon: Trophy/)
  assert.match(homepage, /!entitlement\?\.isInstituteStudent/)
})

test("pricing removes the standalone referral promo while keeping checkout referral validation", async () => {
  const pricing = await readFile(new URL("../app/pricing/page.jsx", import.meta.url), "utf8")
  const orderRoute = await readFile(new URL("../app/api/create-order/route.js", import.meta.url), "utf8")
  assert.doesNotMatch(pricing, /max-w-md mt-10 mx-auto mb-12/)
  assert.match(pricing, /Referral Code \(Optional\)/)
  assert.match(pricing, /\.from\("campus_ambassadors"\)/)
  assert.match(orderRoute, /body\.referralCode/)
  assert.match(pricing, /useState\("AUCTOR20"\)/)
  assert.match(pricing, /onClick=\{\(\) => applyCoupon\(couponInput\)\}/)
  assert.doesNotMatch(pricing, /applyCoupon\(couponFromUrl\)/)
})

test("public header exposes the specified WhatsApp contact safely", async () => {
  const navbar = await readFile(new URL("../components/PreviewNavbar.jsx", import.meta.url), "utf8")
  assert.match(navbar, /https:\/\/wa\.me\/917975369704/)
  assert.match(navbar, /Chat with us on WhatsApp/)
  assert.match(navbar, /target="_blank"/)
  assert.match(navbar, /rel="noopener noreferrer"/)
  assert.match(navbar, /hidden sm:inline/)
})
