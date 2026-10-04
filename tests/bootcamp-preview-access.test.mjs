import test from 'node:test'
import assert from 'node:assert/strict'
import { requireBootCampAccess } from '../lib/bootcamp/access.mjs'
import { BOOTCAMP_CALENDAR } from '../lib/bootcamp/calendar.mjs'

const now = new Date('2026-10-25T00:00:00Z')
const expired = { profile: { trial_expires_at: '2026-10-20T00:00:00Z' }, subscription: null }
const preview = { VERCEL_ENV: 'preview', BOOTCAMP_PREVIEW_USERS: 'tester@example.com' }

test('allowlisted Preview tester can enter with no subscription or an expired subscription', () => {
  assert.equal(requireBootCampAccess({ profile: {}, subscription: null }, { email: 'tester@example.com', env: preview, now }).kind, 'preview')
  assert.equal(requireBootCampAccess({ ...expired, subscription: { expires_at: '2026-10-20T00:00:00Z' } }, { email: 'TESTER@example.com', env: preview, now }).kind, 'preview')
})

test('non-allowlisted Preview user still needs an active entitlement', () => {
  assert.throws(() => requireBootCampAccess(expired, { email: 'student@example.com', env: preview, now }), error => error.status === 402)
})

test('Production rejects an expired allowlisted tester', () => {
  assert.throws(() => requireBootCampAccess(expired, { email: 'tester@example.com', env: { ...preview, VERCEL_ENV: 'production' }, now }), error => error.status === 402)
})

test('official Boot Camp start date remains October 5, 2026', () => {
  assert.equal(BOOTCAMP_CALENDAR[0].date, '2026-10-05')
})
