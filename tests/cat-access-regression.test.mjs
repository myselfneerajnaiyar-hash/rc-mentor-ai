import test from "node:test"
import assert from "node:assert/strict"
import {
  getCATTestSeriesAccessStatus,
  hasCATTestSeriesAccess,
  isCATSectionalLocked,
  isCATSectionalPublished,
} from "../lib/tenant/catTestSeriesAccess.js"
import { getEffectiveEntitlement } from "../lib/tenant/entitlement.js"
import { getCATSectionalContentError } from "../lib/cat-arena/contentLoad.mjs"

const now = new Date("2026-10-09T12:00:00Z")
const krishSubscriptions = [
  { plan: "cat_test_series", expires_at: "2027-10-08T21:37:40.080Z" },
  { plan: "quarterly", expires_at: "2027-01-09T01:16:11.183Z" },
]

test("two active subscriptions for one user preserve both product entitlements", () => {
  assert.equal(hasCATTestSeriesAccess(krishSubscriptions, now), true)
  const quarterly = krishSubscriptions.find((subscription) => subscription.plan === "quarterly")
  assert.equal(quarterly.expires_at > now.toISOString(), true)
})

test("CAT Test Series access accepts the active purchased plan and rejects quarterly alone", () => {
  assert.equal(hasCATTestSeriesAccess(krishSubscriptions, now), true)
  assert.equal(hasCATTestSeriesAccess([krishSubscriptions[1]], now), false)
})

test("quarterly remains general premium while CAT Test Series alone is not general premium", () => {
  const profile = { is_premium: true, premium_expires_at: "2027-01-09T01:16:11.183Z" }
  assert.equal(getEffectiveEntitlement({ profile, subscription: krishSubscriptions[1], now }).isPremium, true)
  assert.equal(getEffectiveEntitlement({ profile: { is_premium: false }, subscription: krishSubscriptions[0], now }).isPremium, false)
})

test("paid CAT PYQs and Auctor sectionals unlock for an entitled student", () => {
  const paidPYQ = { test_type: "pyq", is_published: true, is_free: false }
  const paidAuctorSectional = { test_type: "mock", is_published: true, is_free: null }
  const hasPaidCATAccess = hasCATTestSeriesAccess(krishSubscriptions, now)
  assert.equal(isCATSectionalLocked(paidPYQ, hasPaidCATAccess), false)
  assert.equal(isCATSectionalLocked(paidAuctorSectional, hasPaidCATAccess), false)
})

test("free content stays available; false or null is_free stays paid without CAT access", () => {
  assert.equal(isCATSectionalLocked({ is_free: true }, false), false)
  assert.equal(isCATSectionalLocked({ is_free: false }, false), true)
  assert.equal(isCATSectionalLocked({ is_free: null }, false), true)
})

test("unpublished content is excluded regardless of its free flag", () => {
  assert.equal(isCATSectionalPublished({ is_published: true }), true)
  assert.equal(isCATSectionalPublished({ is_published: false, is_free: true }), false)
  assert.equal(isCATSectionalPublished({ is_published: null, is_free: true }), false)
})

test("subscription query errors remain distinguishable from a verified locked account", () => {
  assert.equal(getCATTestSeriesAccessStatus({ loading: true }), "checking")
  assert.equal(getCATTestSeriesAccessStatus({ error: new Error("RLS denied") }), "error")
  assert.equal(getCATTestSeriesAccessStatus({}), "ready")
})

test("sectional content and RLS query errors stop the opening flow with a visible error", () => {
  assert.match(getCATSectionalContentError({ errors: [new Error("RLS denied")], passageCount: 4, questionCount: 24 }), /could not be loaded/i)
  assert.match(getCATSectionalContentError({ passageCount: 0, questionCount: 24 }), /no published passage content/i)
  assert.match(getCATSectionalContentError({ passageCount: 4, questionCount: 0 }), /no question content/i)
  assert.equal(getCATSectionalContentError({ passageCount: 4, questionCount: 24 }), null)
})
