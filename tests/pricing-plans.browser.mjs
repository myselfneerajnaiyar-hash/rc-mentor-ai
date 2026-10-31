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
    const createOrderRequests = []
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
      window.Razorpay = class {
        constructor(options) { window.__pricingCheckoutOptions = options }
        open() {}
      }
    }, { key: `sb-${projectRef}-auth-token`, examValue: exam })

    await page.route(/https:\/\/.*(posthog|facebook|reddit)/i, (route) => route.abort())

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
    await page.route("**/api/create-order", async (route) => {
      const request = route.request().postDataJSON()
      createOrderRequests.push(request)
      const amounts = { monthly: 27930, quarterly: 55930, half_yearly: 90930, yearly: 139930 }
      await route.fulfill({ json: { id: "order_pricing_browser_test", amount: amounts[request.plan], currency: "INR" } })
    })
    await page.goto("http://localhost:3220/pricing", { waitUntil: "domcontentloaded", timeout: 60000 })
    await page.locator("[data-plan]").first().waitFor()
    assert.equal(await page.locator('[aria-label="Subscription plans"]').getAttribute("data-selected-plan"), "quarterly", `${exam} should default to 3 Month`)
    assert.deepEqual(await page.locator("[data-plan]").evaluateAll((cards) => cards.map((card) => card.dataset.plan)), ["quarterly", "monthly", "half_yearly", "yearly"])
    assert.equal(await page.locator('[data-plan="quarterly"]').getAttribute("data-selected"), "true")
    assert.match(await page.locator('[data-plan="quarterly"]').innerText(), /3 Month/)
    assert.match(await page.locator('[data-plan="quarterly"] button').last().innerText(), /Continue with 3 Month/)

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
    await page.locator('[role="status"]').waitFor({ state: "visible", timeout: 5000 })
    assert.match(await page.locator('[role="status"]').innerText(), /AUCTOR30 applied/)
    const discountedPrice = await page.locator('[data-plan="monthly"]').innerText()
    assert.match(discountedPrice, /YOU PAY[\s\S]*279\.30[\s\S]*399/)

    await page.getByRole("button", { name: "Select Monthly" }).click()
    assert.equal(await page.locator('[aria-label="Subscription plans"]').getAttribute("data-selected-plan"), "monthly")
    const monthlyCheckout = page.locator('[data-plan="monthly"] button').last()
    assert.match(await monthlyCheckout.innerText(), /Continue with Monthly.*279\.30/)
    await monthlyCheckout.click()
    await page.waitForFunction(() => window.__pricingCheckoutOptions?.order_id === "order_pricing_browser_test")
    assert.equal(createOrderRequests[0].plan, "monthly", "checkout should submit the selected internal plan id")
    assert.equal(createOrderRequests[0].couponCode, "AUCTOR30", "checkout should retain the applied coupon")
    assert.equal(await page.evaluate(() => window.__pricingCheckoutOptions.amount), 27930, "Razorpay amount should match the selected plan and coupon")

    await page.getByRole("button", { name: "Select 3 Month" }).click()
    assert.match(await page.locator('[data-plan="quarterly"] button').last().innerText(), /Continue with 3 Month.*559\.30/)
    await page.goto("http://localhost:3220/pricing?plan=monthly&source=website", { waitUntil: "domcontentloaded" })
    await page.locator("[data-plan]").first().waitFor()
    assert.equal(await page.locator('[aria-label="Subscription plans"]').getAttribute("data-selected-plan"), "monthly", "website plan selection should carry through to app pricing")
    assert.equal(await page.locator('[data-plan="monthly"]').getAttribute("data-selected"), "true")
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.locator("[data-plan]").first().waitFor()
    assert.equal(await page.locator('[aria-label="Subscription plans"]').getAttribute("data-selected-plan"), "monthly", "refresh should preserve the requested external plan")
    await page.goto("http://localhost:3220/pricing", { waitUntil: "domcontentloaded" })
    await page.locator("[data-plan]").first().waitFor()
    assert.equal(await page.locator('[aria-label="Subscription plans"]').getAttribute("data-selected-plan"), "quarterly", "refresh should restore the intended default")
    await page.close()
  }
} finally {
  await browser.close()
}

console.log(results.join("\n"))
