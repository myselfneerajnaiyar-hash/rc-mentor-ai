import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import { classifySignupResult, ensureSignupSession, runSingleFlight, validateMobileNumber, validateSignupForm } from "../lib/onboarding/profileValidation.mjs"

const signup = await readFile(new URL("../app/signup/page.jsx", import.meta.url), "utf8")
const previewSignup = await readFile(new URL("../app/preview-ad/PreviewAdSignupExperience.jsx", import.meta.url), "utf8")
const callback = await readFile(new URL("../app/auth/callback/route.js", import.meta.url), "utf8")
const login = await readFile(new URL("../app/login/page.jsx", import.meta.url), "utf8")
const welcome = await readFile(new URL("../app/welcome/page.jsx", import.meta.url), "utf8")
const phoneMigration = await readFile(new URL("../supabase/migrations/202610060001_validate_profile_phone_writes.sql", import.meta.url), "utf8")

function signupFormValues(values) {
  return { elements: { namedItem: name => values[name] === undefined ? null : { value: values[name] } } }
}

test("signup validation reads current form values when React state is stale after autofill", () => {
  const result = validateSignupForm(signupFormValues({
    email: "  New.Student+RC@GMAIL.COM  ",
    password: "Strong Test Password!",
  }), { email: "", password: "" })

  assert.deepEqual(result, {
    email: "new.student+rc@gmail.com",
    password: "Strong Test Password!",
    fieldErrors: {},
  })
})

test("signup validation preserves normalized values typed into the form", () => {
  const result = validateSignupForm(signupFormValues({
    email: "  Student.Name@gmail.com ",
    password: "Typed password 123!",
  }), { email: "  Student.Name@gmail.com ", password: "Typed password 123!" })

  assert.deepEqual(result, {
    email: "student.name@gmail.com",
    password: "Typed password 123!",
    fieldErrors: {},
  })
})

test("signup validation rejects malformed email without weakening the current rule", () => {
  const result = validateSignupForm(signupFormValues({
    email: "student@gmail",
    password: "Valid non-empty password",
  }))

  assert.deepEqual(result.fieldErrors, { email: "Enter a valid email address." })
})

test("signup validation reports both required field errors when inputs are empty", () => {
  const result = validateSignupForm(signupFormValues({
    email: "",
    password: "",
  }), { email: "stale@gmail.com", password: "stale password" })

  assert.deepEqual(result.fieldErrors, {
    email: "Enter a valid email address.",
    password: "Enter a password.",
  })
})

test("signup distinguishes immediate sessions, confirmation, existing users, and errors", () => {
  const user = { id: "u1", identities: [{ id: "i1" }] }
  assert.equal(classifySignupResult({ data: { user, session: { access_token: "token" } }, error: null }).type, "authenticated")
  assert.equal(classifySignupResult({ data: { user, session: null }, error: null }).type, "confirmation_required")
  assert.equal(classifySignupResult({ data: { user: { ...user, identities: [] }, session: null }, error: null }).type, "existing_user")
  assert.equal(classifySignupResult({ data: null, error: { status: 409, message: "Conflict" } }).type, "existing_user")
  assert.equal(classifySignupResult({ data: null, error: { message: "Auth service unavailable" } }).type, "error")
})

test("inline signup restores the verified session returned by signUp when the immediate session read misses", async () => {
  const session = { user: { id: "u1" }, access_token: "access", refresh_token: "refresh" }
  const calls = []
  const auth = {
    getSession: async () => { calls.push("getSession"); return { data: { session: null }, error: null } },
    setSession: async tokens => {
      calls.push(["setSession", tokens])
      return { data: { session }, error: null }
    },
  }
  assert.equal(await ensureSignupSession(auth, { user: session.user, session }), session)
  assert.deepEqual(calls, ["getSession", ["setSession", { access_token: "access", refresh_token: "refresh" }]])
})

test("signup session restoration refuses a token for a different or unverified user", async () => {
  let restoreCalls = 0
  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    setSession: async () => { restoreCalls += 1; return { data: { session: null }, error: null } },
  }
  assert.equal(await ensureSignupSession(auth, { user: { id: "u1" }, session: { user: { id: "u2" }, access_token: "a", refresh_token: "r" } }), null)
  assert.equal(await ensureSignupSession(auth, { user: { id: "u1" }, session: { user: { id: "u1" }, access_token: "a" } }), null)
  assert.equal(restoreCalls, 0)
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
  assert.match(previewSignup, /ensureSignupSession\(supabase\.auth, outcome\)/)
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
  const finishProfile = welcome.slice(welcome.indexOf("async function finishProfile"), welcome.indexOf("async function persistSignupAttribution"))
  assert.match(finishProfile, /phone,\s*profile_completed: true/)
  assert.doesNotMatch(finishProfile, /normalizeWhatsAppPhoneE164\(phone\)/)
  assert.match(welcome, /Enter your valid 10-digit mobile number to complete your profile\./)
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
