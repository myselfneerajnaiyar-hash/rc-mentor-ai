import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const welcome = await readFile(new URL("../app/welcome/page.jsx", import.meta.url), "utf8")
const provider = await readFile(new URL("../components/providers/TenantProvider.jsx", import.meta.url), "utf8")
const migration = await readFile(new URL("../supabase/migrations/202609120001_add_whatsapp_consent_and_normalize_phones.sql", import.meta.url), "utf8")

test("WhatsApp consent is explicit, unchecked by default, and optional", () => {
  assert.match(welcome, /useState\(false\)/)
  assert.match(welcome, /type="checkbox"/)
  assert.match(welcome, /Auctor updates, study reminders, recommendations and offers on WhatsApp/)
  assert.match(welcome, /if \(whatsappOptIn\) \{[\s\S]*\/api\/whatsapp\/enroll-trial/)
})

test("profile completion stores normalized phone and consent timestamp", () => {
  assert.match(welcome, /normalizeWhatsAppPhoneE164\(phone\)/)
  assert.match(welcome, /phone: normalizedPhone\.phone/)
  assert.match(welcome, /whatsappOptIn \? new Date\(\)\.toISOString\(\) : null/)
  assert.match(migration, /whatsapp_opt_in boolean not null default false/i)
  assert.match(migration, /whatsapp_opt_in_at timestamptz/i)
})

test("profile completion refreshes the shared dashboard context before navigation", () => {
  assert.match(provider, /const refreshContext = useCallback/)
  assert.match(provider, /cache:\s*["']no-store["']/)
  assert.match(welcome, /await refreshContext\(\)/)
  const finishProfile = welcome.slice(welcome.indexOf("async function finishProfile"))
  assert.ok(finishProfile.indexOf("await refreshContext()") < finishProfile.indexOf("router.push"))
})


test("new signup saves its profile before dashboard navigation without waiting on welcome email", () => {
  const finishProfile = welcome.slice(welcome.indexOf("async function finishProfile"), welcome.indexOf("async function persistSignupAttribution"))
  const insert = finishProfile.indexOf('.from("profiles")\n      .insert(')
  const refresh = finishProfile.indexOf("await refreshContext()")
  const email = finishProfile.indexOf('fetch("/api/send-welcome-email"')
  const dashboard = finishProfile.indexOf('router.push("/")')
  assert.ok(insert >= 0, "new account profile is inserted")
  assert.ok(insert < refresh && refresh < email && email < dashboard, "persist and refresh complete before navigation")
  assert.doesNotMatch(finishProfile.slice(email, dashboard), /await\s+fetch\("\/api\/send-welcome-email"/)
  assert.match(finishProfile.slice(email, dashboard), /\.catch\(/)
})
test("phone backfill changes only unambiguous Indian mobile formats", () => {
  assert.match(migration, /btrim\(phone\) ~ '\^\[6-9\]\[0-9\]\{9\}\$'/)
  assert.doesNotMatch(migration, /update public\.profiles[\s\S]*set whatsapp_opt_in\s*=\s*true/i)
})
