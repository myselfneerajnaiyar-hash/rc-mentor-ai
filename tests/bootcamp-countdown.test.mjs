import test from 'node:test'
import assert from 'node:assert/strict'
import { catDaysRemainingFromIstDate, catDaysRemaining, nextIstMidnight } from '../lib/bootcamp/countdown.mjs'

test('CAT countdown uses IST calendar-day boundaries', () => {
  assert.equal(catDaysRemainingFromIstDate('2026-10-05'), 55)
  assert.equal(catDaysRemainingFromIstDate('2026-11-28'), 1)
  assert.equal(catDaysRemainingFromIstDate('2026-11-29'), 0)
  assert.equal(catDaysRemainingFromIstDate('2026-11-30'), -1)
})

test('IST instant conversion and next-midnight scheduling follow Kolkata date', () => {
  assert.equal(catDaysRemaining(new Date('2026-10-04T18:30:00Z')), 55)
  assert.equal(catDaysRemaining(new Date('2026-11-28T18:29:59Z')), 1)
  assert.equal(catDaysRemaining(new Date('2026-11-28T18:30:00Z')), 0)
  assert.equal(catDaysRemaining(new Date('2026-11-29T18:30:00Z')), -1)
  assert.equal(nextIstMidnight(new Date('2026-11-28T18:00:00Z')), Date.parse('2026-11-28T18:30:00Z'))
})