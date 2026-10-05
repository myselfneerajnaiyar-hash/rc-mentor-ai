import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import { classifySignupResult, runSingleFlight, validateMobileNumber } from "../lib/onboarding/profileValidation.mjs"

const signup = await readFile(new URL("../app/signup/page.jsx", import.meta.url), "utf8")
const callback = await readFile(new URL("../app/auth/callback/route.js", import.meta.url), "utf8")
const login = await readFile(new URL("../app/login/page.jsx", import.meta.url), "utf8")
const welcome = await readFile(new URL("../app/welcome/page.jsx", import.meta.url), "utf8")
const phoneMigration = await readFile(new URL("../supabase/migrations/202610060001_validate_profile_phone_writes.sql", import.meta.url), "utf8")

test("signup distinguishes immediate sessions, confirmation, existing users, and errors", () => {
  const user = { id: "u1", identities: [{ id: "i1" }] }
  assert.equal(classifySignupResult({ data: { user, session: { access_token: "token" } }, error: null }).type, "authenticated")
  assert.equal(classifySignupResult({ data: { user, session: null }, error: null }).type, "confirmation_required")
  assert.equal(classifySignupResult({ data: { user: { ...user, identities: [] }, session: null }, error: null }).type, "existing_user")
  assert.equal(classifySignupResult({ data: null, error: { status: 409, message: "Conflict" } }).type, "existing_user")
  assert.equal(classifySignupResult({ data: null, error: { message: "Auth service unavailable" } }).type, "error")
})

test("phone input accepts exactly ten digits and rejects blank, country codes, spaces, and non-digits", () => {
  assert.deepEqual(validateMobileNumber("9876543210"), { ok: true })
  assert.equal(validateMobileNumber("").message, "Mobile number is required.")
  for (const invalid of ["987654321", "98765432101", "+919876543210", "+91 9876543210", " 9876543210", "98765 43210", "abc1234567"]) {
    assert.equal(validateMobileNumber(invalid).ok, false, `rejected ${JSON.stringify(invalid)}`)
    assert.equal(validateMobileNumber(invalid).message, "Please enter a valid 10-digit mobile number.")
  }
})

test("single-flight prevents duplicate saves and releases the lock after failures for retry", async () => {
  const ref = { current: null }
  let calls = 0
  let release
  const first = () => {
    calls += 1
    return new Promise((resolve, reject) => { release = calls === 1 ? resolve : reject })
  }
  const one = runSingleFlight(ref, first)
  const duplicate = runSingleFlight(ref, first)
  assert.equal(one, duplicate)
  await Promise.resolve()
  assert.equal(calls, 1)
  release("saved")
  assert.equal(await one, "saved")
  assert.equal(ref.current, null)

  const failed = runSingleFlight(ref, first)
  await Promise.resolve()
  release(new Error("save failed"))
  await assert.rejects(failed, /save failed/)
  assert.equal(ref.current, null)
  const retry = runSingleFlight(ref, async () => { calls += 1; return "retry saved" })
  assert.equal(await retry, "retry saved")
  assert.equal(calls, 3)
})

test("signup sends confirmation to the welcome callback and routes authenticated signup directly", () => {
  assert.match(signup, /emailRedirectTo:/)
  assert.match(signup, /classifySignupResult\(\{ data, error: signupError \}\)/)
  assert.match(signup, /router\.replace\(buildAttributedPath\("\/welcome"/)
  assert.match(signup, /confirmation link will continue to profile setup/)
  assert.match(signup, /User already exists\. Please <a href=\{loginHref\}>log in<\/a>\./)
  assert.match(signup, /<a href=\{loginHref\}>Login<\/a>/)
  assert.doesNotMatch(signup, /alert\("Check your email/)
})

test("OAuth and confirmation callbacks let the browser persist the session before profile setup", () => {
  assert.match(callback, /destination = new URL\("\/welcome"/)
  assert.match(callback, /\["code", "error", "error_code", "error_description"\]/)
  assert.doesNotMatch(callback, /exchangeCodeForSession/)
  assert.match(login, /signInWithOAuth/)
  assert.match(login, /\/auth\/callback/)
  assert.match(welcome, /supabase\.auth\.getSession\(\)/)
  assert.match(welcome, /supabase\.auth\.exchangeCodeForSession\(code\)/)
  assert.match(welcome, /window\.history\.replaceState/)
  assert.match(welcome, /router\.replace\(loginPath\)/)
})

test("finish validates before writing, preserves consent, prevents duplicate saves, and recovers from errors", () => {
  assert.match(welcome, /validateMobileNumber\(phone\)/)
  assert.match(welcome, /runSingleFlight\(finishProfileRequest/)
  assert.match(welcome, /phone,/)
  assert.match(welcome, /profile_completed: true/)
  assert.match(welcome, /whatsapp_opt_in: whatsappOptIn/)
  assert.match(welcome, /whatsapp_opt_in_at: whatsappOptInAt/)
  assert.match(welcome, /We couldn't save your profile\. Check your connection and try again\./)
  assert.match(welcome, /finally \{\s*setSavingProfile\(false\)/)
  assert.match(welcome, /disabled=\{savingProfile\}/)
  assert.match(welcome, /inputMode="numeric"/)
  assert.doesNotMatch(welcome, /maxLength=\{10\}/)
  assert.doesNotMatch(welcome, /disabled=\{!phone\.trim\(\)\}/)
  assert.match(phoneMigration, /before insert or update of phone, profile_completed/i)
  assert.match(phoneMigration, /new\.phone !~ '\^\[0-9\]\{10\}\$'/i)
  assert.match(phoneMigration, /new\.phone !~ '\^\\\+\[1-9\]\[0-9\]\{7,14\}\$'/i)
})

test("database trigger enforces ten raw digits for authenticated writes and preserves canonical E.164 storage", async () => {
  const db = new PGlite()
  try {
    await db.exec("create role authenticated; create role service_role;")
    await db.exec("create table public.profiles (id integer generated by default as identity primary key, name text, phone text, profile_completed boolean not null default false);")
    await db.exec("grant select, insert, update on public.profiles to authenticated, service_role;")
    await db.exec("insert into public.profiles(name, phone, profile_completed) values ('Legacy', 'bad legacy value', true);")
    await db.exec(phoneMigration)
    await db.exec("set role authenticated;")
    await assert.rejects(db.exec("insert into public.profiles(name, phone, profile_completed) values ('Eleven digits', '98765432101', true);"), /exactly 10 digits/)
    await assert.rejects(db.exec("insert into public.profiles(name, phone, profile_completed) values ('Country code', '+919876543210', true);"), /exactly 10 digits/)
    await assert.rejects(db.exec("insert into public.profiles(name, phone, profile_completed) values ('Formatted', '+91 9876543210', true);"), /exactly 10 digits/)
    await assert.rejects(db.exec("insert into public.profiles(name, phone, profile_completed) values ('Nine digits', '987654321', true);"), /exactly 10 digits/)
    await assert.rejects(db.exec("insert into public.profiles(name, phone, profile_completed) values ('Missing', null, true);"), /A phone number is required/)
    await db.exec("insert into public.profiles(name, phone, profile_completed) values ('Incomplete', null, false), ('Student', '9876543210', true);")
    const storedPhone = (await db.query("select phone from public.profiles where name = 'Student'")).rows[0].phone
    assert.equal(storedPhone, "+919876543210")
    await db.exec("update public.profiles set name = 'Legacy edited' where name = 'Legacy';")
    await assert.rejects(db.exec("update public.profiles set phone = '+919876543210' where name = 'Student';"), /exactly 10 digits/)
    await db.exec("set role postgres;")
    await db.exec("insert into public.profiles(name, phone, profile_completed) values ('Service write', '+919876543210', true);")
  } finally {
    await db.close()
  }
})
