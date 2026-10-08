import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { calculatePlanPricing } from '../lib/payments/pricing.js'
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

test('Bootcamp checkout is independently server priced at ₹499 and does not change CAT Test Series', () => {
  assert.equal(calculatePlanPricing('bootcamp_full_access').finalPaise, 49900)
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

test('Bootcamp-only provisioning records a paid access source through the program end', async () => {
  const migration = await readFile(new URL('../supabase/migrations/202610080001_bootcamp_purchase_offer.sql', import.meta.url), 'utf8')
  assert.match(migration, /provision_bootcamp_payment/)
  assert.match(migration, /source = 'purchase'/)
  assert.match(migration, /2027-02-05 00:00:00\+05:30/)
})
