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

test("pricing keeps coupon-only controls and checkout retains referral validation", async () => {
  const pricing = await readFile(new URL("../app/pricing/page.jsx", import.meta.url), "utf8")
  const checkout = await readFile(new URL("../components/SubscribeButton.jsx", import.meta.url), "utf8")
  const orderRoute = await readFile(new URL("../app/api/create-order/route.js", import.meta.url), "utf8")
  assert.doesNotMatch(pricing, /Referral Code|Apply Referral|campus_ambassadors|referralCode=/)
  assert.match(pricing, /Coupon Code/)
  assert.match(pricing, /onClick=\{\(\) => applyCoupon\(couponInput\)\}/)
  assert.match(checkout, /Referral Code \(Optional\)/)
  assert.match(checkout, /\.from\("campus_ambassadors"\)/)
  assert.match(checkout, /\.eq\("status", "active"\)/)
  assert.match(checkout, /referralCode,/)
  assert.match(orderRoute, /body\.referralCode/)
  assert.match(pricing, /useState\("AUCTOR20"\)/)
  assert.doesNotMatch(pricing, /applyCoupon\(couponFromUrl\)/)
})

test("public header exposes the specified WhatsApp contact safely", async () => {
  const navbar = await readFile(new URL("../components/PreviewNavbar.jsx", import.meta.url), "utf8")
  const contact = await readFile(new URL("../components/WhatsAppContactLink.jsx", import.meta.url), "utf8")
  const homePage = await readFile(new URL("../app/page.js", import.meta.url), "utf8")
  const homeHeader = await readFile(new URL("../components/home-v2/Header.jsx", import.meta.url), "utf8")
  assert.match(contact, /https:\/\/wa\.me\/917975369704/)
  assert.match(contact, /Chat with us on WhatsApp/)
  assert.match(contact, /target="_blank"/)
  assert.match(contact, /rel="noopener noreferrer"/)
  assert.match(contact, /aria-label="Chat with us on WhatsApp"/)
  assert.match(contact, /hidden md:inline/)
  assert.match(contact, /sm:hidden[^\n]*Chat with us/)
  assert.match(navbar, /<WhatsAppContactLink \/>/)
  assert.match(homePage, /<WhatsAppContactLink compactOnMobile \/>/)
  assert.match(homeHeader, /<WhatsAppContactLink compactOnMobile \/>/)
  const pricing = await readFile(new URL("../app/pricing/page.jsx", import.meta.url), "utf8")
  assert.match(pricing, /<PreviewNavbar \/>/)
})
