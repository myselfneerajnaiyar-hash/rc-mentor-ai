import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { buildTrialLifecycleEvents, getTrialLifecycle } from "../lib/whatsapp/events/lifecycle.js"
import { isWhatsAppAutomationEnabled, isWhatsAppSenderReady } from "../lib/whatsapp/events/config.js"
import { isAuthorizedCronRequest } from "../lib/whatsapp/events/auth.js"
import { validateEventInput } from "../lib/whatsapp/events/validation.js"

const migration = await readFile(new URL("../supabase/migrations/202608120001_create_whatsapp_automation_events.sql", import.meta.url), "utf8")

test("lifecycle key is deterministic for the same trial", () => {
  const first = getTrialLifecycle("2026-08-15T10:00:00.000Z")
  const second = getTrialLifecycle("2026-08-15T10:00:00.000Z")
  assert.equal(first.lifecycleKey, second.lifecycleKey)
  assert.equal(first.lifecycleKey, "trial:2026-08-15T10:00:00.000Z")
})

test("signup scheduling excludes trial_day1 and uses configured offsets", () => {
  const events = buildTrialLifecycleEvents({ userId: "user-1", trialExpiresAt: "2026-08-15T00:00:00.000Z", trialDays: 3, phone: "+919999999999" })
  assert.equal(events.length, 6)
  assert.equal(events.some((event) => event.eventType === "trial_day1"), false)
  const byType = Object.fromEntries(events.map((event) => [event.eventType, event]))
  assert.equal(byType.trial_welcome.scheduledFor.toISOString(), "2026-08-12T00:00:00.000Z")
  assert.equal(byType.trial_no_session.scheduledFor.toISOString(), "2026-08-12T05:00:00.000Z")
  assert.equal(byType.trial_day2.scheduledFor.toISOString(), "2026-08-14T00:00:00.000Z")
  assert.equal(byType.trial_day3.scheduledFor.toISOString(), "2026-08-15T00:00:00.000Z")
  assert.equal(byType.trial_day4_discount.scheduledFor.toISOString(), "2026-08-16T00:00:00.000Z")
  assert.equal(byType.trial_day7_discount_expiry.scheduledFor.toISOString(), "2026-08-19T00:00:00.000Z")
})

test("legacy and invalid trials are rejected", () => {
  assert.throws(() => buildTrialLifecycleEvents({ userId: "user-1", trialExpiresAt: "2026-08-15T00:00:00Z", trialDays: 7 }), /three-day trial/)
  assert.throws(() => buildTrialLifecycleEvents({ userId: "user-1", trialExpiresAt: "invalid", trialDays: 3 }), /valid trial_expires_at/)
  assert.throws(() => buildTrialLifecycleEvents({ userId: "user-1", trialDays: 3 }), /valid trial_expires_at/)
})

test("automation is disabled unless explicitly true", () => {
  assert.equal(isWhatsAppAutomationEnabled({}), false)
  assert.equal(isWhatsAppAutomationEnabled({ WHATSAPP_AUTOMATION_ENABLED: "false" }), false)
  assert.equal(isWhatsAppAutomationEnabled({ WHATSAPP_AUTOMATION_ENABLED: "true" }), true)
  assert.equal(isWhatsAppSenderReady({}), false)
  assert.equal(isWhatsAppSenderReady({ WHATSAPP_SENDER_READY: "false" }), false)
  assert.equal(isWhatsAppSenderReady({ WHATSAPP_SENDER_READY: "true" }), false)
})

test("event payload and attempt validation rejects unsafe input", () => {
  assert.deepEqual(validateEventInput({ payload: { name: "Reader" }, maxAttempts: 5 }), { payload: { name: "Reader" }, maxAttempts: 5 })
  assert.throws(() => validateEventInput({ payload: [] }), /plain JSON object/)
  assert.throws(() => validateEventInput({ payload: null }), /plain JSON object/)
  assert.throws(() => validateEventInput({ payload: { value: 1n } }), /JSON-serializable/)
  assert.throws(() => validateEventInput({ maxAttempts: 0 }), /positive integer/)
  assert.throws(() => validateEventInput({ maxAttempts: 1.5 }), /positive integer/)
})

test("cron processing requires the configured bearer secret", () => {
  const request = (authorization) => ({ headers: new Headers({ authorization }) })
  const env = { CRON_SECRET: "phase-one-secret" }

  assert.equal(isAuthorizedCronRequest(request("Bearer phase-one-secret"), env), true)
  assert.equal(isAuthorizedCronRequest(request("Bearer wrong-secret"), env), false)
  assert.equal(isAuthorizedCronRequest(request("Basic phase-one-secret"), env), false)
  assert.equal(isAuthorizedCronRequest(request("Bearer phase-one-secret"), {}), false)
})

test("migration enforces idempotency and claim eligibility", () => {
  assert.match(migration, /unique \(user_id, event_type, lifecycle_key\)/i)
  assert.match(migration, /where status = 'pending'/i)
  assert.match(migration, /scheduled_for <= now\(\)/i)
  assert.match(migration, /next_attempt_at is null or next_attempt_at <= now\(\)/i)
  assert.match(migration, /for update skip locked/i)
  assert.match(migration, /status = 'processing'/i)
  assert.match(migration, /attempt_count = event\.attempt_count \+ 1/i)
  assert.match(migration, /claim_token = gen_random_uuid\(\)/i)
  assert.match(migration, /check \(attempt_count <= max_attempts\)/i)
})

test("migration excludes cancelled and sent events and recovers stale processing locks", () => {
  assert.match(migration, /where status = 'processing'\s+and locked_at is not null\s+and locked_at < p_stale_before/i)
  assert.match(migration, /then 'pending' else 'failed'/i)
  assert.match(migration, /where status = 'pending'/i)
  assert.doesNotMatch(migration, /where status in \('pending',\s*'sent'/i)
  assert.doesNotMatch(migration, /where status in \('pending',\s*'cancelled'/i)
})

test("completion RPCs fence every transition by claim token", () => {
  for (const functionName of ["sent", "failed", "cancelled"]) {
    const start = migration.indexOf(`mark_whatsapp_automation_event_${functionName}`)
    assert.notEqual(start, -1)
    const body = migration.slice(start, migration.indexOf("$$;", start) + 3)
    assert.match(body, /status = 'processing'/i)
    assert.match(body, /claim_token = p_claim_token/i)
    assert.match(body, /claim_token = null/i)
  }
})

test("retry transitions are pending with bounded backoff, then permanently failed", () => {
  assert.match(migration, /case when attempt_count < max_attempts then 'pending' else 'failed'/i)
  assert.match(migration, /interval '5 minutes'/i)
  assert.match(migration, /interval '15 minutes'/i)
  assert.match(migration, /interval '30 minutes'/i)
  assert.match(migration, /interval '60 minutes'/i)
  assert.match(migration, /attempt_count >= max_attempts then null/i)
})

test("stale recovery clears ownership and excludes null or fresh locks", () => {
  const start = migration.indexOf("recover_stale_whatsapp_automation_events")
  const body = migration.slice(start, migration.indexOf("$$;", start) + 3)
  assert.match(body, /locked_at is not null/i)
  assert.match(body, /locked_at < p_stale_before/i)
  assert.match(body, /claim_token = null/i)
})

test("unique lifecycle key and claim fencing model duplicate and old-worker protection", () => {
  const scheduled = new Set()
  const key = "user-1:trial_welcome:trial:2026-08-15T00:00:00.000Z"
  assert.equal(scheduled.has(key), false)
  scheduled.add(key)
  scheduled.add(key)
  assert.equal(scheduled.size, 1)

  let event = { status: "pending", attemptCount: 0, maxAttempts: 5, claimToken: null }
  const claim = (token) => {
    if (event.status !== "pending") return false
    event = { ...event, status: "processing", attemptCount: event.attemptCount + 1, claimToken: token }
    return true
  }
  const complete = (token) => {
    if (event.status !== "processing" || event.claimToken !== token) return false
    event = { ...event, status: "sent", claimToken: null }
    return true
  }

  assert.equal(claim("processor-a-token"), true)
  assert.equal(claim("processor-b-token"), false)
  event = { ...event, status: "pending", claimToken: null }
  assert.equal(claim("processor-b-token"), true)
  assert.equal(complete("processor-a-token"), false)
  assert.equal(complete("processor-b-token"), true)
})

test("migration keeps queue private and RPCs service-role only", () => {
  assert.match(migration, /enable row level security/i)
  assert.doesNotMatch(migration, /create policy/i)
  assert.match(migration, /revoke all on function public\.claim_due_whatsapp_automation_events/i)
  assert.match(migration, /grant execute on function public\.claim_due_whatsapp_automation_events\(text, integer\) to service_role/i)
})
