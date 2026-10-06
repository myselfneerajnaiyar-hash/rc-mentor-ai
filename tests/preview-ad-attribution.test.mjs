import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import {
  attributionFromParams,
  buildSignupHref,
  mergeAttribution,
  persistBrowserAttribution,
  readBrowserAttribution,
  ATTRIBUTION_STORAGE_KEY,
  sanitizeAttributionValue,
} from '../lib/attribution.mjs'

test('tracking fields are allowlisted and personal-looking values are rejected', () => {
  assert.equal(sanitizeAttributionValue('utm_campaign', 'cat-october-2026'), 'cat-october-2026')
  assert.equal(sanitizeAttributionValue('utm_source', 'student@example.com'), '')
  assert.equal(sanitizeAttributionValue('utm_term', '+91 98765 43210'), '')
  assert.equal(sanitizeAttributionValue('private_field', 'anything'), '')
  assert.equal(sanitizeAttributionValue('fbp', 'fb.1.1720000000000.12345'), 'fb.1.1720000000000.12345')
  assert.equal(sanitizeAttributionValue('campaign_id', '238901'), '238901')
  assert.equal(sanitizeAttributionValue('adset_id', '238902'), '238902')
  assert.equal(sanitizeAttributionValue('ad_id', '238903'), '238903')
  assert.equal(sanitizeAttributionValue('ad_id', 'ad id'), '')
})

test('CTA URLs go straight to signup, encode safely, and collapse duplicate query keys', () => {
  const params = new URLSearchParams('utm_source=instagram&utm_source=facebook&fbclid=abc_123&campaign_id=238901&adset_id=238902&ad_id=238903&next=wrong')
  const href = buildSignupHref(params)
  const url = new URL(href, 'https://auctorlabs.in')
  assert.equal(url.pathname, '/signup')
  assert.equal(url.searchParams.getAll('utm_source').length, 1)
  assert.equal(url.searchParams.get('utm_source'), 'instagram')
  assert.equal(url.searchParams.get('fbclid'), 'abc_123')
  assert.equal(url.searchParams.get('campaign_id'), '238901')
  assert.equal(url.searchParams.get('adset_id'), '238902')
  assert.equal(url.searchParams.get('ad_id'), '238903')
  assert.equal(url.searchParams.get('next'), null)
  assert.equal(url.searchParams.get('first_utm_source'), 'instagram')
})

test('global page capture stores UTM, click IDs, Meta cookies, and first touch across routes', () => {
  const values = new Map()
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document
  globalThis.window = {
    location: { search: '?utm_source=instagram&utm_campaign=launch&fbclid=click-1&campaign_id=238901&adset_id=238902&ad_id=238903' },
    localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) },
  }
  globalThis.document = { cookie: '_fbc=fb.1.1720000000000.click-1; _fbp=fb.1.1720000000000.12345' }
  try {
    const firstVisit = persistBrowserAttribution(new URLSearchParams(window.location.search))
    assert.equal(firstVisit.firstTouch.utm_source, 'instagram')
    assert.equal(firstVisit.firstTouch.fbclid, 'click-1')
    assert.equal(firstVisit.firstTouch.fbc, 'fb.1.1720000000000.click-1')
    assert.equal(firstVisit.firstTouch.fbp, 'fb.1.1720000000000.12345')
    assert.equal(firstVisit.firstTouch.campaign_id, '238901')
    assert.equal(firstVisit.firstTouch.adset_id, '238902')
    assert.equal(firstVisit.firstTouch.ad_id, '238903')

    const laterVisit = persistBrowserAttribution(new URLSearchParams('utm_source=direct&utm_campaign=home'))
    assert.equal(laterVisit.firstTouch.utm_source, 'instagram')
    assert.equal(laterVisit.firstTouch.campaign_id, '238901')
    assert.equal(laterVisit.lastTouch.utm_source, 'direct')
    assert.deepEqual(readBrowserAttribution(new URLSearchParams()).firstTouch, firstVisit.firstTouch)
    assert.ok(values.has(ATTRIBUTION_STORAGE_KEY))
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
    if (originalDocument === undefined) delete globalThis.document
    else globalThis.document = originalDocument
  }
})

test('repeat campaign visits retain first touch and replace last touch', () => {
  const first = attributionFromParams(new URLSearchParams('utm_source=instagram&utm_campaign=launch&campaign_id=238901&adset_id=238902&ad_id=238903'))
  const repeated = mergeAttribution(
    new URLSearchParams('utm_source=facebook&utm_campaign=retarget&fbclid=click-2'),
    first,
  )
  assert.deepEqual(repeated.firstTouch, { utm_source: 'instagram', utm_campaign: 'launch', campaign_id: '238901', adset_id: '238902', ad_id: '238903' })
  assert.deepEqual(repeated.lastTouch, { utm_source: 'facebook', utm_campaign: 'retarget', fbclid: 'click-2' })
})

test('available Meta cookies are retained without inferring traffic source from missing click ids', () => {
  const fromMetaCookie = mergeAttribution(new URLSearchParams('utm_medium=paid_social'), null, {
    fbc: 'fb.1.1720000000000.click-1',
    fbp: 'fb.1.1720000000000.12345',
  })
  assert.equal(fromMetaCookie.lastTouch.fbc, 'fb.1.1720000000000.click-1')
  assert.equal(fromMetaCookie.lastTouch.fbp, 'fb.1.1720000000000.12345')
  assert.equal(mergeAttribution(new URLSearchParams(), null).lastTouch.fbclid, undefined)
  const storedTouch = mergeAttribution(new URLSearchParams(), {
    firstTouch: { utm_source: 'instagram', fbclid: 'click-1' },
    lastTouch: { utm_source: 'instagram', utm_campaign: 'launch', fbclid: 'click-1' },
  }, { fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345' })
  assert.deepEqual(storedTouch.lastTouch, {
    utm_source: 'instagram', utm_campaign: 'launch', fbclid: 'click-1',
    fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345',
  })
})

test('landing page CTAs use a server-rendered href and testimonial photos are lazy-loaded', async () => {
  const source = await readFile(new URL('../app/preview-ad/page.js', import.meta.url), 'utf8')
  const layout = await readFile(new URL('../app/layout.js', import.meta.url), 'utf8')
  assert.match(source, /href=\{signupHref\} data-signup-cta/g)
  assert.equal((source.match(/href=\{signupHref\} data-signup-cta/g) || []).length, 1)
  assert.ok(layout.includes("AttributionCapture"), 'global layout captures attribution on non-preview landing routes')
  assert.match(source, /loading="lazy"/)
  assert.doesNotMatch(source, /onClick=.*signup/i)
})

test('prepared profile RPC is atomic, first-touch preserving, user scoped, and rejects unsafe data', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create schema auth;
      create role anon;
      create role authenticated;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.profiles(user_id uuid primary key);
      insert into public.profiles(user_id) values
        ('00000000-0000-4000-8000-000000000001'),
        ('00000000-0000-4000-8000-000000000002');
    `)
    await db.exec(await readFile(new URL('../supabase/patches/20260930_preview_ad_attribution.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/20261006021648_extend_signup_attribution_meta_identifiers.sql', import.meta.url), 'utf8'))
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", ['00000000-0000-4000-8000-000000000001'])
    await db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', [
      JSON.stringify({ utm_source: 'instagram', utm_campaign: 'launch', fbclid: 'click-1', fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345', campaign_id: '238901', adset_id: '238902', ad_id: '238903' }),
      JSON.stringify({ utm_source: 'instagram', utm_campaign: 'launch', fbclid: 'click-1', fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345', campaign_id: '238901', adset_id: '238902', ad_id: '238903' }),
    ])
    await db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', [
      JSON.stringify({ utm_source: 'facebook', utm_campaign: 'retarget' }),
      JSON.stringify({ utm_source: 'facebook', utm_campaign: 'retarget', fbclid: 'click-2' }),
    ])
    const { rows } = await db.query('select * from public.profiles where user_id=$1', ['00000000-0000-4000-8000-000000000001'])
    assert.deepEqual(rows[0].signup_attribution_first_touch, { utm_source: 'instagram', utm_campaign: 'launch', fbclid: 'click-1', fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345', campaign_id: '238901', adset_id: '238902', ad_id: '238903' })
    assert.deepEqual(rows[0].signup_attribution_last_touch, { utm_source: 'facebook', utm_campaign: 'retarget', fbclid: 'click-2' })
    const other = await db.query('select signup_attribution_first_touch from public.profiles where user_id=$1', ['00000000-0000-4000-8000-000000000002'])
    assert.equal(other.rows[0].signup_attribution_first_touch, null)
    await assert.rejects(db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', [
      JSON.stringify({ utm_source: 'student@example.com' }), '{}',
    ]), /Invalid attribution value/)
    const { rows: privileges } = await db.query(`select
      has_function_privilege('anon', 'public.capture_signup_attribution(jsonb,jsonb)', 'execute') as anon_can,
      has_function_privilege('authenticated', 'public.capture_signup_attribution(jsonb,jsonb)', 'execute') as auth_can`)
    assert.equal(privileges[0].anon_can, false)
    assert.equal(privileges[0].auth_can, true)
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
    await assert.rejects(db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', ['{}', '{}']), /Authentication required/)
  } finally {
    await db.close()
  }
})
