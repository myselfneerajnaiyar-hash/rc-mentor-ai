import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { chromium } from "playwright-core"

const env = await readFile(".env.local", "utf8")
const supabaseUrl = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "")
const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "local"
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true })
const results = []

try {
  for (const exam of ["CAT", "CLAT"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    await page.addInitScript(({ key, examValue }) => {
      localStorage.setItem(key, JSON.stringify({
        access_token: "pricing-browser-test-token",
        refresh_token: "pricing-browser-test-refresh",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: "pricing-browser-test-user", aud: "authenticated", role: "authenticated", email: "pricing-test@example.com" },
      }))
      window.__pricingTestExam = examValue
    }, { key: `sb-${projectRef}-auth-token`, examValue: exam })

    await page.route("**/api/tenant-context", (route) => route.fulfill({ json: {
      tenant: { kind: "b2c", hostname: "localhost" },
      branding: { primaryColor: "#7c3aed", secondaryColor: "#06b6d4", faviconUrl: "/icon-192.png" },
    } }))
    await page.route("**/auth/v1/user", (route) => route.fulfill({ json: {
      id: "pricing-browser-test-user", aud: "authenticated", role: "authenticated", email: "pricing-test@example.com",
    } }))
    await page.route("**/api/session-context", (route) => {
      const isCat = exam === "CAT"
      return route.fulfill({ json: {
        user: { id: "pricing-browser-test-user", email: "pricing-test@example.com" },
        profile: { exam },
        exam,
        capabilities: { exam, isCAT: isCat, showDailyRC: isCat, showCATSectionals: isCat },
        entitlement: { kind: "none", hasAccess: false, isPremium: false, isInstituteStudent: false, hasCATSectionalAccess: false },
        tenant: { kind: "b2c", hostname: "localhost" },
        branding: { primaryColor: "#7c3aed", secondaryColor: "#06b6d4", faviconUrl: "/icon-192.png" },
      } })
    })
    await page.route("**/api/validate-coupon", (route) => route.fulfill({ json: {
      valid: true, code: "AUCTOR30", discountPercent: 30,
    } }))
    await page.goto("http://localhost:3220/pricing", { waitUntil: "domcontentloaded", timeout: 60000 })
    await page.locator("[data-plan]").first().waitFor()

    for (const width of [1440, 1280, 390, 375]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.waitForTimeout(100)
      const layout = await page.evaluate(() => {
        const cards = [...document.querySelectorAll("[data-plan]")]
        return {
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          scrollY: window.scrollY,
          headerBottom: Math.round(document.querySelector("header")?.getBoundingClientRect().bottom || 0),
          headingTop: Math.round(document.querySelector("main h1")?.getBoundingClientRect().top || 0),
          cardCount: cards.length,
          cardTops: cards.map((card) => Math.round(card.getBoundingClientRect().top)),
          plans: cards.map((card) => ({ id: card.dataset.plan, text: card.innerText })),
        }
      })
      assert.equal(layout.cardCount, 4, `${exam} at ${width}px should show four plan cards`)
      assert.ok(layout.pageWidth <= layout.viewportWidth, `${exam} at ${width}px should not overflow horizontally`)
      assert.ok(layout.headingTop > layout.headerBottom, `${exam} at ${width}px heading should clear the fixed header`)
      if (width >= 1280) assert.equal(new Set(layout.cardTops).size, 1, `${exam} at ${width}px should keep four cards in one row`)
      else assert.equal(new Set(layout.cardTops).size, 4, `${exam} at ${width}px should stack cards`)
      const monthly = layout.plans.find((plan) => plan.id === "monthly").text
      const quarterly = layout.plans.find((plan) => plan.id === "quarterly").text
      assert.equal(monthly.includes("45-Day VARC Bootcamp"), exam === "CAT")
      assert.equal(monthly.includes("CAT VARC Test Series"), false)
      assert.equal(quarterly.includes("45-Day VARC Bootcamp"), exam === "CAT")
      assert.equal(quarterly.includes("CAT VARC Test Series"), exam === "CAT")
      if (exam === "CAT" && width === 390) await page.screenshot({ path: ".tmp-pricing-cat-mobile.png", fullPage: true })
      if (exam === "CLAT" && width === 1440) await page.screenshot({ path: ".tmp-pricing-noncat-desktop.png", fullPage: true })
      results.push(`${exam} ${width}px: 4 cards, ${width >= 1280 ? "one row" : "stacked"}, no overflow (header ${layout.headerBottom}px, heading ${layout.headingTop}px)`)
    }
    await page.getByRole("button", { name: "Apply" }).click()
    await page.locator('[role="status"]').waitFor({ state: "visible", timeout: 5000 })
    const discountedPrice = await page.locator('[data-plan="monthly"]').innerText()
    assert.match(discountedPrice, /YOU PAY[\s\S]*₹319\.20[\s\S]*₹399/)
    await page.close()
  }
} finally {
  await browser.close()
}

console.log(results.join("\n"))
