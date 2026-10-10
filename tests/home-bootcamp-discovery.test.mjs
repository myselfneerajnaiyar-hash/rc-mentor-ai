import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getExamCapabilities } from '../lib/tenant/capabilities.js'
import { canPromoteBootCampFreeDay, hasPaidBootCampAccess } from '../lib/bootcamp/presentation.mjs'

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

test('the homepage card uses the current offer and existing Boot Camp route', async () => {
  const card = await source('../components/bootcamp/BootCampHomeCard.jsx')
  assert.match(card, /Auctor VARC Boot Camp/)
  assert.match(card, /structured 45-day CAT VARC training experience/)
  assert.match(card, /Reading Comprehension and Verbal Ability/)
  assert.match(card, /Birbal-guided review and performance analysis/)
  assert.match(card, /<del>₹999<\/del><strong>₹799<\/strong>/)
  assert.match(card, /Day 1 is free to try/)
  assert.match(card, /Start Day 1 Free/)
  assert.match(card, /href=\{href\}/)
  assert.match(card, /setHref\(`\/boot-camp\?\$\{query\.toString\(\)\}`\)/)
})

test('free Day 1 promotion follows server access sources for unpaid and paid users', async () => {
  const card = await source('../components/bootcamp/BootCampHomeCard.jsx')
  assert.equal(canPromoteBootCampFreeDay({ allowed: true, source: 'day1_free' }), true)
  assert.equal(canPromoteBootCampFreeDay({ allowed: true, source: 'first_free' }), true)
  for (const source of ['subscription', 'test_series', 'institute', 'purchase']) {
    assert.equal(canPromoteBootCampFreeDay({ allowed: true, source }), false, `${source} is paid access`)
  }
  assert.equal(canPromoteBootCampFreeDay(null), false)
  assert.match(card, /bootcampRequest\('\/access'\)/)
  assert.match(card, /\{freeDayOffer&&<span>Day 1 is free to try\.<\/span>\}/)
  assert.match(card, /freeDayOffer\?'Start Day 1 Free':'Enter Day 1'/)
})

test('homepage pricing is hidden for active paid Boot Camp access and shown without it', async () => {
  const card = await source('../components/bootcamp/BootCampHomeCard.jsx')
  for (const source of ['subscription', 'test_series', 'institute', 'purchase']) {
    assert.equal(hasPaidBootCampAccess({ allowed: true, source }), true, `${source} grants active paid access`)
  }
  for (const access of [
    { allowed: true, source: 'day1_free' },
    { allowed: true, source: 'first_free' },
    { allowed: false, source: 'subscription' },
    null,
  ]) assert.equal(hasPaidBootCampAccess(access), false)
  assert.match(card, /const showPricing=!hasPaidBootCampAccess\(access\)/)
  assert.match(card, /\{showPricing&&<div><del>₹999<\/del><strong>₹799<\/strong><\/div>\}/)
})
