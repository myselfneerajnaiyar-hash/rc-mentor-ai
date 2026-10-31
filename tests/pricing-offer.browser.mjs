import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright-core"

const base = process.env.PRICING_TEST_URL || "http://127.0.0.1:3112"
const executablePath = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe")
const browser = await chromium.launch({ executablePath, headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
let couponValidationCalls = 0

try {
  await page.route("**/*", route => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.pathname === "/api/validate-coupon") {
      couponValidationCalls += 1
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true, code: "AUCTOR20", discountPercent: 20 }),
      })
    }
    if (requestUrl.pathname === "/api/tenant-context") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tenant: { kind: "public", hostname: "localhost" }, branding: {} }) })
    }
    return requestUrl.origin === new URL(base).origin ? route.continue() : route.abort()
  })
  await page.goto(`${base}/pricing?offer=bootcamp&coupon=AUCTOR20&utm_source=qa&utm_campaign=offer-check`, { waitUntil: "networkidle" })
  const quarterly = page.locator('[data-plan="quarterly"]')
  await quarterly.waitFor({ state: "visible" })
  assert.equal(await page.getByLabel("Referral Code (Optional)").count(), 0, "pricing has no referral input")
  assert.equal(await page.getByText("Apply Referral", { exact: true }).count(), 0, "pricing has no referral action")
  assert.equal(await page.locator('input[placeholder="Enter coupon code"]').inputValue(), "AUCTOR20", "coupon query pre-fills the input")
  await page.getByText(/AUCTOR20 applied/).waitFor({ state: "visible" })
  assert.equal(couponValidationCalls, 1, "pricing validates the linked coupon automatically")
  assert.equal(await page.locator('[aria-label="Subscription plans"]').getAttribute("data-selected-plan"), "quarterly")
  assert.match(await quarterly.innerText(), /₹639\.20/)
  assert.match(await quarterly.innerText(), /20% coupon applied/)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pricing fits a 390px mobile viewport")

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "offer fits a 1440px desktop viewport")
  assert.equal(new URL(page.url()).searchParams.get("utm_campaign"), "offer-check", "campaign parameters remain on the pricing page")

  console.log("Pricing offer browser checks passed at 390px and 1440px.")
} finally {
  await browser.close()
}
