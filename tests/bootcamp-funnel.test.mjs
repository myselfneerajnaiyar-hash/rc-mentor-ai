import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { BOOTCAMP_ORIGINAL_PRICE_PAISE, BOOTCAMP_PAYABLE_PRICE_PAISE, calculatePlanPricing } from '../lib/payments/pricing.js'
import { getOnboardingDestination } from '../lib/onboarding/returnDestination.mjs'
import { fixture, harness, student } from './helpers/bootcamp-db.mjs'

test('first-free access exposes Day 1 and blocks later days at the service boundary', async () => {
  const h = await harness(fixture(), undefined, undefined, { now: () => new Date('2026-10-10T06:00:00Z'), freeDayOnly: true })
  try {
    await h.service.enroll(student)
    const home = await h.service.home(student)
    assert.equal(home.days[0].accessible, true)
    assert.equal(home.days[1].accessible, false)
    assert.equal(home.days[1].state, 'LOCKED')
    await assert.rejects(h.service.start(student, 2), error => error.status === 402)
    assert.ok((await h.service.start(student, 1)).id)
  } finally { await h.close() }
})

test('Bootcamp checkout is independently server priced at ₹799 with ₹999 reference price and does not change CAT Test Series', () => {
  const bootcamp = calculatePlanPricing('bootcamp_full_access')
  assert.equal(bootcamp.originalPaise, BOOTCAMP_ORIGINAL_PRICE_PAISE)
  assert.equal(bootcamp.finalPaise, BOOTCAMP_PAYABLE_PRICE_PAISE)
  assert.equal(calculatePlanPricing('bootcamp_full_access', { couponCode: 'AZADI50', validReferral: true }).finalPaise, 79900)
  assert.equal(calculatePlanPricing('cat_test_series').finalPaise, 79900)
  assert.equal(calculatePlanPricing('quarterly').finalPaise, 99900)
})

test('landing signup keeps ad query parameters and existing CTA event locations', async () => {
  const [page, cta, signup] = await Promise.all([
    readFile(new URL('../app/bootcamp-2026/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/bootcamp/BootcampAccessCTA.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/bootcamp-2026/signup/page.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(page, /location="hero"/)
  assert.match(page, /location="price"/)
  assert.match(page, /location="final"/)
  assert.match(page, /location="sticky"/)
  assert.match(cta, /bootcamp_cta_click/)
  assert.match(cta, /new URLSearchParams\(window\.location\.search\)/)
  assert.match(cta, /bootcamp-2026\/signup/)
  assert.match(signup, /SignupPage/)
})

test('Bootcamp profile completion resolves directly to the Bootcamp home and normal signup keeps its default', () => {
  assert.equal(getOnboardingDestination('bootcamp'), '/boot-camp')
  assert.equal(getOnboardingDestination(null), '/')
})

test('Bootcamp intent survives signup and OAuth callback into the profile flow', async () => {
  const [signup, login, callback, welcome] = await Promise.all([
    readFile(new URL('../app/signup/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/login/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/auth/callback/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/welcome/page.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(signup, /params\.set\("next", next\)/)
  assert.match(signup, /emailRedirectTo:.*callbackPath/)
  assert.match(login, /params\.set\("next", next\)/)
  assert.match(callback, /destination\.searchParams\.set\("next", requestUrl\.searchParams\.get\("next"\) \|\| ""\)/)
  assert.match(welcome, /next === "bootcamp"\) \{\s*await continueBootcampAcquisition\(\)/)
})

test('onboarding return destination only accepts known destinations', () => {
  assert.equal(getOnboardingDestination('https://example.com'), '/')
  assert.equal(getOnboardingDestination('//example.com/path'), '/')
  assert.equal(getOnboardingDestination('/boot-camp'), '/')
  assert.equal(getOnboardingDestination('constructor'), '/')
  assert.equal(getOnboardingDestination('cat', '1'), '/?view=cat&free=1')
})

test('Bootcamp profile completion claims existing access then replaces directly with the Bootcamp home', async () => {
  const welcome = await readFile(new URL('../app/welcome/page.jsx', import.meta.url), 'utf8')
  assert.match(welcome, /fetch\("\/api\/bootcamp\/access\/claim"/)
  assert.match(welcome, /router\.replace\(getOnboardingDestination\("bootcamp"\)\)/)
  assert.doesNotMatch(welcome, /buildAttributedPath\("\/bootcamp-2026\/start"/)
})

test('Bootcamp-only provisioning records a paid access source through the program end', async () => {
  const migration = await readFile(new URL('../supabase/migrations/202610080001_bootcamp_purchase_offer.sql', import.meta.url), 'utf8')
  assert.match(migration, /provision_bootcamp_payment/)
  assert.match(migration, /source = 'purchase'/)
  assert.match(migration, /2027-02-05 00:00:00\+05:30/)
})
