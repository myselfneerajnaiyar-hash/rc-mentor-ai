import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getExamCapabilities } from '../lib/tenant/capabilities.js'
import { getBootCampHomeBannerState, getBootCampHomeCardVariant, hasPaidBootCampAccess } from '../lib/bootcamp/presentation.mjs'

const source = async path => readFile(new URL(path, import.meta.url), 'utf8')

test('CAT users see the Boot Camp homepage card before the requested desktop sections', async () => {
  const home = await source('../components/home-v2/ShadowHomeView.jsx')
  const bootcamp = home.indexOf('{isCAT && <BootCampHomeCard')
  const activities = home.indexOf('<TodayActivity')
  const premium = home.indexOf('<PremiumFeatures')
  const testSeries = home.indexOf('<TestSeriesHero')
  assert.ok(bootcamp >= 0 && bootcamp < activities && activities < premium && premium < testSeries)
  assert.match(home, /\{isCAT && <BootCampHomeCard userId=\{user\?\.id\} \/>\}/)
  assert.equal(getExamCapabilities('CAT').isCAT, true)
  assert.equal(getExamCapabilities('XAT').isCAT, false)
})

test('mobile home places the same CAT-only card before activities and promotional sections', async () => {
  const mobile = await source('../components/mobile/MobileHome.jsx')
  const card = mobile.indexOf('{capabilities.isCAT&&<BootCampHomeCard')
  const banner = mobile.indexOf('<TrialConversionBanner')
  const activities = mobile.indexOf('className="mobile-home-daily"')
  assert.ok(card >= 0 && card < banner && banner < activities)
  assert.match(mobile, /capabilities\.isCAT&&<BootCampHomeCard/)
})

test('desktop and mobile navigation add the Boot Camp route only for CAT users', async () => {
  const [desktop, mobile] = await Promise.all([
    source('../app/page.js'),
    source('../app/components/MobileBottomNav.jsx'),
  ])
  const nav = desktop.slice(desktop.indexOf('const navItems'), desktop.indexOf('];', desktop.indexOf('const navItems')))
  assert.ok(nav.indexOf('{ id: "home"') < nav.indexOf('capabilities.isCAT ? [{ id: "bootcamp"'))
  assert.ok(nav.indexOf('capabilities.isCAT ? [{ id: "bootcamp"') < nav.indexOf('{ id: "workout"'))
  assert.match(desktop, /if \(item\.id === "bootcamp"\) \{\s*router\.push\("\/boot-camp"\)/)
  assert.match(mobile, /capabilities\.isCAT\?\[baseTabs\[0\],\['bootcamp','Boot Camp',Trophy,'\/boot-camp'\]/)
  assert.match(mobile, /data-tab-count=\{tabs\.length\}/)
})

test('home card retains its screenshot structure, server state, pricing, and attributed routes', async () => {
  const card = await source('../components/bootcamp/BootCampHomeCard.jsx')
  for (const text of [
    'JUST LAUNCHED', 'AUCTOR VARC BOOT CAMP', 'Guided practice', 'Gap analysis', 'Fix-it plan',
    'Included in your plan', 'LAUNCH', 'All 45 days', '₹999', '₹799', 'SAVE ₹200',
  ]) assert.ok(card.includes(text), `missing banner copy: ${text}`)
  assert.match(card, /getBootCampHomeBannerState\(access,catalog\)/)
  assert.match(card, /banner\.href\}\$\{routes\.query\}/)
  assert.match(card, /buildAttributedPath\('\/pricing',readBrowserAttribution\(\),\{offer:'bootcamp'\}\)/)
  assert.match(card, /bootcampRequest\(\)/)
  assert.match(card, /bootcampRequest\('\/access'\)/)
})

test('banner variant follows current server-provided Boot Camp entitlement', () => {
  for (const source of ['subscription', 'test_series', 'institute', 'purchase']) {
    const activeAccess = { allowed: true, source }
    assert.equal(hasPaidBootCampAccess(activeAccess), true)
    assert.equal(getBootCampHomeCardVariant(activeAccess), 'included')
  }
  for (const access of [
    { allowed: true, source: 'day1_free' },
    { allowed: true, source: 'first_free' },
    { allowed: false, source: 'subscription' },
    null,
  ]) {
    assert.equal(hasPaidBootCampAccess(access), false)
    assert.equal(getBootCampHomeCardVariant(access), 'offer')
  }
})

const progressDay = (day, overrides = {}) => ({
  day, status: 'not_started', accessible: true, contentAvailable: true,
  releaseDate: `2026-10-${String(day + 9).padStart(2, '0')}`,
  ...overrides,
})
const catalog = (days, { today = '2026-10-12', todayDay = 3, sequenceMode = 'calendar', personalDay = null } = {}) => ({
  days, sequenceMode, personalDay, calendar: { today, todayDay, period: 'TRAINING' },
})

test('paid progress selects the next accessible incomplete day after completed days', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, catalog([
    progressDay(1, { status: 'completed' }), progressDay(2, { status: 'completed' }), progressDay(3, { isToday: true }),
  ]))
  assert.equal(state.kind, 'day')
  assert.equal(state.day, 3)
  assert.equal(state.cta, 'Start Day 3')
  assert.equal(state.href, '/boot-camp/day/3')
})

test('paid user resumes an accessible incomplete day rather than a completed scheduled day', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'purchase' }, catalog([
    progressDay(1, { status: 'completed' }), progressDay(2, { status: 'in_progress' }),
    progressDay(3, { status: 'completed', isToday: true }),
  ]))
  assert.equal(state.kind, 'resume')
  assert.equal(state.day, 2)
  assert.equal(state.cta, 'Continue Day 2')
})

test('unpaid user who has not completed Day 1 gets the real free Day 1 route', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'day1_free' }, catalog([
    progressDay(1), progressDay(2), progressDay(3),
  ]))
  assert.equal(state.kind, 'free-day')
  assert.equal(state.cta, 'Start Day 1 Free')
  assert.equal(state.href, '/boot-camp/day/1')
})

test('unpaid user who completed Day 1 sees current scheduled day and purchase CTA', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'first_free' }, catalog([
    progressDay(1, { status: 'completed' }), progressDay(2), progressDay(3, { isToday: true }),
  ]))
  assert.equal(state.kind, 'scheduled')
  assert.equal(state.headline, 'Day 3 is live.')
  assert.equal(state.cta, 'Unlock Boot Camp')
  assert.equal(state.href, '/pricing?offer=bootcamp')
  assert.doesNotMatch(state.message, /free/i)
})

test('completed scheduled day offers its report when no accessible incomplete day remains', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, catalog([
    progressDay(1, { status: 'completed' }), progressDay(2, { status: 'completed', isToday: true }),
    progressDay(3, { accessible: false, releaseDate: '2026-10-13' }),
  ], { todayDay: 2 }))
  assert.equal(state.kind, 'report')
  assert.equal(state.cta, 'View Day 2 Report')
  assert.equal(state.href, '/boot-camp/day/2/report')
})

test('upcoming and unpublished days use the calendar route without linking to unavailable content', () => {
  const upcoming = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, catalog([
    progressDay(1, { status: 'completed' }),
    progressDay(2, { accessible: false, contentAvailable: false, releaseDate: '2026-10-13' }),
  ], { today: '2026-10-12', todayDay: 3 }))
  assert.equal(upcoming.kind, 'upcoming')
  assert.equal(upcoming.headline, 'Day 2 is upcoming.')
  assert.equal(upcoming.href, '/boot-camp')

  const unpublished = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, catalog([
    progressDay(1, { status: 'completed' }),
    progressDay(2, { accessible: false, contentAvailable: false, releaseDate: '2026-10-11' }),
  ]))
  assert.equal(unpublished.kind, 'preparing')
  assert.equal(unpublished.headline, 'Day 2 is being prepared.')
  assert.equal(unpublished.destination, 'calendar')
})

test('completed latest day stays reviewable while the next scheduled day is upcoming', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, catalog([
    progressDay(1, { status: 'completed', isToday: true }),
    progressDay(2, { accessible: false, contentAvailable: false, releaseDate: '2026-10-11' }),
  ], { today: '2026-10-10', todayDay: 1 }))
  assert.equal(state.kind, 'report')
  assert.equal(state.cta, 'View Day 1 Report')
  assert.match(state.message, /Day 2 is upcoming/)
  assert.equal(state.href, '/boot-camp/day/1/report')
})

test('personal Day 1 remains next regardless of the global calendar day', () => {
  const state = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, catalog([
    progressDay(1), progressDay(2, { accessible: false }), progressDay(3, { accessible: false, isToday: true }),
  ], { sequenceMode: 'personal', personalDay: 1 }))
  assert.equal(state.day, 1)
  assert.equal(state.href, '/boot-camp/day/1')
  assert.equal(state.cta, 'Start Day 1')
})

test('missing progress never claims completion and uses a safe fallback', () => {
  const paid = getBootCampHomeBannerState({ allowed: true, source: 'subscription' }, null)
  assert.equal(paid.kind, 'fallback')
  assert.equal(paid.destination, 'calendar')
  assert.equal(paid.href, '/boot-camp')
  const unpaid = getBootCampHomeBannerState({ allowed: true, source: 'day1_free' }, null)
  assert.equal(unpaid.kind, 'fallback')
  assert.equal(unpaid.cta, 'Open Boot Camp')
})
