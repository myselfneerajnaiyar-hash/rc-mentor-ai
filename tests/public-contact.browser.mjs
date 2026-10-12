import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright-core"

const base = process.env.PUBLIC_TEST_URL || "http://127.0.0.1:3112"
const executablePath = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe")
const browser = await chromium.launch({ executablePath, headless: true })
const page = await browser.newPage({ viewport: { width: 320, height: 740 } })

try {
  await page.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort())
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
  console.log("Public WhatsApp header browser checks passed on preview and pricing at mobile and desktop widths.")
} finally {
  await browser.close()
}
