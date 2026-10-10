import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { getTrialBannerState, trialBannerDismissalKey } from "../lib/tenant/trialBanner.js"
import { getEffectiveEntitlement } from "../lib/tenant/entitlement.js"

const start = Date.parse("2026-10-01T00:00:00.000Z")
const day = 24 * 60 * 60 * 1000
const trial = {
  trialStartedAt: new Date(start).toISOString(),
  trialExpiresAt: new Date(start + 3 * day).toISOString(),
}
const at = elapsed => new Date(start + elapsed).toISOString()

test("trial day boundaries use elapsed 24-hour periods", () => {
  assert.equal(getTrialBannerState({ ...trial, now: at(0) }).type, "offer")
  assert.equal(getTrialBannerState({ ...trial, now: at(day - 1) }).type, "offer")
  assert.deepEqual(getTrialBannerState({ ...trial, now: at(day) }), {
    type: "offer", day: 2, startedAt: trial.trialStartedAt, expiresAt: trial.trialExpiresAt,
  })
  // On a three-day trial, the ending-soon state takes priority as Day 3 begins.
  assert.equal(getTrialBannerState({ ...trial, now: at(2 * day) }).type, "ending")
  assert.equal(getTrialBannerState({ ...trial, now: at(3 * day) }).type, "expired")
})

test("expiry within 24 hours outranks Day 2/3 and expired outranks expiry reminder", () => {
  assert.equal(getTrialBannerState({ ...trial, now: at(2 * day + 1) }).type, "ending")
  assert.equal(getTrialBannerState({ ...trial, now: at(3 * day) }).type, "expired")
})

test("paid and institute entitlements suppress every promotional state", () => {
  for (const entitlement of [
    { isPremium: true, kind: "subscription" },
    { isPremium: true, kind: "premium" },
    { hasAccess: true, kind: "subscription" },
    { isInstituteStudent: true, kind: "institute" },
  ]) {
    assert.equal(getTrialBannerState({ ...trial, now: at(2 * day), entitlement }).type, "none")
  }
})

test("every user without paid or institute access sees the AUCTOR20 offer regardless of trial metadata", () => {
  for (const options of [
    { now: at(0) },
    { now: at(day), ...trial },
    { now: at(4 * day), ...trial },
    { now: at(day), trialStartedAt: "invalid", trialExpiresAt: "invalid" },
    { now: null },
  ]) {
    assert.notEqual(getTrialBannerState(options).type, "none")
  }
})

test("malformed explicit premium expiry does not grant indefinite entitlement; legacy null expiry is preserved", () => {
  const now = at(day)
  const resolvedTenant = { ok: true, kind: "b2c" }
  assert.equal(getEffectiveEntitlement({ profile: { is_premium: true, premium_expires_at: "invalid" }, resolvedTenant, now }).kind, "restricted")
  assert.equal(getEffectiveEntitlement({ profile: { is_premium: true, premium_expires_at: null }, resolvedTenant, now }).kind, "premium")
})

test("unknown, null, invalid, and future trial metadata falls back to the generic unpaid offer", () => {
  assert.equal(getTrialBannerState({ trialExpiresAt: trial.trialExpiresAt, now: at(day) }).type, "offer")
  assert.equal(getTrialBannerState({ ...trial, trialStartedAt: "invalid", now: at(day) }).type, "offer")
  assert.equal(getTrialBannerState({ ...trial, trialStartedAt: at(day), now: at(0) }).type, "offer")
  assert.equal(getTrialBannerState({ trialStartedAt: null, trialExpiresAt: null, now: at(day) }).type, "offer")
  assert.equal(getTrialBannerState({ ...trial, trialExpiresAt: "invalid", now: at(day) }).type, "offer")
})

test("dismissal key changes with banner state so state changes are not hidden", () => {
  const day2 = getTrialBannerState({ ...trial, now: at(day) })
  const day3 = getTrialBannerState({ ...trial, now: at(2 * day) })
  assert.notEqual(trialBannerDismissalKey(day2), trialBannerDismissalKey(day3))
  assert.equal(trialBannerDismissalKey(getTrialBannerState({ ...trial, now: at(0) })), "trial-conversion:offer:unknown")
})

test("welcome flow preserves existing trial dates and database migration avoids legacy backfill", async () => {
  const welcome = await readFile(new URL("../app/welcome/page.jsx", import.meta.url), "utf8")
  const migration = await readFile(new URL("../supabase/migrations/202610020001_trial_started_at.sql", import.meta.url), "utf8")
  assert.match(welcome, /const startTrial = !existingProfile \|\| \(!existingProfile\.trial_expires_at && !existingProfile\.trial_started_at\)/)
  assert.match(welcome, /\.select\("id,trial_started_at,trial_expires_at"\)/)
  assert.match(migration, /add column if not exists trial_started_at timestamptz/i)
  assert.match(migration, /Existing trials are intentionally not backfilled/i)
  assert.match(migration, /statement_timestamp\(\)/i)
})

test("banner uses session-only dismissal and pricing query preserves the validated code", async () => {
  const component = await readFile(new URL("../components/TrialConversionBanner.jsx", import.meta.url), "utf8")
  assert.match(component, /sessionStorage\.setItem\(dismissalKey/)
  assert.match(component, /\/pricing\?coupon=/)
  assert.match(component, /result\.discountPercent/)
})
