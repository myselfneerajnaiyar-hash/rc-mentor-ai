import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"
import { buildDayOneEvent } from "../lib/whatsapp/events/activity.js"
import { processClaimedEvents } from "../lib/whatsapp/processor.js"

// Run the actual route with isolated dependencies: no database or network access.
const source = await readFile(new URL("../app/api/whatsapp/process/route.js", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const lifecycleKey = "trial:2026-09-15T18:41:30.020Z"
const profile = { user_id: "valid", name: "Reader", phone: "+919876543210", is_premium: false, whatsapp_opt_in: true, whatsapp_opt_in_at: "2026-09-12T18:41:30.020Z" }

function harness({ users = ["missing", "valid"], profiles = { valid: profile }, profileError = null } = {}) {
  const calls = { activity: [], created: [], claimed: [], sent: [], errors: [], order: [] }
  const db = { from(table) {
    const filters = {}
    const result = () => table === "whatsapp_automation_events"
      ? { data: filters.event_type === "trial_welcome" ? users.map(user_id => ({ user_id, lifecycle_key: lifecycleKey })) : [], error: null }
      : { data: profiles[filters.user_id] || null, error: profileError }
    const query = {
      select: () => query, gte: () => query, order: () => query, limit: () => query,
      eq: (key, value) => { filters[key] = value; return query },
      then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
      maybeSingle: async () => table === "subscriptions" ? { data: null, error: null } : result(),
      single: async () => {
        const row = result()
        return row.data || row.error ? row : { data: null, error: { code: "PGRST116", message: "Cannot coerce the result to a single JSON object" } }
      },
    }
    return query
  } }
  const dependencies = {
    "next/server": { NextResponse: { json: (body, options) => ({ status: options?.status || 200, body: JSON.parse(JSON.stringify(body)) }) } },
    "node:crypto": { randomUUID: () => "processor-id" },
    "@/lib/whatsapp/events/config": { isWhatsAppAutomationEnabled: () => true, isWhatsAppSenderReady: () => true },
    "@/lib/whatsapp/events/auth": { isAuthorizedCronRequest: () => true },
    "@/lib/supabaseAdmin": { supabaseAdmin: db },
    "@/lib/whatsapp/events/activity": {
      buildDayOneEvent,
      getQualifyingActivitySummary: async (_db, userId) => {
        calls.activity.push(userId)
        return { hasActivity: true, hasDayOneMetrics: true, questionActivitiesCount: 2, accuracyPercent: 75, averageSecondsPerQuestion: 30 }
      },
    },
    "@/lib/whatsapp/events": {
      recoverStaleEvents: async () => 0,
      createEvent: async event => { calls.created.push(event); calls.order.push("create"); return event },
      claimDueEvents: async options => {
        calls.claimed.push(options)
        calls.order.push("claim")
        return [{ id: "welcome", user_id: "valid", event_type: "trial_welcome", claim_token: "claim", phone_snapshot: profile.phone, payload: { firstName: "Reader", loginLink: "https://example.com/login" } }]
      },
      markEventSent: async (...args) => calls.sent.push(args),
      markEventFailed: async () => assert.fail("Unexpected send failure"),
      markEventCancelled: async () => assert.fail("Unexpected cancellation"),
    },
    "@/lib/whatsapp/processor": {
      processClaimedEvents: (events, options) => processClaimedEvents(events, {
        ...options,
        send: async message => {
          assert.equal(message.phone, profile.phone)
          return { ok: true, messageId: "wamid.mock" }
        },
      }),
    },
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports, URL, process: { env: { WHATSAPP_TEST_MODE: "false" } },
    console: { error: (...args) => calls.errors.push(args) },
    require: name => { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name] },
  })
  return { calls, run: () => exports.GET({ url: "https://example.com/api/whatsapp/process" }) }
}

test("missing profile is skipped without throwing and the handler still reaches claiming", async () => {
  const { calls, run } = harness({ users: ["missing"] })
  const result = await run()
  assert.equal(result.status, 200)
  assert.equal(result.body.dayOneEnrolled, 0)
  assert.deepEqual(calls.errors, [])
  assert.deepEqual(calls.activity, [])
  assert.deepEqual(calls.created, [])
  assert.equal(calls.claimed.length, 1)
  assert.deepEqual(calls.sent, [["welcome", "claim", "wamid.mock"]])
})

test("valid lifecycles after a missing profile reconcile before normal queue processing", async () => {
  const { calls, run } = harness()
  const result = await run()
  assert.equal(result.status, 200)
  assert.equal(result.body.dayOneEnrolled, 1)
  assert.equal(result.body.claimed, 1)
  assert.equal(result.body.sent, 1)
  assert.deepEqual(calls.activity, ["valid"])
  assert.deepEqual(calls.order, ["create", "claim"])
  assert.equal(calls.created[0].userId, "valid")
  assert.equal(calls.created[0].lifecycleKey, lifecycleKey)
  assert.equal(calls.created[0].eventType, "trial_day1")
  assert.equal(calls.created[0].phoneSnapshot, profile.phone)
  assert.deepEqual(calls.errors, [])
})

test("valid-user enrollment and processing are unchanged by a preceding missing profile", async () => {
  const valid = harness({ users: ["valid"] })
  const mixed = harness()
  assert.deepEqual((await mixed.run()).body, (await valid.run()).body)
  const withoutTime = events => events.map(({ scheduledFor, ...event }) => event)
  assert.deepEqual(withoutTime(mixed.calls.created), withoutTime(valid.calls.created))
  assert.deepEqual(mixed.calls.sent, valid.calls.sent)
})

test("actual profile database errors still abort instead of being silently skipped", async () => {
  const { calls, run } = harness({ profileError: { code: "42501", message: "permission denied" } })
  assert.equal((await run()).status, 500)
  assert.equal(calls.errors.length, 1)
  assert.equal(calls.claimed.length, 0)
})
