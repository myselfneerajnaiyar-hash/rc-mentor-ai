import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  ANNOUNCEMENT_RIBBON_SESSION_KEY,
  getAnnouncementRibbonAudience,
  getAnnouncementRibbonMessages,
  isAnnouncementRibbonExcludedPath,
  shouldShowAnnouncementRibbon,
} from "../lib/announcementRibbon.mjs"

const cat = { exam: "CAT", isCAT: true }
const catProfile = { exam: "CAT" }
const nonCat = { exam: "IPMAT", isCAT: false }
const nonCatProfile = { exam: "IPMAT" }
const noAccess = { allowed: true, source: "day1_free", firstFreeClaimed: false, canClaimFirstFree: true }
const memberAccess = { allowed: true, source: "first_free", firstFreeClaimed: true, canClaimFirstFree: false }

test("CAT prospects receive the 45-day acquisition message and public enrollment destination", () => {
  assert.equal(getAnnouncementRibbonAudience({ profile: catProfile, exam: "CAT", capabilities: cat, bootcampAccess: noAccess, bootcampAccessReady: true }), "cat_prospect")
  assert.deepEqual(getAnnouncementRibbonMessages("cat_prospect").map(({ text, href }) => [text, href]), [
    ["45 days of guided VARC practice. Try Day 1 free →", "/bootcamp-2026"],
  ])
})

test("known non-CAT users get regular practice and AUCTOR30, never Bootcamp sales copy", () => {
  assert.equal(getAnnouncementRibbonAudience({ profile: nonCatProfile, exam: "IPMAT", capabilities: nonCat, bootcampAccess: noAccess, bootcampAccessReady: true }), "non_cat")
  const messages = getAnnouncementRibbonMessages("non_cat")
  assert.deepEqual(messages.map(({ text, href }) => [text, href]), [
    ["Build your RC, vocabulary & speed. Practise daily with Auctor →", "/?view=today"],
    ["Plans are 30% off. Use AUCTOR30 →", "/pricing?coupon=AUCTOR30"],
  ])
  assert.ok(messages.every(message => !/Boot ?Camp|VARC/i.test(message.text)))
  assert.equal(getAnnouncementRibbonAudience({
    profile: nonCatProfile,
    exam: "IPMAT",
    capabilities: cat,
    bootcampAccess: noAccess,
    bootcampAccessReady: true,
  }), "non_cat", "profile exam wins over a stale CAT capability flag")
})

test("users with existing Bootcamp access get a continue action, not an acquisition offer", () => {
  for (const capabilities of [cat, nonCat]) {
    assert.equal(getAnnouncementRibbonAudience({ profile: capabilities === cat ? catProfile : nonCatProfile, exam: capabilities.exam, capabilities, bootcampAccess: memberAccess, bootcampAccessReady: true }), "bootcamp_member")
  }
  assert.deepEqual(getAnnouncementRibbonMessages("bootcamp_member").map(({ text, href }) => [text, href]), [
    ["Continue your VARC Bootcamp →", "/boot-camp"],
  ])
})

test("unknown exam or unverifiable access falls back to neutral daily practice", () => {
  for (const args of [
    { profile: { exam: "Unassigned" }, exam: "Unassigned", capabilities: { exam: "Unassigned", isCAT: false }, bootcampAccess: noAccess, bootcampAccessReady: true },
    { profile: { exam: "Something new" }, exam: "Unassigned", capabilities: { exam: "Unassigned", isCAT: false }, bootcampAccess: noAccess, bootcampAccessReady: true },
    { profile: catProfile, exam: "CAT", capabilities: cat, bootcampAccess: null, bootcampAccessReady: true },
    { profile: catProfile, exam: "CAT", capabilities: cat, bootcampAccess: noAccess, bootcampAccessReady: false },
    { profile: catProfile, exam: "IPMAT", capabilities: cat, bootcampAccess: noAccess, bootcampAccessReady: true },
  ]) assert.equal(getAnnouncementRibbonAudience(args), "neutral")
  const messages = getAnnouncementRibbonMessages("neutral")
  assert.equal(messages[0].text, "Build your RC, vocabulary & speed. Practise daily with Auctor →")
  assert.equal(messages[0].href, "/?view=today")
  assert.deepEqual(messages.map(({ text, href }) => [text, href]), [
    ["Build your RC, vocabulary & speed. Practise daily with Auctor →", "/?view=today"],
    ["Plans are 30% off. Use AUCTOR30 →", "/pricing?coupon=AUCTOR30"],
  ])
  assert.ok(messages.every(message => !/Boot ?Camp|VARC|CAT/i.test(message.text)))
})

test("shows once across supported app views and excludes activities, checkout and unrelated public routes", () => {
  for (const route of [
    "/daily-challenge/test", "/rc-session/attempt-1", "/cat-arena/test", "/test-diagnosis",
    "/shadow-test", "/birbal-test", "/boot-camp/day/1", "/bootcamp-2026/start", "/bootcamp-2026/signup",
    "/pricing", "/preview/pricing", "/checkout", "/payment", "/payment-success",
    "/login", "/signup", "/welcome", "/about", "/contact", "/preview", "/preview-ad",
  ]) assert.equal(isAnnouncementRibbonExcludedPath(route), true, `${route} is excluded`)
  assert.equal(isAnnouncementRibbonExcludedPath("/bootcamp-2026"), false)
  assert.equal(isAnnouncementRibbonExcludedPath("/"), true, "the default Home view is excluded")
  assert.equal(isAnnouncementRibbonExcludedPath("/", new URLSearchParams("view=home")), true, "the explicit Home view is excluded")
  for (const view of ["today", "workout", "rc", "precision", "vocab", "speed", "hangman", "mentor", "practice"]) {
    assert.equal(isAnnouncementRibbonExcludedPath("/", new URLSearchParams(`view=${view}`)), false, `${view} is eligible`)
  }
  assert.equal(isAnnouncementRibbonExcludedPath("/", new URLSearchParams("view=today&activity=workout")), true)
})

test("requires a signed-in user, resolved audience and no session dismissal", () => {
  const args = { pathname: "/", searchParams: new URLSearchParams("view=today"), user: { id: "student-1" }, loading: false, audience: "neutral", dismissed: false }
  assert.equal(shouldShowAnnouncementRibbon(args), true)
  assert.equal(shouldShowAnnouncementRibbon({ ...args, user: null }), false)
  assert.equal(shouldShowAnnouncementRibbon({ ...args, loading: true }), false)
  assert.equal(shouldShowAnnouncementRibbon({ ...args, audience: null }), false)
  assert.equal(shouldShowAnnouncementRibbon({ ...args, dismissed: true }), false)
  assert.equal(shouldShowAnnouncementRibbon({ ...args, searchParams: new URLSearchParams("view=home") }), false)
  assert.equal(ANNOUNCEMENT_RIBBON_SESSION_KEY, "auctor-announcement-ribbon-dismissed")
})

test("announcement ribbon uses the navy-purple app palette with accessible interaction states", async () => {
  const styles = await readFile(new URL("../components/personalized-announcement-ribbon.module.css", import.meta.url), "utf8")
  assert.match(styles, /linear-gradient\(100deg, #0b1024 0%, #1e1b4b 100%\)/)
  assert.match(styles, /\.messageLink strong,[\s\S]*?color: #a5b4fc/)
  assert.match(styles, /\.messageLink:hover,[\s\S]*?\.reducedMessage:hover/)
  assert.match(styles, /\.closeButton:hover[\s\S]*?background: rgba\(129, 140, 248, 0\.18\)/)
  assert.match(styles, /\.messageLink:focus-visible,[\s\S]*?outline: 2px solid #67e8f9/)
  assert.match(styles, /\.closeButton[\s\S]*?width: 44px[\s\S]*?height: 44px/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(styles, /#7c2d12|#9a3412/)
})
