import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright-core"

const base = process.env.PRICING_TEST_URL || "http://127.0.0.1:3112"
const executablePath = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe")
const browser = await chromium.launch({ executablePath, headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

try {
  await page.route("**/*", route => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.pathname === "/api/validate-coupon") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid: true, code: "AUCTOR20", discountPercent: 20 }),
      })
    }
    return requestUrl.origin === new URL(base).origin ? route.continue() : route.abort()
  })
  await page.goto(`${base}/pricing?offer=bootcamp&coupon=AUCTOR20&utm_source=qa&utm_campaign=offer-check`, { waitUntil: "networkidle" })
  const offer = page.getByRole("heading", { name: "45-Day VARC Boot Camp + 3 Months of Full Auctor Access" })
  await offer.waitFor({ state: "visible" })
  await page.getByText(/AUCTOR20 applied/).waitFor({ state: "visible" })
  assert.equal(await page.getByText("MORE THAN A BOOT CAMP", { exact: true }).count(), 1)
  assert.equal(await page.getByText("Get the 45-Day VARC Boot Camp plus 3 months of full Auctor platform access.", { exact: false }).count(), 1)
  assert.ok(await page.getByText("₹639.20", { exact: true }).count() >= 2, "Bootcamp and quarterly prices show the coupon total")
  assert.ok(await page.getByText(/₹159\.80/).count() >= 1, "coupon breakdown shows the exact discount")
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "offer fits a 390px mobile viewport")

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(100)
  assert.equal(await offer.isVisible(), true)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "offer fits a 1440px desktop viewport")
  assert.equal(new URL(page.url()).searchParams.get("utm_campaign"), "offer-check", "campaign parameters remain on the pricing page")
  console.log("Pricing offer browser checks passed at 390px and 1440px.")
} finally {
  await browser.close()
}
