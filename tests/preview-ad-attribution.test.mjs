import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import {
  attributionFromParams,
  buildSignupHref,
  mergeAttribution,
  postHogAttributionProperties,
  persistBrowserAttribution,
  readBrowserAttribution,
  ATTRIBUTION_STORAGE_KEY,
  sanitizeAttributionValue,
} from '../lib/attribution.mjs'
import { classifyLeadSource } from '../lib/leadSource.mjs'

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
  assert.equal(sanitizeAttributionValue('gclid', 'Cj0KCQj_123'), 'Cj0KCQj_123')
  assert.equal(sanitizeAttributionValue('gclid', 'bad click id'), '')
  assert.equal(sanitizeAttributionValue('referrer', 'https://www.google.com/search?q=private'), 'google.com')
  assert.equal(sanitizeAttributionValue('referrer', 'mailto:student@example.com'), '')
})

test('lead source rules prioritize paid identifiers and preserve distinct organic/referral channels', () => {
  assert.equal(classifyLeadSource({ firstTouch: { utm_source: 'google', utm_medium: 'cpc', referrer: 'google.com' } }).lead_source, 'Google Ads')
  assert.equal(classifyLeadSource({ firstTouch: { utm_source: 'facebook', utm_medium: 'paid_social', referrer: 'google.com' } }).lead_source, 'Meta Ads')
  assert.equal(classifyLeadSource({ firstTouch: { gclid: 'gclid-1', referrer: 'instagram.com' } }).lead_source, 'Google Ads')
  assert.equal(classifyLeadSource({ firstTouch: { fbclid: 'fbclid-1', referrer: 'google.com' } }).lead_source, 'Meta Ads')
  assert.equal(classifyLeadSource({ firstTouch: { referrer: 'google.com' } }).lead_source, 'Organic')
  assert.equal(classifyLeadSource({ firstTouch: { utm_source: 'google', utm_medium: 'organic' } }).lead_source, 'Organic')
  assert.equal(classifyLeadSource({ firstTouch: { referrer: 'instagram.com' } }).lead_source, 'Instagram Organic')
  assert.equal(classifyLeadSource({ firstTouch: { referrer: 't.me' } }).lead_source, 'Telegram')
  assert.equal(classifyLeadSource({ firstTouch: { referrer: 'wa.me' } }).lead_source, 'WhatsApp')
  assert.equal(classifyLeadSource({ firstTouch: {}, lastTouch: {} }).lead_source, 'Direct')
  assert.equal(classifyLeadSource({ firstTouch: {}, campusAmbassador: 'CAMPUS24' }).lead_source, 'Campus Ambassador')
  assert.equal(classifyLeadSource({ firstTouch: {}, influencer: 'AUCTOR20' }).lead_source, 'Influencer')
  assert.deepEqual(classifyLeadSource({ firstTouch: { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'cat-launch' } }), {
    lead_source: 'Instagram Organic', source_detail: 'instagram', campaign: 'cat-launch', medium: 'social',
  })
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
  globalThis.document = { cookie: '_fbc=fb.1.1720000000000.click-1; _fbp=fb.1.1720000000000.12345', referrer: 'https://www.instagram.com/reel/abc' }
  try {
    const firstVisit = persistBrowserAttribution(new URLSearchParams(window.location.search))
    assert.equal(firstVisit.firstTouch.utm_source, 'instagram')
    assert.equal(firstVisit.firstTouch.fbclid, 'click-1')
    assert.equal(firstVisit.firstTouch.fbc, 'fb.1.1720000000000.click-1')
    assert.equal(firstVisit.firstTouch.fbp, 'fb.1.1720000000000.12345')
    assert.equal(firstVisit.firstTouch.campaign_id, '238901')
    assert.equal(firstVisit.firstTouch.adset_id, '238902')
    assert.equal(firstVisit.firstTouch.ad_id, '238903')
    assert.equal(firstVisit.firstTouch.referrer, 'instagram.com')

    const laterVisit = persistBrowserAttribution(new URLSearchParams('utm_source=direct&utm_campaign=home'), 'https://rc.auctorlabs.in/pricing')
    assert.equal(laterVisit.firstTouch.utm_source, 'instagram')
    assert.equal(laterVisit.firstTouch.campaign_id, '238901')
    assert.equal(laterVisit.lastTouch.utm_source, 'direct')
    assert.deepEqual(readBrowserAttribution(new URLSearchParams()).firstTouch, firstVisit.firstTouch)
    assert.ok(values.has(ATTRIBUTION_STORAGE_KEY))
    assert.deepEqual(postHogAttributionProperties(laterVisit), {
      utm_source: 'instagram',
      utm_campaign: 'launch',
      first_touch_utm_source: 'instagram',
      first_touch_utm_campaign: 'launch',
      last_touch_utm_source: 'direct',
      last_touch_utm_campaign: 'home',
      landing_referrer: 'instagram.com',
    })
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

test('preview-ad renders the inline signup and keeps testimonial assets lazy-loaded', async () => {
  const source = await readFile(new URL('../app/preview-ad/page.js', import.meta.url), 'utf8')
  const signup = await readFile(new URL('../app/preview-ad/PreviewAdSignupExperience.jsx', import.meta.url), 'utf8')
  const layout = await readFile(new URL('../app/layout.js', import.meta.url), 'utf8')
  assert.match(source, /<PreviewAdSignupExperience initialAttribution=\{signupAttribution\}/)
  assert.match(signup, /supabase\.auth\.signUp/)
  assert.match(signup, /type="email"/)
  assert.match(signup, /autoComplete="email"/)
  assert.match(signup, /autoComplete="new-password"/)
  assert.match(signup, /email: normalizedEmail/)
  assert.match(signup, /router\.replace\(buildAttributedPath\('\/welcome'/)
  assert.doesNotMatch(signup, /buildAttributedPath\('\/signup'/)
  assert.ok(layout.includes("AttributionCapture"), 'global layout captures attribution on non-preview landing routes')
  assert.match(source, /loading="lazy"/)
  assert.match(source, /Built by Neeraj Sir/)
  assert.match(source, /16\+ years teaching CAT/)
  assert.match(source, /<PreviewAdFeatureShowcase \/>/)
  assert.match(source, /PreviewAdSignupExperience initialAttribution=\{signupAttribution\} ctaOnly/)
  assert.match(signup, /focusPrimarySignup\('feature_showcase'\)/)
  assert.doesNotMatch(signup, /ad-signup-sheet|signup_sheet_opened|signup_sheet_closed/)
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
      create table auth.users(
        id uuid primary key, created_at timestamptz default now(), email text, phone text,
        raw_user_meta_data jsonb default '{}'::jsonb, raw_app_meta_data jsonb default '{}'::jsonb
      );
      create table public.profiles(
        user_id uuid primary key, name text, phone text, email text, city text, role text,
        is_premium boolean default false, premium_expires_at timestamptz, trial_expires_at timestamptz,
        signup_attribution_first_touch jsonb, signup_attribution_first_touch_at timestamptz,
        signup_attribution_last_touch jsonb, signup_attribution_last_touch_at timestamptz
      );
      create table public.student_leads(user_id uuid primary key, name_cleared boolean, phone_cleared boolean);
      create table public.subscriptions(user_id uuid, referral_code text, created_at timestamp, expires_at timestamp);
      create table public.campus_ambassadors(referral_code text);
      create table public.razorpay_payment_orders(user_id uuid, influencer_id text, status text, created_at timestamptz);
      create table public.instagram_influencers(id uuid, coupon_code text);
      create table public.daily_rc_attempts(user_id uuid, completed_at timestamptz, started_at timestamptz);
      create table public.workout_attempts(user_id uuid, mode text, completed_at timestamptz);
      create table public.speed_sessions(user_id uuid, created_at timestamptz);
      create table public.vocab_sessions(user_id uuid, created_at timestamptz);
      create table public.sectional_tests(user_id uuid, created_at timestamptz);
      create table public.mentor_test_attempts(user_id uuid, created_at timestamptz);
      insert into public.profiles(user_id) values
        ('00000000-0000-4000-8000-000000000001'),
        ('00000000-0000-4000-8000-000000000002');
      insert into auth.users(id, email, raw_user_meta_data) values
        ('00000000-0000-4000-8000-000000000001', 'student@example.org', '{}'::jsonb),
        ('00000000-0000-4000-8000-000000000002', 'other@example.org', '{}'::jsonb);
    `)
    await db.exec(await readFile(new URL('../supabase/patches/20260930_preview_ad_attribution.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/20261006021648_extend_signup_attribution_meta_identifiers.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/20261020120000_extend_student_lead_attribution.sql', import.meta.url), 'utf8'))
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", ['00000000-0000-4000-8000-000000000001'])
    await db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', [
      JSON.stringify({ utm_source: 'instagram', utm_campaign: 'launch', gclid: 'google-click-1', fbclid: 'click-1', referrer: 'google.com', fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345', campaign_id: '238901', adset_id: '238902', ad_id: '238903' }),
      JSON.stringify({ utm_source: 'instagram', utm_campaign: 'launch', gclid: 'google-click-1', fbclid: 'click-1', referrer: 'google.com', fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345', campaign_id: '238901', adset_id: '238902', ad_id: '238903' }),
    ])
    await db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', [
      JSON.stringify({ utm_source: 'facebook', utm_campaign: 'retarget' }),
      JSON.stringify({ utm_source: 'facebook', utm_campaign: 'retarget', fbclid: 'click-2' }),
    ])
    const { rows } = await db.query('select * from public.profiles where user_id=$1', ['00000000-0000-4000-8000-000000000001'])
    assert.deepEqual(rows[0].signup_attribution_first_touch, { utm_source: 'instagram', utm_campaign: 'launch', gclid: 'google-click-1', fbclid: 'click-1', referrer: 'google.com', fbc: 'fb.1.1720000000000.click-1', fbp: 'fb.1.1720000000000.12345', campaign_id: '238901', adset_id: '238902', ad_id: '238903' })
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
    const { rows: snapshotRows } = await db.query('select public.student_lead_snapshot_v2($1::uuid) as snapshot', ['00000000-0000-4000-8000-000000000001'])
    assert.equal(snapshotRows[0].snapshot.lead_source, 'Google Ads')
    assert.equal(snapshotRows[0].snapshot.source_detail, 'instagram; referrer=google.com')
    assert.equal(snapshotRows[0].snapshot.campaign, 'launch')
    assert.equal(snapshotRows[0].snapshot.medium, '')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
    await assert.rejects(db.query('select public.capture_signup_attribution($1::jsonb, $2::jsonb)', ['{}', '{}']), /Authentication required/)
  } finally {
    await db.close()
  }
})
