import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { chromium } from "playwright-core"

const base = process.env.SIGNUP_TEST_BASE_URL || "http://localhost:3210"
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "signup browser test must use a local app")
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL, "Load NEXT_PUBLIC_SUPABASE_URL for the local browser fixture")
const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
const executablePath = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].filter(Boolean).find(existsSync)
assert.ok(executablePath, "Set CHROME_PATH to a local Chrome or Edge executable")
const browser = await chromium.launch({ executablePath, headless: true })

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "student@example.test",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [{ id: "identity-1", provider: "email" }],
}
const session = {
  access_token: "local-signup-audit-token",
  refresh_token: "local-signup-audit-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
}
const branding = { brandName: "Auctor", logoUrl: "/logo.png", faviconUrl: "/icon-192.png", primaryColor: "#4f46e5", secondaryColor: "#0ea5e9", isInstitute: false }
const checks = []
const check = (condition, message) => { assert.ok(condition, message); checks.push(message); console.log("PASS", message) }

function json(route, body, status = 200) {
  const headers = { "content-type": "application/json", ...corsHeaders(route) }
  return route.fulfill({ status, headers, body: JSON.stringify(body) })
}

function corsHeaders(route) {
  if (new URL(route.request().url()).origin !== supabaseOrigin) return {}
  const requestOrigin = route.request().headers().origin || new URL(base).origin
  return {
    "access-control-allow-origin": requestOrigin,
    "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "*",
  }
}

function isAppOrigin(origin) {
  if (origin === new URL(base).origin) return true
  const actual = new URL(origin)
  const expected = new URL(base)
  return actual.port === expected.port && ["localhost", "127.0.0.1"].includes(actual.hostname) && ["localhost", "127.0.0.1"].includes(expected.hostname)
}

async function makeContext({ seedSession = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  if (seedSession) {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
    await context.addInitScript(({ ref, session }) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session)), { ref, session })
  }

  const state = {
    signupMode: "confirmation",
    signupRequests: [],
    profile: null,
    profileWrites: [],
    failNextProfileWrite: false,
    delayProfileWriteMs: 0,
    tokenMode: "session",
  }

  await context.route("**/*", async route => {
    const request = route.request()
    const url = new URL(request.url())
    const body = () => {
      try { return request.postDataJSON() } catch { return null }
    }

    if (url.origin === supabaseOrigin) {
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: {
        "access-control-allow-origin": request.headers().origin || new URL(base).origin,
        "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "*",
      } })
      if (url.pathname.endsWith("/auth/v1/signup")) {
        state.signupRequests.push({ url, body: body() })
        if (state.signupMode === "existing") return json(route, { ...user, identities: [] })
        if (state.signupMode === "error") return json(route, { code: "unexpected_failure", message: "Signup service unavailable" }, 503)
        if (state.signupMode === "authenticated") return json(route, { ...user, ...session })
        return json(route, user)
      }

      if (url.pathname.endsWith("/auth/v1/authorize")) {
        const redirectTo = url.searchParams.get("redirect_to") || `${base}/auth/callback`
        const redirect = new URL(redirectTo)
        redirect.hash = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          token_type: "bearer",
          expires_in: "3600",
        }).toString()
        return route.fulfill({ status: 302, headers: { location: redirect.toString() } })
      }

      if (url.pathname.endsWith("/auth/v1/user")) return json(route, user)
      if (url.pathname.endsWith("/auth/v1/token")) return json(route, session)

      if (url.pathname.endsWith("/rest/v1/profiles")) {
        if (request.method() === "GET") return json(route, state.profile || [])
        if (request.method() === "POST" || request.method() === "PATCH") {
          state.profileWrites.push({ method: request.method(), body: body() })
          if (state.delayProfileWriteMs) await new Promise(resolve => setTimeout(resolve, state.delayProfileWriteMs))
          if (state.failNextProfileWrite) {
            state.failNextProfileWrite = false
            return json(route, { message: "Temporary profile save failure" }, 503)
          }
          const row = Array.isArray(body()) ? body()[0] : body()
          const storedRow = { ...row, phone: /^\d{10}$/.test(row.phone) ? `+91${row.phone}` : row.phone }
          state.profile = state.profile ? { ...state.profile, ...storedRow } : storedRow
          return route.fulfill({ status: request.method() === "POST" ? 201 : 204, headers: corsHeaders(route), body: request.method() === "POST" ? "[]" : "" })
        }
      }

      if (url.pathname.endsWith("/rest/v1/rpc/capture_signup_attribution")) return route.fulfill({ status: 204, headers: corsHeaders(route), body: "" })
      return json(route, {})
    }

    if (isAppOrigin(url.origin)) {
      if (url.pathname === "/api/tenant-context") return json(route, { tenant: { kind: "b2c", hostname: "localhost" }, branding })
      if (url.pathname === "/api/session-context") return json(route, { user, profile: state.profile, tenant: { kind: "b2c", hostname: "localhost" }, branding, exam: "CAT", capabilities: { exam: "CAT", isCAT: true }, entitlement: { hasAccess: true, isPremium: false } })
      if (url.pathname === "/api/send-welcome-email" || url.pathname === "/api/whatsapp/enroll-trial") return json(route, { ok: true })
      return route.continue()
    }

    return route.abort()
  })
  return { context, state }
}

async function openProfileWizard(page, path = "/welcome") {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" })
  await page.locator('input[placeholder="Enter your Name"]').waitFor({ state: "visible" })
  await page.locator('input[placeholder="Enter your Name"]').fill("Test Student")
  for (let step = 0; step < 3; step += 1) await page.getByRole("button", { name: /Next/ }).click()
  await page.getByRole("textbox", { name: "Mobile number" }).waitFor({ state: "visible" })
}

try {
  {
    const { context, state } = await makeContext()
    const page = await context.newPage()
    state.signupMode = "confirmation"
    await page.goto(`${base}/signup?next=%2Finbox&utm_source=signup-audit`, { waitUntil: "networkidle" })
    await page.locator("#signup-email").fill("new@example.test")
    await page.locator("#signup-password").fill("correct-horse-battery")
    await page.getByRole("button", { name: "Create account" }).click()
    await page.getByRole("status").waitFor({ state: "visible" })
    check(new URL(page.url()).pathname === "/signup", "confirmation-required signup stays on signup instead of sending the student to Login")
    check((await page.getByRole("status").textContent()).includes("confirmation link will continue to profile setup"), "confirmation-required signup explains the direct profile handoff")
    const redirectTo = state.signupRequests[0]?.url.searchParams.get("redirect_to")
    check(redirectTo && new URL(redirectTo).pathname === "/auth/callback" && new URL(redirectTo).searchParams.get("next") === "/inbox", "signup confirmation keeps its callback and destination parameters")

    state.signupMode = "existing"
    await page.locator("#signup-email").fill("new@example.test")
    await page.locator("#signup-password").fill("correct-horse-battery")
    await page.getByRole("button", { name: "Create account" }).click()
    await page.locator(".auth-error").waitFor({ state: "visible" })
    check((await page.locator(".auth-error").textContent()).includes("User already exists. Please log in."), "existing email shows the required inline message")
    check(await page.locator(".auth-error").getByRole("link", { name: "log in" }).isVisible(), "existing-email message contains a working Login link")
    await context.close()
  }

  {
    const { context, state } = await makeContext()
    const page = await context.newPage()
    state.signupMode = "authenticated"
    await page.goto(`${base}/signup`, { waitUntil: "networkidle" })
    await page.locator("#signup-email").fill("new@example.test")
    await page.locator("#signup-password").fill("correct-horse-battery")
    await page.getByRole("button", { name: "Create account" }).click()
    await page.waitForURL(url => new URL(url).pathname === "/welcome")
    check(new URL(page.url()).pathname === "/welcome", "signup with an immediate Supabase session goes directly to Welcome")

    await page.goto(`${base}/signup`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Continue with Google" }).click()
    await page.waitForURL(url => new URL(url).pathname === "/welcome", { timeout: 30000 })
    await page.locator('input[placeholder="Enter your Name"]').waitFor({ state: "visible" })
    check(new URL(page.url()).pathname === "/welcome", "Google OAuth callback reaches authenticated profile setup without a redirect loop")
    await context.close()
  }

  {
    const { context } = await makeContext()
    const page = await context.newPage()
    await page.goto(`${base}/login?next=%2Finbox`, { waitUntil: "networkidle" })
    await page.locator("#login-email").fill("student@example.test")
    await page.locator("#login-password").fill("correct-horse-battery")
    await page.getByRole("button", { name: "Login", exact: true }).click()
    await page.waitForURL(url => new URL(url).pathname === "/welcome", { timeout: 30000 })
    await page.locator('input[placeholder="Enter your Name"]').waitFor({ state: "visible" })
    check(new URL(page.url()).searchParams.get("next") === "/inbox", "password login still reaches Welcome and preserves its post-login destination")
    await context.close()
  }

  {
    const { context, state } = await makeContext({ seedSession: true })
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    await openProfileWizard(page, "/welcome?next=%2Finbox")

    const finish = page.getByRole("button", { name: /Finish/ })
    await finish.click()
    check(await page.getByText("Mobile number is required.", { exact: true }).isVisible(), "empty phone is blocked with the required message")
    await page.getByRole("textbox", { name: "Mobile number" }).fill("987654321")
    await finish.click()
    check(await page.getByText("Please enter a valid 10-digit mobile number.", { exact: true }).isVisible(), "nine-digit phone is blocked")
    await page.getByRole("textbox", { name: "Mobile number" }).fill("98765432101")
    await finish.click()
    check(await page.getByText("Please enter a valid 10-digit mobile number.", { exact: true }).isVisible(), "eleven-digit phone is blocked")
    await page.getByRole("textbox", { name: "Mobile number" }).fill("+919876543210")
    await finish.click()
    check(await page.getByText("Please enter a valid 10-digit mobile number.", { exact: true }).isVisible(), "+91 phone input is rejected without normalization")
    await page.getByRole("textbox", { name: "Mobile number" }).fill("98765 43210")
    await finish.click()
    check(await page.getByText("Please enter a valid 10-digit mobile number.", { exact: true }).isVisible(), "phone whitespace is rejected without normalization")
    check(state.profileWrites.length === 0, "invalid phone submissions never reach the database")

    await page.getByRole("textbox", { name: "Mobile number" }).fill("9876543210")
    await page.getByRole("checkbox").check()
    state.failNextProfileWrite = true
    state.delayProfileWriteMs = 300
    const finishClick = finish.click()
    await page.waitForRequest(request => request.url().includes("/rest/v1/profiles") && request.method() === "POST")
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find(candidate => candidate.textContent.includes("Saving"))
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    await finishClick
    await page.getByText("We couldn't save your profile. Check your connection and try again.", { exact: true }).waitFor({ state: "visible" })
    check(state.profileWrites.length === 1, "rapid repeat clicks produce a single profile write")
    check(!await finish.isDisabled(), "failed save re-enables Finish for retry")

    state.delayProfileWriteMs = 0
    await finish.click()
    await page.waitForURL(url => new URL(url).pathname === "/inbox", { timeout: 30000 })
    const saved = Array.isArray(state.profileWrites[1].body) ? state.profileWrites[1].body[0] : state.profileWrites[1].body
    check(saved.phone === "9876543210" && state.profile.phone === "+919876543210" && saved.profile_completed === true, "retry saves ten raw digits which the database stores canonically")
    check(saved.whatsapp_opt_in === true && Boolean(saved.whatsapp_opt_in_at), "retry saves the opted-in communication consent and timestamp")
    check(errors.length === 0, "profile setup browser flow has no uncaught errors")
    await context.close()
  }

  {
    const { context, state } = await makeContext({ seedSession: true })
    const originalStart = "2026-10-01T12:00:00.000Z"
    const originalExpiry = "2026-10-04T12:00:00.000Z"
    state.profile = {
      id: "profile-existing",
      user_id: user.id,
      name: "Existing Student",
      phone: "+919876543210",
      profile_completed: false,
      trial_started_at: originalStart,
      trial_expires_at: originalExpiry,
      whatsapp_opt_in: false,
      whatsapp_opt_in_at: null,
    }
    const page = await context.newPage()
    await openProfileWizard(page)
    await page.getByRole("textbox", { name: "Mobile number" }).fill("9876543210")
    await page.getByRole("button", { name: /Finish/ }).click()
    await page.waitForURL(url => new URL(url).pathname === "/", { timeout: 30000 })
    const update = state.profileWrites[0]
    check(update.method === "PATCH" && !("trial_days" in update.body) && !("trial_expires_at" in update.body), "existing profile completion does not restart an existing trial")
    check(state.profile.trial_started_at === originalStart && state.profile.trial_expires_at === originalExpiry, "existing profile trial dates remain intact")
    await context.close()
  }

  console.log(`PASS ${checks.length} signup and profile onboarding browser checks`)
} finally {
  await browser.close()
}
