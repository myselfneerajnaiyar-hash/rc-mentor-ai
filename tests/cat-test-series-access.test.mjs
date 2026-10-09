import test from 'node:test'
import assert from 'node:assert/strict'
import { hasCATTestSeriesAccess } from '../lib/tenant/catTestSeriesAccess.js'

const now = new Date('2026-10-09T00:00:00Z')

test('active CAT Test Series access works alongside a separate quarterly subscription', () => {
  const subscriptions = [
    { plan: 'cat_test_series', expires_at: '2027-10-08T21:37:40.080Z' },
    { plan: 'quarterly', expires_at: '2027-01-09T01:16:11.183Z' },
  ]
  assert.equal(hasCATTestSeriesAccess(subscriptions, now), true)
})

test('only active CAT Test Series and existing full CAT plans unlock paid tests', () => {
  assert.equal(hasCATTestSeriesAccess([{ plan: 'quarterly', expires_at: '2027-01-09T00:00:00Z' }], now), false)
  assert.equal(hasCATTestSeriesAccess([{ plan: 'cat_test_series', expires_at: '2026-10-08T00:00:00Z' }], now), false)
  assert.equal(hasCATTestSeriesAccess([{ plan: 'half_yearly', expires_at: '2027-01-01T00:00:00Z' }], now), true)
  assert.equal(hasCATTestSeriesAccess([{ plan: 'yearly', expires_at: '2027-10-01T00:00:00Z' }], now), true)
})
