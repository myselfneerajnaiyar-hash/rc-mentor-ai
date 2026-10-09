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
  assert.equal(calculatePlanPricing('bootcamp_full_access', { couponCode: 'AUCTOR20', validReferral: true }).finalPaise, 63920)
  assert.equal(calculatePlanPricing('cat_test_series').finalPaise, 79900)
  assert.equal(calculatePlanPricing('quarterly').finalPaise, 79900)
  assert.equal(calculatePlanPricing('quarterly', { couponCode: 'AUCTOR20' }).finalPaise, 63920)
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

test('Bootcamp home offer CTA routes through pricing while preserving campaign attribution', async () => {
  const [offer, checkout] = await Promise.all([
    readFile(new URL('../components/bootcamp/BootcampOffer.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/SubscribeButton.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(offer, /buildAttributedPath\('\/pricing', readBrowserAttribution\(\), \{ offer: 'bootcamp' \}\)/)
  assert.match(offer, /href=\{pricingHref\}>Unlock all 45 days/)
  assert.doesNotMatch(offer, /plan="bootcamp_full_access"/)
  assert.match(checkout, /attributionParams\(readBrowserAttribution\(\)\)/)
  assert.match(checkout, /\/payment-success\?\$\{successParams\.toString\(\)\}/)
})

test('the visible landing offer and sticky CTA show the server-priced Bootcamp offer and schedule context', async () => {
  const page = await readFile(new URL('../app/bootcamp-2026/page.jsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../app/bootcamp-2026/page.module.css', import.meta.url), 'utf8')
  assert.match(page, /<del>₹999<\/del>/)
  assert.match(page, /<strong>₹799<\/strong>/)
  assert.match(page, /BOOTCAMP_CALENDAR, BOOTCAMP_BUFFER_DAYS, BOOTCAMP_PROGRAM_END, bootCampDateLabel/)
  assert.match(page, /45 training days run from \{bootCampDateLabel\(BOOTCAMP_CALENDAR\[0\]\.date\)\}[\s\S]*followed by \{BOOTCAMP_BUFFER_DAYS\} buffer days through \{bootCampDateLabel\(BOOTCAMP_PROGRAM_END\)\}/)
  assert.match(page, /CAT is scheduled for \{bootCampDateLabel\(CAT_DATE\.slice\(0, 10\)\)\}/)
  assert.match(page, /<del>₹999<\/del> <strong>₹799<\/strong> full access/)
  assert.match(css, /\.sticky del/)
})

test('ineligible students are shown the Bootcamp offer before checkout; claim failures stay out of the paid state', async () => {
  const start = await readFile(new URL('../app/bootcamp-2026/start/AcquisitionStart.jsx', import.meta.url), 'utf8')
  assert.match(start, /if \(access\.canClaimFirstFree\)[\s\S]*setState\('error'\)[\s\S]*return/)
  assert.match(start, /<del>₹999<\/del>/)
  assert.match(start, /<strong>₹799<\/strong>/)
  assert.match(start, /buildAttributedPath\('\/pricing', readBrowserAttribution\(\), \{ offer: 'bootcamp' \}\)/)
  assert.match(start, /Compare the offer · Continue to pricing/)
  assert.doesNotMatch(start, /href="\/bootcamp-2026">Get Bootcamp/)
})

test('Birbal coaching is compact and dismissible without a default modal on the session entry screen', async () => {
  const [mission, css] = await Promise.all([
    readFile(new URL('../components/bootcamp/BootCampMission.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/bootcamp/bootcamp.module.css', import.meta.url), 'utf8'),
  ])
  assert.match(mission, /aria-label="Birbal's coaching note"/)
  assert.match(mission, /Dismiss Birbal's message/)
  assert.match(mission, /Show Birbal’s message/)
  assert.doesNotMatch(mission, /coachStage|speechCard|<dialog/)
  assert.match(css, /\.coachBriefing[^\n]*max-width:760px/)
  assert.match(css, /@media\(max-width:560px\)[\s\S]*?\.coachBriefing/)
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
