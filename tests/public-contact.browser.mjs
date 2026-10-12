import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import dotenv from "dotenv"
import { chromium } from "playwright-core"

const base = process.env.PUBLIC_TEST_URL || "http://127.0.0.1:3112"
dotenv.config({ path: ".env.local", quiet: true })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
assert.ok(supabaseUrl, "local Supabase URL is available for the homepage browser fixture")
const supabaseProjectRef = new URL(supabaseUrl).hostname.split(".")[0]
const testUser = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "homepage-contact@example.test",
  created_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
}
const executablePath = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe")
const browser = await chromium.launch({ executablePath, headless: true })
const page = await browser.newPage({ viewport: { width: 320, height: 740 } })

try {
  await page.route("**/*", route => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.pathname === "/api/tenant-context") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tenant: { kind: "public", hostname: "localhost" }, branding: { brandName: "Auctor RC", faviconUrl: "/icon-192.png", isInstitute: false } }) })
    }
    if (requestUrl.pathname === "/api/session-context") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        user: { id: testUser.id, email: testUser.email },
        profile: { user_id: testUser.id, name: "QA", exam: "CAT", attempt_year: "2026" },
        tenant: { kind: "public", hostname: "localhost" },
        branding: { brandName: "Auctor RC", faviconUrl: "/icon-192.png", isInstitute: false },
        exam: "CAT",
        capabilities: { exam: "CAT", isCAT: true, showDailyRC: true, showCATSectionals: true },
        entitlement: { kind: "none", hasAccess: false, isPremium: false, isInstituteStudent: false },
      }) })
    }
    if (requestUrl.hostname === new URL(supabaseUrl).hostname && requestUrl.pathname === "/auth/v1/user") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(testUser) })
    }
    return requestUrl.origin === new URL(base).origin ? route.continue() : route.abort()
  })
  await page.goto(`${base}/preview`, { waitUntil: "domcontentloaded" })
  const contact = page.getByRole("link", { name: "Chat with us on WhatsApp" })
  await contact.waitFor({ state: "visible" })
  assert.equal(await contact.getAttribute("href"), "https://wa.me/917975369704")
  assert.equal(await contact.getAttribute("target"), "_blank")
  assert.equal(await page.getByText("Chat with us", { exact: true }).isVisible(), true, "mobile header visibly labels the contact action")

  for (const width of [320, 375, 390, 1440]) {
    await page.setViewportSize({ width, height: 740 })
    assert.equal(await contact.isVisible(), true, `WhatsApp contact remains visible at ${width}px`)
    const fits = await contact.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const header = element.closest("header")
      return {
        left: rect.left,
        right: rect.right,
        viewport: innerWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
        headerScrollWidth: header.scrollWidth,
        headerWidth: header.getBoundingClientRect().width,
        children: Array.from(header.querySelectorAll(":scope > div > *")).map(child => {
          const childRect = child.getBoundingClientRect()
          return { left: childRect.left, right: childRect.right, display: getComputedStyle(child).display }
        }),
      }
    })
    assert.ok(fits.left >= 0 && fits.right <= width && fits.headerScrollWidth <= fits.headerWidth, `header fits ${width}px without horizontal overflow: ${JSON.stringify(fits)}`)
  }

  await page.goto(`${base}/pricing`, { waitUntil: "domcontentloaded" })
  const pricingContact = page.getByRole("link", { name: "Chat with us on WhatsApp" })
  await pricingContact.waitFor({ state: "visible" })
  assert.equal(await pricingContact.getAttribute("href"), "https://wa.me/917975369704")
  await page.setViewportSize({ width: 320, height: 740 })
  assert.equal(await page.getByText("Chat with us", { exact: true }).isVisible(), true, "pricing mobile header visibly labels contact")
  await page.setViewportSize({ width: 1440, height: 740 })
  assert.equal(await page.getByText("Chat with us on WhatsApp", { exact: true }).isVisible(), true, "pricing desktop header shows full contact label")

  await page.evaluate(({ storageKey, user }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: "homepage-browser-test-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "homepage-browser-test-refresh",
      user,
    }))
  }, { storageKey: `sb-${supabaseProjectRef}-auth-token`, user: testUser })
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" })
  const homeContact = page.getByRole("link", { name: "Chat with us on WhatsApp" })
  await homeContact.waitFor({ state: "visible" })
  assert.equal(await homeContact.getAttribute("href"), "https://wa.me/917975369704")
  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 740 })
    assert.equal(await homeContact.isVisible(), true, `homepage WhatsApp contact is visible at ${width}px`)
    const layout = await homeContact.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const header = element.closest(".dashboard-mobile-header, .space-y-6")
      const headerRect = header?.getBoundingClientRect()
      const logo = header?.querySelector("img")?.getBoundingClientRect()
      const login = Array.from(header?.querySelectorAll("button") || []).find(button => button.textContent.trim() === "Login")?.getBoundingClientRect()
      const intersects = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
      return {
        visibleText: getComputedStyle(element.querySelector("span")).display !== "none",
        link: { left: rect.left, right: rect.right },
        header: headerRect && { left: headerRect.left, right: headerRect.right },
        headerClientWidth: header?.clientWidth,
        headerScrollWidth: header?.scrollWidth,
        logoOverlap: intersects(rect, logo),
        loginOverlap: intersects(rect, login),
      }
    })
    assert.ok(layout.link.left >= 0 && layout.link.right <= width, `homepage link stays in viewport at ${width}px: ${JSON.stringify(layout)}`)
    assert.equal(layout.logoOverlap, false, `homepage contact does not overlap the logo at ${width}px`)
    assert.equal(layout.loginOverlap, false, `homepage contact does not overlap Login at ${width}px`)
    assert.ok(layout.headerScrollWidth <= layout.headerClientWidth, `homepage header has no horizontal overflow at ${width}px: ${JSON.stringify(layout)}`)
    assert.equal(layout.visibleText, width >= 768, `homepage contact uses compact text visibility at ${width}px`)
  }
  console.log("WhatsApp contact browser checks passed on preview, pricing and homepage at mobile and desktop widths.")
} finally {
  await browser.close()
}
