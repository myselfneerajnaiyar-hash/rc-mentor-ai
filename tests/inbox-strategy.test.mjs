import test from "node:test"
import assert from "node:assert/strict"
import { chooseDailyNotification } from "../lib/inbox/rules.js"
import { chooseInboxLifecycle, eligibleInboxOffer } from "../lib/inbox/lifecycle.js"
import { inboxAnnouncements } from "../lib/inbox/announcements.js"
import { createInboxNotification } from "../lib/inbox/service.js"
import { MemoryDb, uid } from "./helpers/inbox-db.mjs"

const userId = uid(9000), dateKey = "2026-09-13"
const event = (day, module, questions, correct, skill = null, sessionId = day + module) => ({ day, module, questions, correct, skill, sessionId, engagement: false })
const choose = (events = [], extras = {}) => chooseDailyNotification({ userId, dateKey, events, history: [], accountCreatedAt: "2026-08-01T00:00:00Z", ...extras })
const profile = { user_id: userId, created_at: "2026-09-13T00:00:00Z", trial_expires_at: "2026-09-16T00:00:00Z" }
const now = new Date("2026-09-13T02:30:00Z")

test("real activity selects study over generic progress and respects weakness thresholds", () => {
  const weak = [event("2026-09-12", "RC / Precision", 20, 8, "inference")]
  assert.equal(choose(weak).type, "DAILY_RECOMMENDATION")
  assert.equal(choose(weak).metadata.skill, "inference")
  assert.equal(choose([event("2026-09-12", "RC / Precision", 19, 8)]), null)
  assert.equal(choose([event("2026-09-12", "Vocabulary", 20, 18)]).type, "PERFORMANCE_UPDATE")
})
test("recommendation follow-up and CAT exam prep require saved recommendation or exam weakness", () => {
  const history = [{ id: uid(1), type: "DAILY_RECOMMENDATION", created_at: "2026-09-10T00:00:00Z", metadata: { module: "Vocabulary" } }]
  assert.equal(choose([], { history }).type, "STUDY_REMINDER")
  assert.notEqual(choose([event("2026-09-11", "Vocabulary", 10, 8)], { history })?.type, "STUDY_REMINDER")
  const sectional = [event("2026-09-10", "CAT sectionals", 20, 8)]
  assert.equal(choose(sectional, { exam: "CAT", history: [{ type: "DAILY_RECOMMENDATION", created_at: "2026-09-12T00:00:00Z" }] }).type, "EXAM_PREP")
  assert.notEqual(choose(sectional, { exam: "Unassigned" })?.type, "EXAM_PREP")
})
test("perfect session milestone needs ten correct questions", () => {
  assert.equal(choose([event("2026-09-12", "Vocabulary", 10, 10)]).type, "MILESTONE")
  assert.notEqual(choose([event("2026-09-12", "Vocabulary", 9, 9)])?.type, "MILESTONE")
})
test("trial and account lifecycle use real expiry and subscription rows", () => {
  assert.equal(chooseInboxLifecycle({ profile, now, subscriptions: [] })?.type, "TRIAL")
  assert.equal(chooseInboxLifecycle({ profile: { ...profile, trial_expires_at: null }, now, subscriptions: [] }), null)
  const subscription = { id: uid(2), user_id: userId, plan: "monthly", created_at: "2026-09-13T00:00:00Z", expires_at: "2026-10-13T00:00:00Z" }
  assert.equal(chooseInboxLifecycle({ profile, now, subscriptions: [subscription] })?.type, "ACCOUNT")
})
test("offer requires expired trial, no active entitlement and a real active coupon", () => {
  const expired = { ...profile, trial_expires_at: "2026-09-11T00:00:00Z" }
  const offer = eligibleInboxOffer({ profile: expired, now, coupons: { REAL: { active: true, discountPercent: 20 } } })
  assert.equal(choose([], { offer }).type, "OFFER")
  assert.equal(eligibleInboxOffer({ profile, now, coupons: { REAL: { active: true, discountPercent: 20 } } }), null)
  assert.equal(eligibleInboxOffer({ profile: expired, now, coupons: { REAL: { active: false, discountPercent: 20 } } }), null)
})
test("announcements require active, targeted, explicitly configured records", () => {
  const item = { id: "release-1", type: "FEATURE_UPDATE", title: "New feature", body: "A genuine release", startsAt: "2026-09-12T00:00:00Z", endsAt: "2026-09-14T00:00:00Z", audience: { all: true }, actionUrl: "/" }
  assert.equal(inboxAnnouncements(profile, now, [item]).length, 1)
  assert.equal(inboxAnnouncements(profile, now, [{ ...item, type: "SYSTEM", id: "incident-1" }])[0].type, "SYSTEM")
  assert.equal(inboxAnnouncements(profile, now, [{ ...item, endsAt: "2026-09-12T00:00:00Z" }]).length, 0)
})
test("daily cap and duplicate keys do not suppress transactional notices", async () => {
  const db = new MemoryDb()
  const daily = choose([event("2026-09-12", "Vocabulary", 20, 18)])
  assert.ok(await createInboxNotification(db, daily))
  assert.equal(await createInboxNotification(db, { ...daily, type: "PROGRESS", idempotencyKey: "other" }), null)
  const transactional = chooseInboxLifecycle({ profile, now, subscriptions: [] })
  assert.ok(await createInboxNotification(db, transactional))
  assert.equal(await createInboxNotification(db, transactional), null)
  assert.equal(db.tables.inbox_notifications.length, 2)
})
