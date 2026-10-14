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
  for (const width of [320, 390, 756, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 756 : 900 }, isMobile: width < 650 })
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
    await page.locator('#preview-hero-email').waitFor({ state: 'visible' })
    check(new URL(page.url()).pathname === '/preview-ad' && new URL(page.url()).searchParams.get('utm_campaign') === 'p0-signup', `${width}px inline signup stays on preview-ad with attribution`)
    check(await page.locator('#preview-hero-email').isVisible() && await page.locator('#preview-hero-password').isVisible() && await page.locator('.ad-signup-card-hero .ad-signup-submit').isVisible(), `${width}px inline signup fields and submit button are visible`)
    if (width === 390) {
      check(await page.locator('.ad-signup-card-hero .ad-signup-submit').evaluate(button => button.getBoundingClientRect().bottom <= innerHeight), '390x756 first screen shows the submit button without scrolling')
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    check(!overflow, `${width}px signup has no horizontal overflow`)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('#preview-hero-email').waitFor({ state: 'visible' })
    if (width === 390) await page.waitForTimeout(1800)
    check(new URL(page.url()).searchParams.get('fbclid') === 'cta-test', `${width}px refresh preserves signup attribution`)

    if (width === 390) {
      const signupRequests = []
      await page.route('**/auth/v1/signup*', async route => {
        const payload = route.request().postDataJSON()
        signupRequests.push(payload)
        if (payload.email === 'existing@example.test') {
          return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'user_already_registered', message: 'User already registered' }) })
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          id: '0b1b9c4a-f2b5-4c1a-a58e-9eb0497b1d08',
          aud: 'authenticated',
          role: 'authenticated',
          email: payload.email,
          created_at: new Date().toISOString(),
          identities: [{ id: 'identity-1', provider: 'email' }],
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: payload.data || {},
        }) })
      })
      await page.route('**/api/conversions/signup', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"sent"}' }))
      await page.locator('#preview-hero-email').fill('not-an-email')
      await page.locator('#preview-hero-password').fill('SafePassword9!')
      await page.locator('.ad-signup-card-hero .ad-signup-submit').click()
      await page.getByText('Enter a valid email address.').waitFor({ state: 'visible' })
      check(await page.getByText('Enter a valid email address.').isVisible(), 'inline form shows an email validation error')
      check(signupRequests.length === 0, 'invalid inline form does not call Supabase')

      await page.locator('#preview-hero-email').fill('Existing@Example.test')
      await page.locator('#preview-hero-password').fill('SafePassword9!')
      await page.locator('.ad-signup-card-hero .ad-signup-submit').click()
      await page.getByText('This email already has an account.', { exact: false }).waitFor()
      const loginUrl = new URL(await page.getByRole('link', { name: 'Log in instead' }).getAttribute('href'), base)
      check(loginUrl.pathname === '/login' && loginUrl.searchParams.get('email') === 'existing@example.test', 'existing-email error keeps the normalized address on the login link')

      await page.locator('#preview-hero-email').fill(' New@Example.Test ')
      await page.locator('#preview-hero-password').fill('SafePassword9!')
      await page.locator('.ad-signup-card-hero .ad-signup-submit').click()
      await page.getByRole('status').filter({ hasText: 'Account created.' }).waitFor()
      check(signupRequests.at(-1).email === 'new@example.test', 'successful email signup submits a trimmed lowercase address')
      check(new URL(page.url()).pathname === '/preview-ad', 'confirmation-required signup stays on the inline page')
    }

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
