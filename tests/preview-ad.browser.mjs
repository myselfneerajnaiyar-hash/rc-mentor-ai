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
  const heroHeading = page.locator('#ad-title')
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
  const after = await measuredVisit('/preview-ad?utm_source=instagram&fbclid=preview-test')
  console.log('MOBILE_METRICS', JSON.stringify({ condition: '390x844, 4x CPU throttle, 1.5Mbps down, 150ms RTT', after }))
  check(after.fcp !== null, 'ad landing page paints meaningful server-rendered content')
  check(after.lcp !== null, 'ad landing page records largest contentful paint')
  const paletteContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const palettePage = await paletteContext.newPage()
  await palettePage.goto(`${base}/preview-ad`, { waitUntil: 'domcontentloaded' })
  const palette = await palettePage.locator('.ad-page').evaluate(node => ({
    background: getComputedStyle(node).backgroundColor,
    signupCard: getComputedStyle(document.querySelector('.ad-signup-card-hero')).backgroundColor,
  }))
  check(palette.background === 'rgb(7, 20, 38)' && palette.signupCard === 'rgb(255, 255, 255)', 'dark navy page background keeps the signup card white and legible')
  await palettePage.setViewportSize({ width: 1440, height: 900 })
  const desktopBackground = await palettePage.locator('.ad-page').evaluate(node => getComputedStyle(node).backgroundColor)
  check(desktopBackground === 'rgb(7, 20, 38)', 'desktop Preview Ad retains the dark navy background')
  await paletteContext.close()

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true })
  const noJsPage = await noJs.newPage()
  const trackingUrl = `${base}/preview-ad?utm_source=instagram&utm_campaign=rc-launch&fbclid=click_123`
  await noJsPage.goto(trackingUrl, { waitUntil: 'domcontentloaded' })
  check(await noJsPage.locator('#preview-hero-email').isVisible(), 'inline signup fields are server rendered without navigation')
  check(await noJsPage.locator('#preview-hero-password').isVisible(), 'inline password field is server rendered')
  check(new URL(noJsPage.url()).searchParams.get('utm_source') === 'instagram' && new URL(noJsPage.url()).searchParams.get('fbclid') === 'click_123', 'ad attribution remains on the inline signup page')
  await noJs.close()

  const pageContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await pageContext.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(trackingUrl, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /Start your free trial/i }).first().waitFor()
  const welcomeResponse = await page.request.get(`${base}/welcome?signup_surface=preview_ad_inline&utm_source=probe&first_utm_source=probe`)
  check(welcomeResponse.status() === 200, 'the existing /welcome onboarding route resolves in this app')
  check((await welcomeResponse.text()).includes('__next'), 'the welcome response is the app route, not the Next.js 404 page')
  const callbackResponse = await page.request.get(`${base}/auth/callback?signup_surface=preview_ad_inline&utm_source=probe&flow=signup&oauth=google`, { maxRedirects: 0 })
  const callbackLocation = callbackResponse.headers().location
  check(callbackResponse.status() === 307 && callbackLocation?.startsWith(`${base}/welcome?`), 'Google OAuth callback returns to this local app welcome route')
  check(callbackLocation?.includes('signup_surface=preview_ad_inline') && callbackLocation?.includes('utm_source=probe') && callbackLocation?.includes('oauth=google'), 'Google callback preserves signup surface, attribution, and signup intent')
  for (const width of [320, 390, 756, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 756 : 844 })
    const layout = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }))
    check(layout.content <= layout.viewport, `landing layout has no horizontal overflow at ${width}px`)
    if (width === 390) {
      const buttonVisible = await page.locator('.ad-signup-card-hero .ad-signup-submit').evaluate(node => node.getBoundingClientRect().bottom <= innerHeight)
      check(buttonVisible, '390x756 first screen shows the create-account button without scrolling')
    }
    if (width === 390 || width === 1440) {
      const order = await page.evaluate(() => Object.fromEntries(['.ad-students', '.ad-classroom', '.ad-process', '.ad-feature-section'].map(selector => [selector, document.querySelector(selector).getBoundingClientRect().top + scrollY])))
      check(order['.ad-students'] < order['.ad-classroom'] && order['.ad-classroom'] < order['.ad-process'] && order['.ad-process'] < order['.ad-feature-section'], `section sequence is correct at ${width}px`)
    }
  }
  await page.setViewportSize({ width: 390, height: 756 })
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
  await page.locator('.ad-feature-section').screenshot({ path: screenshotPath('mobile-features.png') })
  check(await page.locator('.ad-video-carousel').evaluate(node => node.scrollWidth > node.clientWidth), 'mobile testimonial carousel supports horizontal swiping')
  check(await page.locator('.ad-feature-track').evaluate(node => node.scrollWidth > node.clientWidth), 'mobile feature showcase supports horizontal swiping')
  check(await page.locator('.ad-feature-card').count() === 7, 'all seven feature cards are rendered on mobile')
  check(await page.locator('.ad-signup-form').count() === 1, 'page has only the original signup form')
  check(await page.locator('.ad-feature-section .ad-signup-form').count() === 0, 'feature section does not repeat the signup form')
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
  await page.evaluate(() => scrollTo(0, document.querySelector('.ad-primary-signup-anchor').offsetTop + innerHeight))
  const sticky = page.locator('.ad-sticky-cta')
  await sticky.locator('button').waitFor({ state: 'visible' })
  check(await sticky.locator('button').getByText('Start your free 3-day trial').isVisible(), 'mobile sticky CTA is visible away from the hero signup')
  check(await sticky.locator('button').getByText('No card needed').isVisible(), 'mobile sticky CTA preserves trial reassurance')
  const currentUrl = page.url()
  await sticky.locator('button').click()
  await page.waitForFunction(() => document.activeElement?.id === 'preview-hero-email')
  check(page.url() === currentUrl, 'mobile sticky CTA focuses the existing signup without navigation')
  check(await page.locator('.ad-signup-form').count() === 1, 'sticky CTA does not create another signup form')
  await page.locator('.ad-footer').scrollIntoViewIfNeeded()
  const footerBottom = await page.locator('.ad-footer').evaluate(node => node.getBoundingClientRect().bottom)
  const stickyTop = await sticky.evaluate(node => node.getBoundingClientRect().top)
  const currentScroll = await page.evaluate(() => scrollY)
  check(footerBottom <= stickyTop, `mobile sticky CTA leaves the footer reachable above its bar (${footerBottom.toFixed(1)}px footer / ${stickyTop.toFixed(1)}px bar / scroll ${currentScroll}px)`)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(() => scrollTo(0, 0))
  check(await page.locator('.ad-sticky-cta').evaluate(node => getComputedStyle(node).display === 'none'), 'desktop has no mobile sticky signup bar')
  check(await page.locator('.ad-signup-card-hero').evaluate(node => getComputedStyle(node).position === 'sticky'), 'desktop signup card stays in the right-side sticky position')
  check(await page.locator('.ad-feature-tabs [role="tab"]').count() === 7, 'desktop feature showcase exposes seven keyboard-accessible tabs')
  check(await page.locator('.ad-feature-panel').isVisible(), 'desktop feature panel is visible')
  check(await page.locator('.ad-feature-cta').isVisible(), 'desktop feature CTA is visible near the showcase')
  await page.locator('.ad-feature-tabs [role="tab"]').nth(6).click()
  check(await page.locator('.ad-feature-panel h3').innerText() === 'Birbal AI Mentor', 'desktop feature tabs switch the active panel')
  await page.locator('.ad-feature-cta').click()
  await page.waitForFunction(() => document.activeElement?.id === 'preview-hero-email')
  check(page.url() === currentUrl, 'desktop feature CTA focuses the hero signup on the same page')
  await page.screenshot({ path: screenshotPath('desktop-first-screen.png'), fullPage: false })
  await page.locator('.ad-students').screenshot({ path: screenshotPath('desktop-testimonials.png') })
  await page.locator('.ad-classroom').screenshot({ path: screenshotPath('desktop-classroom.png') })
  await page.locator('.ad-feature-section').screenshot({ path: screenshotPath('desktop-features.png') })
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
