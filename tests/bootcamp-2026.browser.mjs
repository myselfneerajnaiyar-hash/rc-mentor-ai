import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const base = process.env.BOOTCAMP_2026_TEST_BASE_URL || 'http://localhost:3112'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'browser checks must use a local app')
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync)
assert.ok(executablePath, 'Set CHROME_PATH to a local Chrome or Edge executable')
const browser = await chromium.launch({ executablePath, headless: true })
const check = (condition, message) => { assert.ok(condition, message); console.log('PASS', message) }

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await context.newPage()
  const errors = []
  const apiRequests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().includes('/api/')) apiRequests.push(request.url()) })
  await page.goto(`${base}/bootcamp-2026?utm_source=instagram&utm_medium=paid_social&utm_campaign=cat26&fbclid=click_123&extra=kept`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /50 days to sharpen your VARC/i }).waitFor()
  check(await page.title() === 'CAT 2026 VARC Boot Camp | Auctor', 'public route uses the requested SEO title')
  check(await page.locator('meta[name="description"]').getAttribute('content') === '50 days of structured CAT VARC training with RC, Verbal Ability, guided practice and intelligent review.', 'public route uses the requested SEO description')
  check(await page.locator('.mobile-nav').count() === 0, 'public marketing route has no authenticated mobile navigation')
  check(apiRequests.length === 0, 'landing page makes no API requests on initial load')
  check(await page.getByRole('heading', { name: /Every day you train/ }).count() === 1, 'daily training system is present')
  check(await page.locator('[class*="reviewMock"]').first().getByText('HALF TRUTH', { exact: true }).count() === 1, 'review explanation shows a concrete authored trap example')
  check(await page.locator('img[alt="Birbal, Auctor’s VARC review trainer"]').count() === 1, 'Birbal section uses the existing visual asset')
  check(await page.locator('[class*="testimonial"]').count() >= 4, 'three published Auctor learner testimonials are present')
  check(await page.getByText('Keshu Sharma', { exact: true }).count() === 1 && await page.getByText('Pushti Kapoor', { exact: true }).count() === 1 && await page.getByText('Nabeel', { exact: true }).count() === 1, 'testimonials retain their published learner names')
  check(await page.evaluate(() => document.querySelector('#offer').compareDocumentPosition(document.querySelector('[class*="learnerProof"]')) & Node.DOCUMENT_POSITION_FOLLOWING), 'pricing appears before testimonial cards')
  const countdown = await page.locator('[class*="countdown"] > strong').first().innerText()
  const expectedDays = await page.evaluate(() => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
    const date = Object.fromEntries(parts.filter(part => ['year', 'month', 'day'].includes(part.type)).map(part => [part.type, Number(part.value)]))
    return Math.max(0, Math.ceil((Date.UTC(2026, 10, 29) - Date.UTC(date.year, date.month - 1, date.day)) / 86400000))
  })
  check(Number.parseInt(countdown, 10) === expectedDays, 'CAT countdown is calculated from today in India time')

  const cta = page.getByRole('link', { name: 'Start the Bootcamp', exact: false }).first()
  const ctaUrl = new URL(await cta.getAttribute('href'), base)
  check(ctaUrl.pathname === '/bootcamp-2026/start', 'marketing CTA routes to the enrollment placeholder')
  for (const [key, value] of Object.entries({ utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'cat26', fbclid: 'click_123', extra: 'kept' })) check(ctaUrl.searchParams.get(key) === value, `CTA preserves ${key}`)

  for (const width of [360, 375, 390, 412, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }))
    check(layout.document <= layout.viewport && layout.body <= layout.viewport, `no horizontal overflow at ${width}px`)
    const h1 = await page.locator('#hero-title').boundingBox()
    check(h1.x >= 0 && h1.x + h1.width <= width + 1, `hero headline remains inside the ${width}px viewport`)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const rail = page.locator('[class*="testimonialRail"]')
  check(await rail.evaluate(node => node.scrollWidth > node.clientWidth), 'mobile testimonials form a swipeable horizontal rail')
  await rail.evaluate(node => { node.scrollLeft = node.scrollWidth })
  check(await rail.evaluate(node => node.scrollLeft > 0) && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'testimonial swipe stays inside its section without page overflow')
  const sticky = page.locator('[class*="stickyCta"]')
  check(await sticky.evaluate(node => getComputedStyle(node).opacity === '0'), 'mobile sticky CTA stays hidden in the hero')
  await page.evaluate(() => scrollTo(0, document.querySelector('#mission-title').getBoundingClientRect().top + scrollY))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[class*="stickyCta"]')).opacity === '1')
  check(await sticky.evaluate(node => getComputedStyle(node).opacity === '1'), 'mobile sticky CTA appears after the hero')
  check((await sticky.innerText()).includes('₹499') && (await sticky.innerText()).includes('CAT 2026'), 'sticky CTA shows urgency and current price')
  await page.evaluate(() => scrollTo(0, document.querySelector('#final-cta').getBoundingClientRect().top + scrollY))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[class*="stickyCta"]')).opacity === '0')
  check(await sticky.evaluate(node => getComputedStyle(node).opacity === '0'), 'mobile sticky CTA yields to the final CTA')
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  const footerBottom = await page.locator('footer').evaluate(node => node.getBoundingClientRect().bottom)
  check(footerBottom <= 844, 'footer remains reachable above the mobile sticky bar')

  await page.goto(`${base}/bootcamp-2026/start?utm_source=instagram&fbclid=click_123&extra=kept`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.evaluate(() => scrollTo(0, 0))
  await page.getByRole('heading', { name: /Your 50-day training plan is ready/i }).waitFor()
  const back = new URL(await page.getByRole('link', { name: /Back to the Boot Camp overview/ }).getAttribute('href'), base)
  check(back.pathname === '/bootcamp-2026' && back.searchParams.get('utm_source') === 'instagram' && back.searchParams.get('fbclid') === 'click_123' && back.searchParams.get('extra') === 'kept', 'placeholder return link preserves all query parameters')
  assert.deepEqual(errors, [], 'landing and placeholder have no browser runtime errors')
  console.log('Browser acceptance passed: landing content, attribution, sticky CTA, and 8 viewport widths.')
  await context.close()
} finally {
  await browser.close()
}
