import test from "node:test"
import assert from "node:assert/strict"
import { getSubscriptionFeatures, getSubscriptionPlans, getSubscriptionPrice } from "../lib/pricing/subscriptionPlans.mjs"

test("pricing presents exactly the four existing subscription plans", () => {
  assert.deepEqual(getSubscriptionPlans().map(({ id, name }) => [id, name]), [
    ["monthly", "Monthly"],
    ["quarterly", "Quarterly"],
    ["half_yearly", "Half Yearly"],
    ["yearly", "Annual"],
  ])
})

test("CAT plan features include Bootcamp everywhere and Test Series only from Quarterly", () => {
  const plans = getSubscriptionPlans()
  for (const plan of plans) {
    const features = getSubscriptionFeatures(plan, true)
    assert.ok(features.includes("45-Day VARC Bootcamp"), `${plan.id} should include Bootcamp`)
    assert.equal(features.includes("CAT VARC Test Series"), plan.id !== "monthly")
  }
})

test("non-CAT plans do not advertise Bootcamp or CAT Test Series", () => {
  for (const plan of getSubscriptionPlans()) {
    const features = getSubscriptionFeatures(plan, false)
    assert.ok(!features.includes("45-Day VARC Bootcamp"))
    assert.ok(!features.includes("CAT VARC Test Series"))
  }
})

test("displayed coupon prices use the existing server pricing calculation", () => {
  assert.equal(getSubscriptionPrice("monthly").finalPaise, 39900)
  assert.equal(getSubscriptionPrice("monthly", "AUCTOR99", 99).finalPaise, 399)
  assert.equal(getSubscriptionPrice("quarterly", "AUCTOR20", 20).finalPaise, 63920)
  assert.equal(getSubscriptionPrice("half_yearly", "AUCTOR30", 30).finalPaise, 90930)
  assert.equal(getSubscriptionPrice("yearly", "VARCAUCTOR40", 40).finalPaise, 119940)
})
