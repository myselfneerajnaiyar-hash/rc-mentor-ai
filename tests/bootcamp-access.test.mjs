import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { claimFirstFreeBootcamp, getBootCampAccess } from '../lib/bootcamp/access.mjs'
import { createHandler } from '../lib/bootcamp/api.mjs'
import { BootCampError } from '../lib/bootcamp/content.mjs'

const now = new Date('2026-10-07T12:00:00.000Z')
const future = '2026-11-07T12:00:00.000Z'
const past = '2026-10-06T12:00:00.000Z'

function fakeDb({ subscriptions = [], claim = null } = {}) {
  const state = {
    subscriptions: subscriptions.map(row => ({ user_id: 'student-1', ...row })),
    claim: claim ? { user_id: 'student-1', program_key: 'bootcamp', ...claim } : null,
    touchedTables: [],
  }
  return {
    state,
    from(table) {
      state.touchedTables.push(table)
      const filters = []
      let inserted = null
      const query = {
        select() { return query },
        eq(column, value) { filters.push(row => row[column] === value); return query },
        in(column, values) { filters.push(row => values.includes(row[column])); return query },
        gt(column, value) { filters.push(row => row[column] > value); return query },
        order() { return query },
        insert(row) { inserted = row; return query },
        maybeSingle() {
          if (inserted) {
            if (state.claim) return Promise.resolve({ data: null, error: { code: '23505' } })
            state.claim = { ...inserted }
            return Promise.resolve({ data: state.claim, error: null })
          }
          const rows = table === 'subscriptions' ? state.subscriptions : table === 'bootcamp_access' ? [state.claim].filter(Boolean) : []
          return Promise.resolve({ data: rows.filter(row => filters.every(filter => filter(row)))[0] || null, error: null })
        },
        then(resolve, reject) {
          const rows = table === 'subscriptions' ? state.subscriptions : []
          return Promise.resolve({ data: rows.filter(row => filters.every(filter => filter(row))), error: null }).then(resolve, reject)
        },
      }
      return query
    },
  }
}

async function access(db, profile = {}) {
  return getBootCampAccess(db, { userId: 'student-1', profile, resolvedTenant: { ok: true, kind: 'b2c' }, now })
}

test('new user can atomically claim the first free Bootcamp; a repeat claim is denied', async () => {
  const db = fakeDb()
  const initial = await access(db)
  assert.deepEqual(initial, { allowed: false, source: null, expiresAt: null, firstFreeClaimed: false, canClaimFirstFree: true })
  assert.equal((await claimFirstFreeBootcamp(db, 'student-1', now)).claimed, true)
  const after = await access(db)
  assert.equal(after.allowed, true)
  assert.equal(after.source, 'first_free')
  assert.equal(after.firstFreeClaimed, true)
  assert.equal(after.canClaimFirstFree, false)
  assert.ok(Date.parse(after.expiresAt) > now.getTime())
  assert.equal((await claimFirstFreeBootcamp(db, 'student-1', now)).claimed, false)
  assert.equal((await access(db)).allowed, true)
})

for (const plan of ['monthly', 'quarterly', 'half_yearly', 'yearly']) {
  test(`${plan} active subscription grants Bootcamp access`, async () => {
    const result = await access(fakeDb({ subscriptions: [{ plan, expires_at: future }] }))
    assert.equal(result.allowed, true)
    assert.equal(result.source, 'subscription')
    assert.equal(result.expiresAt, future)
  })
}

test('expired monthly subscription with an expired first-free claim is denied', async () => {
  const result = await access(fakeDb({ subscriptions: [{ plan: 'monthly', expires_at: past }], claim: { source: 'first_free', claimed_at: past, expires_at: past } }))
  assert.equal(result.allowed, false)
  assert.equal(result.firstFreeClaimed, true)
  assert.equal(result.canClaimFirstFree, false)
})

test('expired monthly subscription with an expired claimed entitlement is denied permanently', async () => {
  const result = await access(fakeDb({ subscriptions: [{ plan: 'monthly', expires_at: past }], claim: { source: 'first_free', claimed_at: past, expires_at: past } }))
  assert.equal(result.allowed, false)
  assert.equal(result.firstFreeClaimed, true)
  assert.equal(result.canClaimFirstFree, false)
})

test('active CAT Test Series entitlement grants Bootcamp access', async () => {
  const result = await access(fakeDb({ subscriptions: [{ plan: 'cat_test_series', expires_at: future }] }))
  assert.equal(result.allowed, true)
  assert.equal(result.source, 'test_series')
  assert.equal(result.expiresAt, future)
})

test('an expired subscription leaves an unused first free claim available', async () => {
  const result = await access(fakeDb({ subscriptions: [{ plan: 'quarterly', expires_at: past }] }))
  assert.equal(result.allowed, false)
  assert.equal(result.canClaimFirstFree, true)
})

test('subscription access takes precedence while retaining first-free claim history', async () => {
  const result = await access(fakeDb({ subscriptions: [{ plan: 'monthly', expires_at: future }], claim: { source: 'first_free', claimed_at: past, expires_at: null } }))
  assert.equal(result.source, 'subscription')
  assert.equal(result.firstFreeClaimed, true)
  assert.equal(result.canClaimFirstFree, false)
})

test('institute access has precedence over subscriptions and first-free claims', async () => {
  const db = fakeDb({ subscriptions: [{ plan: 'monthly', expires_at: future }], claim: { source: 'first_free', claimed_at: past, expires_at: null } })
  const result = await getBootCampAccess(db, { userId: 'student-1', profile: { institute_id: 'inst-1' }, resolvedTenant: { ok: true, kind: 'institute', institute: { id: 'inst-1' } }, now })
  assert.equal(result.source, 'institute')
})

test('simultaneous first-free claims create exactly one entitlement', async () => {
  const db = fakeDb()
  const results = await Promise.all([
    claimFirstFreeBootcamp(db, 'student-1', now),
    claimFirstFreeBootcamp(db, 'student-1', now),
  ])
  assert.equal(results.filter(result => result.claimed).length, 1)
  assert.equal(db.state.claim.source, 'first_free')
})

test('claim writes only the separate Bootcamp access record; the regular 3-day trial remains untouched', async () => {
  const db = fakeDb()
  const profile = { is_premium: false, premium_expires_at: null, trial_started_at: '2026-10-07T00:00:00Z', trial_expires_at: '2026-10-10T00:00:00Z' }
  const before = structuredClone(profile)
  await claimFirstFreeBootcamp(db, 'student-1', now)
  assert.deepEqual(db.state.touchedTables, ['bootcamp_access'])
  assert.deepEqual(profile, before)
  assert.equal((await access(db, profile)).source, 'first_free')
})

test('protected Bootcamp API returns 402 without access and serves the operation with active access', async () => {
  const service = { home: async () => ({ enrolled: true }), start: async (_user, day) => ({ day }) }
  const handler = createHandler(service, async request => {
    const db = request.headers.get('x-active') === 'yes'
      ? fakeDb({ subscriptions: [{ plan: 'monthly', expires_at: future }] })
      : fakeDb()
    const result = await access(db)
    if (!result.allowed) throw new BootCampError('Boot Camp access is locked.', 402)
    return { id: 'student-1' }
  })
  assert.equal((await handler(new Request('https://app.test/api/bootcamp', { method: 'GET' }), 'home')).status, 402)
  assert.equal((await handler(new Request('https://app.test/api/bootcamp/days/1/start', { method: 'POST' }), 'start', { day: 1 })).status, 402)
  const allowed = await handler(new Request('https://app.test/api/bootcamp', { headers: { 'x-active': 'yes' } }), 'home')
  assert.equal(allowed.status, 200)
  assert.deepEqual(await allowed.json(), { enrolled: true })
  const allowedDay = await handler(new Request('https://app.test/api/bootcamp/days/1/start', { method: 'POST', headers: { 'x-active': 'yes' } }), 'start', { day: 1 })
  assert.equal(allowedDay.status, 200)
  assert.deepEqual(await allowedDay.json(), { day: 1 })
  const dayRoute = await readFile(new URL('../app/api/bootcamp/days/1/start/route.js', import.meta.url), 'utf8')
  assert.match(dayRoute, /handleBootCamp\(request,'start'\)/)
})

test('acquisition redirects preserve attribution, profile flow, and existing 3-day trial fields', async () => {
  const [signup, login, welcome, callback, migration] = await Promise.all([
    readFile(new URL('../app/signup/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/login/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/welcome/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/auth/callback/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/migrations/202610070002_bootcamp_first_free_access.sql', import.meta.url), 'utf8'),
  ])
  assert.match(signup, /buildAttributedPath\("\/welcome", attribution, \{ next, free \}\)/)
  assert.match(login, /buildAttributedPath\("\/welcome".*\{ next, free \}\)/)
  assert.match(welcome, /continueBootcampAcquisition/)
  assert.match(welcome, /trial_days: 3/)
  assert.match(welcome, /trial_expires_at: new Date\(\)\.toISOString\(\)/)
  assert.match(callback, /attributionParams/)
  assert.match(migration, /primary key \(user_id, program_key\)/)
  assert.match(migration, /enable row level security/)
})
