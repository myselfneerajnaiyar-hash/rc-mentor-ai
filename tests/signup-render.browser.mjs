import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const base = process.env.SIGNUP_TEST_BASE_URL || 'http://localhost:3201'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'signup browser test must use a local app')
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync)
assert.ok(executablePath, 'Set CHROME_PATH to a local Chrome or Edge executable')
const browser = await chromium.launch({ executablePath, headless: true })
const check = (condition, message) => { assert.ok(condition, message); console.log('PASS', message) }

try {
  for (const width of [320, 364, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 650 })
    const page = await context.newPage()
    const pageErrors = []
    const appRequestFailures = []
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('requestfailed', request => {
      if (new URL(request.url()).origin === new URL(base).origin) appRequestFailures.push(`${request.url()}: ${request.failure()?.errorText}`)
    })
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin !== new URL(base).origin) return route.abort()
      return route.continue()
    })

    const attribution = 'utm_source=instagram&utm_campaign=p0-signup&fbclid=cta-test'
    const landing = await page.goto(`${base}/preview-ad?${attribution}`, { waitUntil: 'domcontentloaded' })
    check(landing.status() === 200, `${width}px landing responds successfully`)
    await page.locator('#primary-signup-cta').click()
    await page.locator('#signup-email').waitFor({ state: 'visible' })
    check(new URL(page.url()).pathname === '/signup' && new URL(page.url()).searchParams.get('utm_campaign') === 'p0-signup', `${width}px hero CTA reaches signup with attribution`)
    check(await page.locator('#signup-email').isVisible() && await page.locator('#signup-password').isVisible() && await page.getByRole('button', { name: 'Create account' }).isVisible(), `${width}px signup form and submit button are visible`)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    check(!overflow, `${width}px signup has no horizontal overflow`)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('#signup-email').waitFor({ state: 'visible' })
    check(new URL(page.url()).searchParams.get('fbclid') === 'cta-test', `${width}px refresh preserves signup attribution`)

    await page.goto(`${base}/signup?${attribution}`, { waitUntil: 'domcontentloaded' })
    await page.locator('#signup-password').waitFor({ state: 'visible' })
    check(new URL(page.url()).searchParams.get('utm_source') === 'instagram', `${width}px direct signup URL renders`)
    check(pageErrors.length === 0, `${width}px signup has no uncaught browser errors`)
    check(appRequestFailures.length === 0, `${width}px signup has no failed same-origin requests`)

    await context.close()
  }
} finally {
  await browser.close()
}
