import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const base = process.env.PREVIEW_AD_TEST_BASE_URL || 'http://localhost:3000'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'browser checks must use a local app')
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const executablePath = chromeCandidates.find(existsSync)
assert.ok(executablePath, 'Set CHROME_PATH to a local Chrome or Edge executable')
const browser = await chromium.launch({ executablePath, headless: true })
const screenshotDir = fileURLToPath(new URL('../artifacts/preview-ad/', import.meta.url))
await mkdir(screenshotDir, { recursive: true })
const screenshotPath = name => join(screenshotDir, name)
const check = (condition, message) => { assert.ok(condition, message); console.log('PASS', message) }

async function measuredVisit(pathname) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 1_500_000 / 8, uploadThroughput: 750_000 / 8, latency: 150 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.addInitScript(() => {
    window.__previewAdLcp = 0
    new PerformanceObserver(entries => {
      for (const entry of entries.getEntries()) window.__previewAdLcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}${pathname}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  const heroHeading = pathname.startsWith('/preview-ad')
    ? page.locator('#ad-title')
    : page.getByRole('heading', { name: /Stop solving more RCs/ })
  await heroHeading.waitFor({ state: 'visible' })
  await page.waitForTimeout(1800)
  const metrics = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint')
    const resources = performance.getEntriesByType('resource')
    return {
      fcp: paints.find(entry => entry.name === 'first-contentful-paint')?.startTime ?? null,
      lcp: window.__previewAdLcp,
      meaningfulTextReady: performance.now(),
      jsBytes: resources.filter(entry => entry.initiatorType === 'script').reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0),
      imageBytes: resources.filter(entry => entry.initiatorType === 'img').reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0),
    }
  })
  await context.close()
  assert.deepEqual(errors, [], `${pathname} has no browser runtime errors`)
  return metrics
}

try {
  const before = await measuredVisit('/preview?utm_source=instagram&fbclid=preview-test')
  const after = await measuredVisit('/preview-ad?utm_source=instagram&fbclid=preview-test')
  console.log('MOBILE_METRICS', JSON.stringify({ condition: '390x844, 4x CPU throttle, 1.5Mbps down, 150ms RTT', before, after }))
  check(after.fcp !== null, 'ad landing page paints meaningful server-rendered content')
  check(after.meaningfulTextReady < before.meaningfulTextReady, 'ad headline becomes visible sooner than in the previous client-gated landing page')
  check(after.jsBytes < before.jsBytes, 'ad landing page transfers less script data than the previous preview page')

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true })
  const noJsPage = await noJs.newPage()
  const trackingUrl = `${base}/preview-ad?utm_source=instagram&utm_campaign=rc-launch&fbclid=click_123`
  await noJsPage.goto(trackingUrl, { waitUntil: 'domcontentloaded' })
  const directHref = await noJsPage.locator('#primary-signup-cta').getAttribute('href')
  const parsedHref = new URL(directHref, base)
  check(parsedHref.pathname === '/signup' && parsedHref.searchParams.get('utm_source') === 'instagram' && parsedHref.searchParams.get('fbclid') === 'click_123', 'JS-disabled primary CTA links directly to signup with ad parameters')
  await noJsPage.locator('#primary-signup-cta').click()
  check(new URL(noJsPage.url()).pathname === '/signup', 'CTA navigation completes with JavaScript disabled')
  await noJs.close()

  const pageContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await pageContext.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(trackingUrl, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /Start your 3-day free trial/i }).waitFor()
  for (const width of [320, 390, 400, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    const layout = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }))
    check(layout.content <= layout.viewport, `landing layout has no horizontal overflow at ${width}px`)
    if (width === 390 || width === 1440) {
      const order = await page.evaluate(() => Object.fromEntries(['.ad-students', '.ad-classroom', '.ad-process', '.ad-final-cta'].map(selector => [selector, document.querySelector(selector).getBoundingClientRect().top + scrollY])))
      check(order['.ad-students'] < order['.ad-classroom'] && order['.ad-classroom'] < order['.ad-process'] && order['.ad-process'] < order['.ad-final-cta'], `section sequence is correct at ${width}px`)
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: screenshotPath('mobile-first-screen.png'), fullPage: false })
  await page.locator('.ad-process').screenshot({ path: screenshotPath('mobile-practice-loop.png') })
  await page.locator('.ad-students').scrollIntoViewIfNeeded()
  const portrait = page.locator('.ad-classroom-photo img')
  await portrait.scrollIntoViewIfNeeded()
  check(await portrait.evaluate(image => image.complete && image.naturalWidth > 0), 'Neeraj Sir portrait asset loads visibly')
  const portraitBox = await portrait.boundingBox()
  check(portraitBox.width >= 240 && portraitBox.height >= 240, 'Neeraj Sir portrait is a substantial classroom feature')
  await page.locator('.ad-students').screenshot({ path: screenshotPath('mobile-testimonials.png') })
  await page.screenshot({ path: screenshotPath('mobile-classroom.png'), fullPage: false })
  await page.locator('.ad-classroom').screenshot({ path: screenshotPath('mobile-classroom-card.png') })
  await page.locator('.ad-final-cta').screenshot({ path: screenshotPath('mobile-closing.png') })
  check(await page.locator('.ad-video-carousel').evaluate(node => node.scrollWidth > node.clientWidth), 'mobile testimonial carousel supports horizontal swiping')
  check(await page.locator('.ad-final-cta .ad-cta').count() === 0, 'closing section does not repeat a trial CTA above the sticky action')
  const pageCount = page.context().pages().length
  await page.locator('.ad-video-card').first().scrollIntoViewIfNeeded()
  const initialScrollY = await page.evaluate(() => scrollY)
  await page.locator('.ad-video-card').first().click()
  const video = page.locator('.ad-video-dialog video')
  await video.waitFor({ state: 'visible' })
  check((await video.getAttribute('src')) === null && (await video.locator('source').getAttribute('src')).endsWith('.mp4'), 'testimonial opens its existing source in an inline player')
  check(page.context().pages().length === pageCount, 'testimonial playback does not open another browser window')
  await page.getByRole('button', { name: 'Close video' }).click()
  check(await page.locator('.ad-video-dialog').count() === 0, 'testimonial lightbox closes in place')
  check(Math.abs((await page.evaluate(() => scrollY)) - initialScrollY) < 10, 'closing testimonial preserves page position')
  await page.evaluate(() => scrollTo(0, document.querySelector('#primary-signup-cta').offsetTop + innerHeight))
  const sticky = page.locator('.ad-sticky-cta')
  await sticky.waitFor({ state: 'visible' })
  const stickyHref = new URL(await sticky.locator('a').getAttribute('href'), base)
  check(stickyHref.pathname === '/signup' && stickyHref.searchParams.get('utm_campaign') === 'rc-launch', `mobile sticky CTA preserves ad attribution and points to signup (${stickyHref.href})`)
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  const footerBottom = await page.locator('.ad-footer').evaluate(node => node.getBoundingClientRect().bottom)
  const stickyTop = await sticky.evaluate(node => node.getBoundingClientRect().top)
  check(footerBottom <= stickyTop, 'mobile sticky CTA leaves the footer reachable above its bar')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: screenshotPath('desktop-first-screen.png'), fullPage: false })
  await page.locator('.ad-students').screenshot({ path: screenshotPath('desktop-testimonials.png') })
  await page.locator('.ad-classroom').screenshot({ path: screenshotPath('desktop-classroom.png') })
  await page.locator('.ad-final-cta').screenshot({ path: screenshotPath('desktop-closing.png') })
  assert.deepEqual(pageErrors, [], 'landing interaction introduces no page errors')
  await pageContext.close()

  const tenantContext = {
    tenant: { kind: 'b2c', hostname: 'localhost' },
    branding: { brandName: 'Auctor', logoUrl: '/logo.png', faviconUrl: '/icon-192.png', primaryColor: '#4f46e5', secondaryColor: '#0ea5e9', isInstitute: false },
  }
  for (const [label, userAgent, shouldHideGoogle] of [
    ['Instagram', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0', true],
    ['Facebook', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0]', true],
    ['normal Android Chrome', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36', false],
  ]) {
    const authContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, userAgent })
    await authContext.route('**/api/tenant-context', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tenantContext) }))
    const authPage = await authContext.newPage()
    await authPage.goto(`${base}/signup?utm_source=instagram`, { waitUntil: 'domcontentloaded' })
    await authPage.getByLabel('Email', { exact: true }).waitFor()
    if (shouldHideGoogle) await authPage.locator('.auth-google-button').waitFor({ state: 'hidden' })
    else await authPage.getByRole('button', { name: /Continue with Google/ }).waitFor({ state: 'visible' })
    check(await authPage.locator('#signup-email').isVisible(), `${label} keeps email signup available`)
    check((await authPage.locator('.auth-google-button').isVisible()) === !shouldHideGoogle, `${label} Google button behavior matches the browser requirement`)
    await authContext.close()
  }
} finally {
  await browser.close()
}
