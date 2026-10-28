import assert from "node:assert/strict"
import dotenv from "dotenv"
import { chromium } from "playwright-core"

dotenv.config({ path: ".env.local", quiet: true })

const base = process.env.ANNOUNCEMENT_TEST_URL || "http://127.0.0.1:3112"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
assert.ok(supabaseUrl, "local Supabase URL is available for the signed-in browser fixture")
const supabaseHost = new URL(supabaseUrl).hostname
const projectRef = supabaseHost.split(".")[0]
const executablePath = process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
const user = { id: "00000000-0000-4000-8000-000000000011", email: "announcement-ribbon@example.test", created_at: new Date().toISOString(), app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {} }
const session = { access_token: "announcement-ribbon-browser-test-token", refresh_token: "announcement-ribbon-browser-test-refresh", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user }

function contextFor(audience) {
  const exam = audience === "non_cat" ? "IPMAT" : audience === "unknown" ? "Unassigned" : "CAT"
  const bootcampAccess = audience === "member"
    ? { allowed: true, source: "first_free", firstFreeClaimed: true, canClaimFirstFree: false }
    : audience === "unknown"
      ? null
      : { allowed: true, source: "day1_free", firstFreeClaimed: false, canClaimFirstFree: true }
  return {
    user: { id: user.id, email: user.email },
    profile: { user_id: user.id, name: "Announcement QA", exam },
    tenant: { kind: "public", hostname: "localhost" },
    branding: { brandName: "Auctor RC", faviconUrl: "/icon-192.png", isInstitute: false },
    exam,
    capabilities: { exam, isCAT: exam === "CAT", showDailyRC: exam === "CAT", showCATSectionals: exam === "CAT" },
    entitlement: { kind: "restricted", hasAccess: false, isPremium: false, isInstituteStudent: false },
    bootcampAccess,
  }
}

let activeContext = contextFor("cat_prospect")
const browser = await chromium.launch({ executablePath, headless: true })
const browserContext = await browser.newContext({ viewport: { width: 360, height: 800 } })
await browserContext.addInitScript(({ projectRef: ref, sessionValue }) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(sessionValue)), { projectRef, sessionValue: session })

function installRoutes(targetContext) {
  return targetContext.route("**/*", route => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.origin === new URL(base).origin) {
      if (requestUrl.pathname === "/api/tenant-context") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tenant: activeContext.tenant, branding: activeContext.branding }) })
      if (requestUrl.pathname === "/api/session-context") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(activeContext) })
      if (requestUrl.pathname === "/api/bootcamp/access") return route.fulfill({ status: activeContext.bootcampAccess ? 200 : 503, contentType: "application/json", body: JSON.stringify(activeContext.bootcampAccess || { error: "unavailable" }) })
      return route.continue()
    }
    if (requestUrl.hostname === supabaseHost) {
      if (requestUrl.pathname === "/auth/v1/user") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) })
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    }
    return route.abort()
  })
}

await installRoutes(browserContext)
const page = await browserContext.newPage()
page.setDefaultTimeout(15_000)
const cases = {
  cat_prospect: [["45 days of guided VARC practice. Try Day 1 free →", "/bootcamp-2026"]],
  non_cat: [["Build your RC, vocabulary & speed. Practise daily with Auctor →", "/?view=today"], ["Plans are 30% off. Use AUCTOR30 →", "/pricing?coupon=AUCTOR30"]],
  bootcamp_member: [["Continue your VARC Bootcamp →", "/boot-camp"]],
  neutral: [["Build your RC, vocabulary & speed. Practise daily with Auctor →", "/?view=today"], ["Plans are 30% off. Use AUCTOR30 →", "/pricing?coupon=AUCTOR30"]],
}

try {
  for (const [audience, expected] of Object.entries(cases)) {
    activeContext = contextFor(audience === "bootcamp_member" ? "member" : audience === "neutral" ? "unknown" : audience)
    await page.goto(`${base}/?view=today`, { waitUntil: "domcontentloaded" })
    await page.locator(`[data-testid="announcement-ribbon"][data-ribbon-state="${audience}"]`).waitFor({ state: "visible" })
    const ribbon = page.locator('[data-testid="announcement-ribbon"]')
    const links = ribbon.locator('[data-testid="ribbon-message-group"]').first().getByTestId("ribbon-message")
    assert.deepEqual(await links.evaluateAll(nodes => nodes.map(node => [node.getAttribute("aria-label"), node.getAttribute("href")])), expected)
    if (audience === "cat_prospect" || audience === "bootcamp_member") assert.equal(await ribbon.getByText("AUCTOR30").count(), 0)
  }

  activeContext = contextFor("cat_prospect")
  for (const route of ["/?view=today", "/?view=rc", "/?view=precision", "/?view=vocab", "/?view=speed", "/?view=hangman", "/?view=mentor"]) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" })
    const ribbon = page.locator('[data-testid="announcement-ribbon"][data-ribbon-state="cat_prospect"]')
    await ribbon.waitFor({ state: "visible" })
    assert.equal(await ribbon.count(), 1, `${route} renders one shared ribbon`)
  }
  for (const route of ["/", "/?view=home"]) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(250)
    assert.equal(await page.locator('[data-testid="announcement-ribbon"]').count(), 0, `${route} Home has no ribbon`)
  }
  for (const route of ["/daily-challenge/test", "/rc-session/test", "/boot-camp/day/1", "/bootcamp-2026/start", "/pricing?coupon=AUCTOR30", "/payment-success", "/about", "/login", "/signup"]) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" })
    assert.equal(await page.locator('[data-testid="announcement-ribbon"]').count(), 0, `${route} excludes the ribbon`)
  }

  await page.goto(`${base}/?view=today&activity=workout`, { waitUntil: "domcontentloaded" })
  assert.equal(await page.locator('[data-testid="announcement-ribbon"]').count(), 0, "active workout remains excluded")
  activeContext = contextFor("non_cat")
  await page.goto(`${base}/?view=today`, { waitUntil: "domcontentloaded" })
  const ribbon = page.locator('[data-testid="announcement-ribbon"]')
  await ribbon.waitFor({ state: "visible" })
  for (const width of [360, 390, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    const metrics = await ribbon.evaluate(el => ({
      height: el.getBoundingClientRect().height,
      scrollWidth: document.documentElement.scrollWidth,
      position: getComputedStyle(el).position,
      background: getComputedStyle(el).backgroundColor,
      close: (() => { const r = el.querySelector("button").getBoundingClientRect(); return [r.width, r.height] })(),
    }))
    assert.equal(metrics.height, 44)
    assert.ok(metrics.scrollWidth <= width, `no overflow at ${width}px`)
    assert.equal(metrics.position, "relative")
    assert.equal(metrics.background, "rgb(17, 29, 41)")
    assert.ok(metrics.close[0] >= 44 && metrics.close[1] >= 44)
  }
  await ribbon.dispatchEvent("touchstart")
  assert.equal(await page.locator('[data-testid="ribbon-marquee-track"]').evaluate(el => getComputedStyle(el).animationPlayState), "paused")
  await ribbon.dispatchEvent("touchend")
  assert.equal(await page.locator('[data-testid="ribbon-marquee-track"]').evaluate(el => getComputedStyle(el).animationPlayState), "running")
  await ribbon.getByRole("button", { name: "Dismiss announcements for this session" }).click()
  assert.equal(await page.locator('[data-testid="announcement-ribbon"]').count(), 0)
  await page.reload({ waitUntil: "domcontentloaded" })
  assert.equal(await page.locator('[data-testid="announcement-ribbon"]').count(), 0, "dismissal lasts for the browser session")

  const reduced = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" })
  await reduced.addInitScript(({ projectRef: ref, sessionValue }) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(sessionValue)), { projectRef, sessionValue: session })
  await installRoutes(reduced)
  const reducedPage = await reduced.newPage()
  await reducedPage.goto(`${base}/?view=today`, { waitUntil: "domcontentloaded" })
  const reducedMessage = reducedPage.locator('[data-testid="ribbon-reduced-message"]')
  await reducedMessage.waitFor({ state: "visible" })
  await reducedPage.waitForFunction(() => document.querySelector('[data-testid="ribbon-reduced-message"]')?.getAttribute("data-message-index") === "1", null, { timeout: 5_500 })
  assert.equal(await reducedMessage.getAttribute("href"), "/pricing?coupon=AUCTOR30")
  await reduced.close()

  const guest = await browser.newPage({ viewport: { width: 360, height: 800 } })
  await guest.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort())
  await guest.goto(`${base}/?view=today`, { waitUntil: "domcontentloaded" })
  await guest.waitForTimeout(300)
  assert.equal(await guest.locator('[data-testid="announcement-ribbon"]').count(), 0, "logged-out visitors never see the ribbon")
  await guest.close()
  console.log("Announcement ribbon browser checks passed for audience states, exclusions, shared dashboard coverage, dismissal, reduced motion, and responsive layouts.")
} finally {
  await browser.close()
}
