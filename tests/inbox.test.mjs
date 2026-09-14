import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
import { MemoryDb, message, uid } from "./helpers/inbox-db.mjs"
import { normalizeNotification, createInboxNotification, applyInboxAction } from "../lib/inbox/service.js"
import { internalPath, parseList, parseAction, encodeCursor } from "../lib/inbox/validation.js"
import { listInbox, mutateInbox, inboxHandlers, getInboxMessage, unreadCount } from "../lib/inbox/api.js"
import { matchesView, reconcileMessages, reconcileDetail, mergeMessages, requestGate, inboxUndo } from "../lib/inbox/state.js"
import { isAuthorizedInboxCron } from "../lib/inbox/auth.js"
import { dateKey, dayStart, shiftDay, loadActivityBatch, summarizeActivity, readAll } from "../lib/inbox/activity.js"
import { chooseDailyNotification } from "../lib/inbox/rules.js"
import { runInboxGenerator } from "../lib/inbox/generator.js"
const user = uid(9000), other = uid(9001)
const silent = { error() {}, info() {} }
const params = (input = {}) => new URLSearchParams(input)
const notification = (overrides = {}) => ({ userId: user, type: "ACCOUNT", title: "Saved update", body: "Your account update", actionUrl: "/inbox", ...overrides })

for (const path of ["/", "/inbox", "/?view=precision", "/daily-challenge", "/history?search=hello%20world#results"]) test(`internal CTA allows ${path}`, () => assert.equal(internalPath(path), path))
for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/%5cevil.test", "/%2fevil.test", "/%252fevil.test", "/\nevil.test", "javascript:alert(1)", "/bad%XX", "/bad path"]) test(`internal CTA rejects ${JSON.stringify(path)}`, () => assert.throws(() => internalPath(path)))
test("notification payload validates user, priority, daily date and retains metadata", () => {
  assert.deepEqual(normalizeNotification(notification({ metadata: { questions: 42 } })).metadata, { questions: 42 })
  for (const priority of [1.2, -1, 11, NaN, "2"]) assert.throws(() => normalizeNotification(notification({ priority })))
  assert.throws(() => normalizeNotification(notification({ userId: "not-uuid" })))
  assert.throws(() => normalizeNotification(notification({ type: "PROGRESS" })))
  assert.throws(() => normalizeNotification(notification({ type: "PROGRESS", proactiveDate: "2026-02-30" })))
})
for (const input of [{ filter: "UNKNOWN" }, { folder: "OTHER" }, { pageSize: "1.5" }, { pageSize: "Infinity" }, { pageSize: "51" }, { page: "1" }, { search: "x".repeat(121) }, { cursor: "bad" }]) test(`list rejects ${JSON.stringify(input)}`, () => assert.throws(() => parseList(params(input))))
test("cursor is scoped, validated and deterministic", () => {
  const scope = JSON.stringify(["INBOX", "ALL", ""])
  const cursor = encodeCursor(message(1), scope)
  assert.equal(parseList(params({ cursor })).cursor.id, uid(1))
  assert.throws(() => parseList(params({ cursor, filter: "UNREAD" })))
  assert.throws(() => parseList(params({ cursor: encodeCursor({ ...message(1), created_at: "x),id.gt.0" }, scope) })))
})
test("bulk validation never silently truncates", () => {
  const ids = Array.from({ length: 250 }, (_, n) => uid(n))
  assert.equal(parseAction({ action: "read", ids }).ids.length, 250)
  for (const body of [null, { action: "drop", ids }, { action: "read", ids: ["bad"] }, { action: "read", ids: [] }, { action: "delete", all: true }, { action: "read", all: true, ids }, { action: "read", ids, user_id: other }, { action: "read", ids: Array(5001).fill(uid(1)) }]) assert.throws(() => parseAction(body))
})
test("list enforces ownership, folders, categories, search and deterministic order", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1), message(2), message(3, { priority: 9 }), message(4, { user_id: other }), message(5, { archived_at: "x" }), message(6, { deleted_at: "x" }), message(7, { type: "ACHIEVEMENT", title: "Milestone" })] })
  assert.deepEqual((await listInbox(db, user, params())).messages.map((row) => row.id), [uid(3), uid(7), uid(2), uid(1)])
  assert.equal((await listInbox(db, user, params({ filter: "ACHIEVEMENTS", search: "Milestone" }))).messages.length, 1)
  assert.equal((await listInbox(db, user, params({ folder: "ARCHIVE" }))).messages[0].id, uid(5))
  assert.equal((await listInbox(db, user, params({ folder: "TRASH" }))).messages[0].id, uid(6))
  assert.equal(await unreadCount(db, user), 4)
})
test("keyset pagination survives deletion, archiving and a new higher priority message", async () => {
  const db = new MemoryDb({ inbox_notifications: Array.from({ length: 7 }, (_, n) => message(n + 1)) })
  const first = await listInbox(db, user, params({ pageSize: "2" }))
  assert.deepEqual(first.messages.map((row) => row.id), [uid(7), uid(6)])
  await mutateInbox(db, user, { action: "archive", ids: [uid(7)] })
  await mutateInbox(db, user, { action: "delete", ids: [uid(6)] })
  db.tables.inbox_notifications.push(message(8, { priority: 9 }))
  const second = await listInbox(db, user, params({ pageSize: "2", cursor: first.nextCursor }))
  assert.deepEqual(second.messages.map((row) => row.id), [uid(5), uid(4)])
  const third = await listInbox(db, user, params({ pageSize: "2", cursor: second.nextCursor }))
  assert.deepEqual(third.messages.map((row) => row.id), [uid(3), uid(2)])
})
test("read/unread, archive/unarchive and delete/restore preserve content and actual state", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1)] })
  for (const [action, field, expectedNull] of [["read", "read_at", false], ["unread", "read_at", true], ["archive", "archived_at", false], ["unarchive", "archived_at", true], ["delete", "deleted_at", false], ["restore", "deleted_at", true]]) {
    const result = await mutateInbox(db, user, { action, ids: [uid(1)] })
    assert.equal(result.updated.length, 1)
    assert.equal(result.updated[0][field] === null, expectedNull)
    assert.equal(db.tables.inbox_notifications[0].body, "Saved message")
  }
})
test("bulk operation processes all 250 IDs and does not mutate another user", async () => {
  const db = new MemoryDb({ inbox_notifications: [...Array.from({ length: 250 }, (_, n) => message(n + 1)), message(251, { user_id: other })] })
  const result = await mutateInbox(db, user, { action: "read", ids: Array.from({ length: 251 }, (_, n) => uid(n + 1)) })
  assert.equal(result.updated.length, 250)
  assert.equal(result.unreadCount, 0)
  assert.equal(db.tables.inbox_notifications.at(-1).read_at, null)
})
test("mark all read batches all owned Inbox messages and excludes archive/trash", async () => {
  const db = new MemoryDb({ inbox_notifications: [...Array.from({ length: 1100 }, (_, n) => message(n + 1)), message(2001, { archived_at: "x" }), message(2002, { deleted_at: "x" }), message(2003, { user_id: other })] })
  const result = await mutateInbox(db, user, { action: "read", all: true })
  assert.equal(result.updated.length, 1100)
  assert.equal(result.unreadCount, 0)
  assert.ok(db.tables.inbox_notifications.slice(-3).every((row) => row.read_at === null))
})
test("partial bulk failure returns only saved rows and the true count", async () => {
  const db = new MemoryDb({ inbox_notifications: Array.from({ length: 150 }, (_, n) => message(n + 1)) })
  let calls = 0
  db.fail = (query) => query.method === "update" && ++calls === 2 ? { message: "DB unavailable" } : null
  const result = await mutateInbox(db, user, { action: "read", ids: Array.from({ length: 150 }, (_, n) => uid(n + 1)) })
  assert.equal(result.partial, true); assert.equal(result.updated.length, 100); assert.equal(result.unreadCount, 50)
})
test("detail GET is read-only and ownership protected, including Trash", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1), message(2, { user_id: other }), message(3, { deleted_at: "x" })] })
  assert.equal((await getInboxMessage(db, user, uid(1))).read_at, null)
  assert.equal(await getInboxMessage(db, user, uid(2)), null)
  assert.ok(await getInboxMessage(db, user, uid(3)))
  assert.equal(db.calls.filter((call) => call.method === "update").length, 0)
})
test("actual handler returns 401/400/404/500 and uses authenticated identity", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1)] })
  const authenticate = async (request) => request.headers.get("authorization") === "Bearer valid" ? { user: { id: user } } : { error: "unauthorized" }
  const handlers = inboxHandlers({ db, authenticate, logger: silent })
  const request = (url = "https://local/api/inbox", options = {}) => new Request(url, { headers: { authorization: "Bearer valid" }, ...options })
  assert.equal((await handlers.GET(new Request("https://local/api/inbox"))).status, 401)
  assert.equal((await handlers.GET(request("https://local/api/inbox?filter=bad"))).status, 400)
  assert.equal((await handlers.PATCH(request(undefined, { method: "PATCH", body: "{" }))).status, 400)
  assert.equal((await handlers.detail(request(), { params: { id: uid(2) } })).status, 404)
  assert.equal((await handlers.detail(request(), { params: { id: "bad" } })).status, 400)
  const response = await handlers.PATCH(request(undefined, { method: "PATCH", body: JSON.stringify({ action: "read", ids: [uid(1)] }) }))
  assert.equal((await response.json()).unreadCount, 0)
  db.fail = () => ({ message: "private database error" })
  const failure = await handlers.GET(request()); assert.equal(failure.status, 500); assert.doesNotMatch(await failure.text(), /private database/)
})
test("existing authentication validates token and requires a real profile", async () => {
  const source = fs.readFileSync("lib/tenant/getCurrentProfile.js", "utf8")
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const db = new MemoryDb({ profiles: [{ user_id: user }] })
  db.auth = { getUser: async (token) => ({ data: { user: token === "valid" ? { id: user } : null }, error: token !== "valid" }) }
  const module = { exports: {} }
  new Function("require", "module", "exports", compiled)((name) => name.includes("supabaseAdmin") ? { supabaseAdmin: db } : { getExamCapabilities: () => ({}) }, module, module.exports)
  const auth = module.exports.getAuthenticatedProfile
  assert.ok((await auth(new Request("https://local"))).error)
  assert.ok((await auth(new Request("https://local", { headers: { authorization: "Bearer invalid" } }))).error)
  assert.equal((await auth(new Request("https://local", { headers: { authorization: "Bearer valid" } }))).user.id, user)
  db.tables.profiles = []
  assert.equal((await auth(new Request("https://local", { headers: { authorization: "Bearer valid" } }))).error, "profile_not_found")
})
test("unread filter and detail reconcile actual partial results", () => {
  const rows = [message(1), message(2)]
  const update = [{ id: uid(1), read_at: "now", archived_at: null, deleted_at: null }]
  assert.deepEqual(reconcileMessages(rows, update, { filter: "UNREAD" }).map((row) => row.id), [uid(2)])
  assert.equal(reconcileDetail(rows[0], update).read_at, "now")
  assert.equal(reconcileDetail(rows[0], [{ ...update[0], archived_at: "now" }]), null)
  assert.equal(reconcileMessages(rows, [], {}).length, 2)
  assert.equal(reconcileDetail(null, update), null)
})
test("mark unread and restoration use folder-aware state", () => {
  const row = message(1, { read_at: "now" })
  assert.ok(matchesView({ ...row, read_at: null }, { filter: "UNREAD" }))
  assert.equal(matchesView({ ...row, deleted_at: "now" }, { folder: "INBOX" }), false)
  assert.equal(matchesView({ ...row, deleted_at: "now" }, { folder: "TRASH" }), true)
  assert.equal(mergeMessages([row], [{ ...row, read_at: null }]).length, 1)
  assert.equal(mergeMessages([row], [{ ...row, read_at: null }])[0].read_at, null)
})
test("stale and cancelled requests cannot overwrite newer state", async () => {
  const gate = requestGate(), first = gate.start(), second = gate.start()
  let state = "new"
  await Promise.resolve(); if (first.current()) state = "old"
  assert.equal(state, "new"); assert.equal(first.signal.aborted, true); assert.equal(second.current(), true)
  gate.cancel(); assert.equal(second.current(), false)
})
test("cron authentication fails closed and accepts only the exact secret", () => {
  for (const token of [null, "Bearer wrong", "secret", "Bearer secret-extra"]) assert.equal(isAuthorizedInboxCron(new Request("https://local", { headers: token ? { authorization: token } : {} }), { CRON_SECRET: "secret" }), false)
  assert.equal(isAuthorizedInboxCron(new Request("https://local", { headers: { authorization: "Bearer secret" } }), { CRON_SECRET: "secret" }), true)
  assert.equal(isAuthorizedInboxCron(new Request("https://local"), {}), false)
})
test("IST calendar handles midnight and month/year rollover", () => {
  assert.equal(dateKey("2026-09-12T18:30:00Z"), "2026-09-13")
  assert.equal(dayStart("2026-09-13").toISOString(), "2026-09-12T18:30:00.000Z")
  assert.equal(shiftDay("2026-01-01", -1), "2025-12-31")
})
test("batched activity excludes other users, incomplete sessions and adjacent IST days", async () => {
  const db = new MemoryDb({
    hangman_attempts: [{ id: uid(1), user_id: user, attempt_date: "2026-09-11" }, { id: uid(2), user_id: user, attempt_date: "2026-09-12" }, { id: uid(3), user_id: other, attempt_date: "2026-09-12" }],
    grammar_test_attempts: [{ id: uid(4), user_id: user, completed: true, created_at: "2026-09-10T00:00:00Z", completed_at: "2026-09-11T18:30:00.000Z", total_questions: 10, score: 8, time_taken_seconds: 200 }, { id: uid(5), user_id: user, completed: false, completed_at: "2026-09-12T01:00:00Z", total_questions: 10, score: 1 }, { id: uid(6), user_id: user, completed: true, completed_at: "2026-09-12T18:30:00.000Z", total_questions: 10, score: 1 }],
    mentor_chat_history: [{ id: uid(7), user_id: user, created_at: "2026-09-12T01:00:00Z", role: "user" }, { id: uid(8), user_id: user, created_at: "2026-09-12T01:00:00Z", role: "assistant" }],
  })
  const batch = await loadActivityBatch(db, [user], "2026-09-12", "2026-09-13")
  const summary = summarizeActivity(batch.get(user), "2026-09-12", "2026-09-13")
  assert.equal(summary.activitiesCount, 2); assert.equal(summary.questions, 10); assert.equal(summary.accuracyPercent, 80); assert.equal(summary.averageSeconds, 20)
  assert.equal(db.calls.length, 11)
})
test("source failure is not interpreted as inactivity", async () => {
  const db = new MemoryDb(); db.fail = (query) => query.table === "grammar_test_attempts" ? { message: "unavailable" } : null
  await assert.rejects(loadActivityBatch(db, [user], "2026-09-12", "2026-09-13"))
})
test("activity pagination reads beyond a server page", async () => {
  const db = new MemoryDb({ rows: Array.from({ length: 1101 }, (_, n) => ({ id: uid(n) })) })
  assert.equal((await readAll(() => db.from("rows").select("id").order("id", { ascending: true }))).length, 1101)
})
const event = (overrides = {}) => ({ day: "2026-09-12", module: "Daily RC", sessionId: "one", questions: 10, correct: 8, seconds: null, engagement: false, ...overrides })
const rule = (overrides = {}) => chooseDailyNotification({ userId: user, firstName: "Ananya", dateKey: "2026-09-13", events: [], history: [], accountCreatedAt: "2026-08-01T00:00:00Z", ...overrides })
test("daily performance uses yesterday only and real weighted metrics", () => {
  const result = rule({ events: [event(), event({ sessionId: "two", questions: 30, correct: 24, seconds: 600 }), event({ day: "2026-09-13", questions: 1000 })] })
  assert.equal(result.type, "PERFORMANCE_UPDATE"); assert.equal(result.metadata.questions, 40); assert.equal(result.metadata.accuracyPercent, 80); assert.equal(result.metadata.averageSeconds, 20); assert.equal(result.metadata.timedQuestions, 30)
})
test("engagement does not fabricate completed sessions, accuracy or timing", () => {
  const events = [event({ engagement: true, questions: 0, correct: 0 })]
  const result = summarizeActivity(events, "2026-09-12", "2026-09-13")
  assert.equal(result.activitiesCount, 0); assert.equal(result.accuracyPercent, null); assert.equal(result.averageSeconds, null)
  assert.equal(rule({ events }), null)
})
test("progress needs two adequate samples and at least five percentage points", () => {
  const events = [event({ questions: 20, correct: 18 }), event({ day: "2026-09-02", questions: 20, correct: 14, sessionId: "old" })]
  const result = rule({ events }); assert.equal(result.type, "PROGRESS"); assert.equal(result.metadata.previousAccuracy, 70); assert.equal(result.metadata.accuracyPercent, 90)
  assert.equal(rule({ events: [events[0]] }).type, "PERFORMANCE_UPDATE")
  assert.equal(rule({ events, history: [{ type: "PROGRESS", created_at: "2026-09-10T00:00:00Z" }] }).type, "PERFORMANCE_UPDATE")
})
test("recommendation uses measured weak module/skill and seven day cooldown", () => {
  const events = [event({ day: "2026-09-10", module: "RC / Precision", questions: 20, correct: 10, skill: "inference" })]
  const result = rule({ events }); assert.equal(result.type, "DAILY_RECOMMENDATION"); assert.equal(result.metadata.skill, "inference"); assert.equal(result.actionUrl, "/?view=precision")
  assert.equal(rule({ events, history: [{ type: "DAILY_RECOMMENDATION", created_at: "2026-09-12T00:00:00Z" }] }), null)
  assert.equal(rule({ events: [event({ day: "2026-09-10", questions: 2, correct: 0 })] }), null)
})
test("inactivity requires seven days and does not repeat for fourteen days", () => {
  assert.equal(rule().type, "INACTIVITY")
  assert.equal(rule({ accountCreatedAt: "2026-09-12T00:00:00Z" }), null)
  assert.equal(rule({ history: [{ type: "INACTIVITY", created_at: "2026-09-02T00:00:00Z" }] }), null)
  assert.equal(rule({ history: [{ type: "INACTIVITY", created_at: "2026-08-01T00:00:00Z" }] }).type, "INACTIVITY")
})
test("streak requires actual consecutive completed learning days", () => {
  const events = Array.from({ length: 7 }, (_, n) => event({ day: shiftDay("2026-09-13", -n - 1), sessionId: String(n) }))
  assert.equal(rule({ events }).type, "STREAK"); assert.equal(rule({ events }).metadata.streakDays, 7)
  assert.notEqual(rule({ events: events.slice(0, 6) }).type, "STREAK")
  assert.equal(rule({ events: events.map((row) => ({ ...row, engagement: true, questions: 0 })) }), null)
})
test("achievement is a real daily threshold, not a fictional lifetime total", () => {
  const result = rule({ events: [event({ questions: 100, correct: 80 })] })
  assert.equal(result.type, "ACHIEVEMENT"); assert.match(result.ruleKey, /2026-09-12:100$/)
  assert.notEqual(rule({ events: [event({ questions: 99, correct: 80 })] }).type, "ACHIEVEMENT")
})
test("daily idempotency, cross-rule cap and additional account messages", async () => {
  const db = new MemoryDb()
  const daily = rule()
  assert.ok(await createInboxNotification(db, daily))
  assert.equal(await createInboxNotification(db, daily), null)
  assert.equal(await createInboxNotification(db, { ...daily, type: "PROGRESS", idempotencyKey: "different-producer" }), null)
  assert.ok(await createInboxNotification(db, notification({ idempotencyKey: "account:one" })))
  assert.equal(db.tables.inbox_notifications.length, 2)
})
test("generator batches users, isolates a user failure, logs partial failure and safely retries", async () => {
  const profiles = [1, 2, 3].map((n) => ({ user_id: uid(n), name: "User", created_at: "2026-08-01T00:00:00Z" }))
  const db = new MemoryDb({ profiles })
  let batchCalls = 0
  const loadActivity = async (_, ids) => { batchCalls++; return new Map(ids.map((id) => [id, []])) }
  const createNotification = async (db, input) => { if (input.userId === uid(2)) throw new Error("one user failed"); return createInboxNotification(db, input) }
  const result = await runInboxGenerator(db, { now: new Date("2026-09-13T02:30:00Z"), loadActivity, createNotification, logger: silent })
  assert.equal(result.created, 2); assert.equal(result.failed, 1); assert.equal(result.status, "partial"); assert.equal(batchCalls, 1)
  assert.equal(db.tables.inbox_generation_runs[0].status, "partial")
  const second = await runInboxGenerator(db, { now: new Date("2026-09-13T02:30:00Z"), loadActivity, logger: silent })
  assert.equal(second.created, 1); assert.equal(second.skipped, 2)
})
test("generator paginates profiles and skips activity queries for already-generated users", async () => {
  const profiles = Array.from({ length: 105 }, (_, n) => ({ user_id: uid(n + 1), created_at: "2026-08-01T00:00:00Z" }))
  const db = new MemoryDb({ profiles, inbox_notifications: profiles.map((profile, n) => message(n + 1, { user_id: profile.user_id, proactive_date: "2026-09-13" })) })
  const result = await runInboxGenerator(db, { now: new Date("2026-09-13T02:30:00Z"), loadActivity: () => { throw new Error("must not load") }, logger: silent })
  assert.equal(result.skipped, 105); assert.equal(result.failed, 0); assert.equal(db.calls.filter((call) => call.table === "profiles").length, 3)
})
test("generator records an activity failure without creating fabricated reminders", async () => {
  const db = new MemoryDb({ profiles: [{ user_id: user, created_at: "2026-08-01T00:00:00Z" }] })
  const result = await runInboxGenerator(db, { now: new Date("2026-09-13T02:30:00Z"), loadActivity: async () => { throw new Error("source failed") }, logger: silent })
  assert.equal(result.failed, 1); assert.equal(result.created, 0); assert.equal(result.status, "partial")
})
test("generator timeout is visible and recorded", async () => {
  const db = new MemoryDb(); let tick = 0
  const result = await runInboxGenerator(db, { clock: () => ++tick * 1000, budgetMs: 1, logger: silent })
  assert.equal(result.status, "partial"); assert.match(db.tables.inbox_generation_runs[0].error, /Time budget/)
})
test("migration explicitly closes direct UPDATE and declares database-enforced caps", () => {
  const sql = fs.readFileSync("supabase/migrations/202609130002_harden_auctor_inbox.sql", "utf8")
  assert.match(sql, /revoke all on public\.inbox_notifications from authenticated, anon/i)
  assert.match(sql, /drop policy if exists "Users can update their own inbox"/i)
  assert.match(sql, /unique index[\s\S]*\(user_id, proactive_date\)/i)
  assert.match(sql, /revoke all on public\.inbox_generation_runs from anon, authenticated/i)
  assert.doesNotMatch(sql, /drop table|truncate|delete from/i)
})

test("CTA rejects normalized protocol-relative paths and API destinations", () => {
  for (const url of ["/a/..//evil.test", "/%2e%2e//evil.test", "/api/inbox/generate", "/_next/static/file"]) assert.throws(() => internalPath(url))
})
test("read preserves an existing timestamp and returns current state for a no-op", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1, { read_at: "original" })] })
  const result = await mutateInbox(db, user, { action: "read", ids: [uid(1), uid(2)] })
  assert.equal(result.updated.length, 0); assert.equal(result.current[0].read_at, "original"); assert.deepEqual(result.missingIds, [uid(2)])
})
test("malformed question metrics cannot become performance or a completed streak day", async () => {
  const db = new MemoryDb({ vocab_sessions: [{ id: uid(1), user_id: user, created_at: "2026-09-12T00:00:00Z", total_questions: 10, correct_answers: null }] })
  const batch = await loadActivityBatch(db, [user], "2026-09-12", "2026-09-13")
  assert.equal(batch.get(user)[0].engagement, true)
  assert.equal(rule({ events: batch.get(user) }), null)
})
test("RC question submission times supply real skill metrics without counting sessions twice", async () => {
  const db = new MemoryDb({ rc_questions: Array.from({ length: 3 }, (_, n) => ({ id: uid(n), user_id: user, session_id: uid(200), created_at: "2026-09-12T00:00:00Z", is_correct: n < 2, question_type: "inference", time_taken_sec: 10 })) })
  const batch = await loadActivityBatch(db, [user], "2026-09-12", "2026-09-13")
  const summary = summarizeActivity(batch.get(user), "2026-09-12", "2026-09-13")
  assert.equal(summary.questions, 3); assert.equal(summary.questionActivitiesCount, 1); assert.equal(summary.accuracyPercent, 67); assert.equal(summary.averageSeconds, 10)
})
test("concurrent generators cannot create two proactive messages on the same day", async () => {
  const db = new MemoryDb()
  const results = await Promise.all([createInboxNotification(db, rule()), createInboxNotification(db, rule())])
  assert.equal(results.filter(Boolean).length, 1)
})
test("Inbox JSX parses and real components render rows, selection, folders and safe metrics", async () => {
  const React = await import("react")
  const { renderToStaticMarkup } = await import("react-dom/server")
  const source = fs.readFileSync("components/inbox/InboxApp.jsx", "utf8") + "\nexport { InboxRow, MessageView, MessageMetrics };"
  const compiled = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } })
  assert.equal((compiled.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0)
  const runtime = await import("react/jsx-runtime")
  const icons = await import("lucide-react")
  const state = await import("../lib/inbox/state.js")
  const validation = await import("../lib/inbox/validation.js")
  const requests = await import("../lib/inbox/request.js")
  const module = { exports: {} }
  new Function("require", "module", "exports", compiled.outputText)((name) => {
    if (name === "react") return React
    if (name === "react/jsx-runtime") return runtime
    if (name === "lucide-react") return icons
    if (name === "next/navigation") return { useRouter: () => ({ push() {} }) }
    if (name.includes("TenantProvider")) return { useTenant: () => ({ branding: { brandName: "Auctor" } }) }
    if (name.includes("TenantLogo")) return { __esModule: true, default: () => React.createElement("span", null, "Auctor") }
    if (name.includes(".css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
    if (name.includes("/state")) return state
    if (name.includes("/request")) return requests
    if (name.includes("/validation")) return validation
    return {}
  }, module, module.exports)
  const app = renderToStaticMarkup(React.createElement(module.exports.default))
  assert.match(app, /Search your inbox/); assert.match(app, /Message folders/); assert.match(app, />Trash</)
  const row = renderToStaticMarkup(React.createElement(module.exports.InboxRow, { message: message(1), selected: true, onToggle() {}, onOpen() {} }))
  assert.match(row, /role="checkbox"/); assert.match(row, /aria-checked="true"/); assert.match(row, /selectedRow/)
  const detail = renderToStaticMarkup(React.createElement(module.exports.MessageView, { message: message(1, { action_url: "//evil.test", metadata: { questions: 42, accuracyPercent: 81, averageSeconds: null } }), onBack() {}, onAction() {}, router: { push() {} } }))
  assert.match(detail, /role="dialog"/); assert.match(detail, /42/); assert.match(detail, /81%/); assert.doesNotMatch(detail, /evil.test|Seconds per timed question/)
})

test("recommendations respect existing exam capabilities", () => {
  const events = [event({ module: "CAT sectionals", day: "2026-09-10", questions: 20, correct: 8 })]
  assert.equal(rule({ events, exam: "SSC" }), null)
  assert.equal(rule({ events, exam: "CAT" }).type, "DAILY_RECOMMENDATION")
})
test("Supabase client serializes the actual PostgREST search and cursor contract", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  const calls = []
  const db = createClient("https://database.invalid", "test-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (url, options) => {
    calls.push({ url: new URL(url), options })
    return new Response(options.method === "HEAD" ? null : "[]", { status: 200, headers: { "content-type": "application/json", "content-range": "*/0" } })
  } } })
  const cursor = encodeCursor(message(3), JSON.stringify(["INBOX", "ALL", "accuracy"]))
  await listInbox(db, user, params({ cursor, search: "accuracy" }))
  const query = calls[0].url.searchParams
  assert.equal(query.get("user_id"), `eq.${user}`)
  assert.equal(query.get("order"), "priority.desc,created_at.desc,id.desc")
  assert.equal(query.get("search_document"), "wfts(english).accuracy")
  assert.match(query.get("or"), /created_at.lt.2026-09-12T04:00:00.000Z/)
})

test("migration trigger body has matching dollar-quote delimiters", () => {
  const sql = fs.readFileSync("supabase/migrations/202609130002_harden_auctor_inbox.sql", "utf8")
  assert.equal((sql.match(/\$inbox\$/g) || []).length, 2)
  assert.match(sql, /as \$inbox\$[\s\S]*end;\s*\$inbox\$;/i)
})

test("activity today suppresses a false inactivity reminder and stale recommendation", () => {
  assert.equal(rule({ events: [event({ day: "2026-09-13" })] }), null)
  assert.equal(rule({ events: [event({ day: "2026-09-10", questions: 20, correct: 5 }), event({ day: "2026-09-13" })] }), null)
})
test("generator activity window includes today's return but excludes timestamps after the run", async () => {
  const db = new MemoryDb({ vocab_sessions: [
    { id: uid(1), user_id: user, created_at: "2026-09-13T01:00:00.000Z", total_questions: 10, correct_answers: 8 },
    { id: uid(2), user_id: user, created_at: "2026-09-13T03:00:00.000Z", total_questions: 10, correct_answers: 1 },
  ] })
  const batch = await loadActivityBatch(db, [user], "2026-08-16", "2026-09-14", { until: "2026-09-13T02:30:00.000Z" })
  assert.equal(batch.get(user).length, 1)
  assert.equal(rule({ events: batch.get(user) }), null)
  assert.equal(summarizeActivity(batch.get(user), "2026-09-12", "2026-09-13").questions, 0)
})

test("ordinary RC without analytics is retained while detailed sessions are not double-counted", async () => {
  const db = new MemoryDb({
    rc_sessions: [
      { id: uid(1), user_id: user, created_at: "2026-09-12T00:00:00Z", total_questions: 4, correct_answers: 3, difficulty: "medium" },
      { id: uid(2), user_id: user, created_at: "2026-09-12T00:00:00Z", total_questions: 1, correct_answers: 1, difficulty: "medium" },
      { id: uid(3), user_id: user, created_at: "2026-09-12T00:00:00Z", total_questions: 1, correct_answers: 1, difficulty: "precision" },
    ],
    rc_questions: [{ id: uid(4), user_id: user, session_id: uid(2), created_at: "2026-09-12T00:00:00Z", is_correct: true }],
  })
  const batch = await loadActivityBatch(db, [user], "2026-09-12", "2026-09-13")
  const summary = summarizeActivity(batch.get(user), "2026-09-12", "2026-09-13")
  assert.equal(summary.questions, 5); assert.equal(summary.questionActivitiesCount, 2)
})


test("paginated reads stop before another page after cancellation", async () => {
  const controller = new AbortController()
  const db = new MemoryDb({ rows: Array.from({ length: 501 }, (_, n) => ({ id: uid(n) })) })
  db.fail = () => { controller.abort(); return null }
  await assert.rejects(readAll(() => db.from("rows").select("id"), 500, { signal: controller.signal }))
  assert.equal(db.calls.length, 1)
})

test("paginated reads propagate cancellation to an in-flight request", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  const controller = new AbortController()
  let receivedSignal
  const db = createClient("https://database.invalid", "test-key", { auth: { persistSession: false }, global: { fetch: async (_, options) => {
    receivedSignal = options.signal
    controller.abort()
    options.signal.throwIfAborted()
  } } })
  await assert.rejects(readAll(() => db.from("rows").select("id"), 500, { signal: controller.signal }))
  assert.equal(receivedSignal.aborted, true)
})

test("generator cancels a slow activity read and still finishes the ledger", async () => {
  const db = new MemoryDb({ profiles: [{ user_id: user, created_at: "2026-08-01T00:00:00Z" }] })
  const loadActivity = async (_, ids, from, to, { signal }) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(new Map()), 1000)
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true })
  })
  const result = await runInboxGenerator(db, { budgetMs: 30, loadActivity, logger: silent })
  assert.equal(result.status, "partial")
  assert.equal(result.created, 0)
  assert.equal(db.tables.inbox_generation_runs[0].status, "partial")
  assert.ok(db.tables.inbox_generation_runs[0].finished_at)
  assert.match(db.tables.inbox_generation_runs[0].error, /Time budget/)
})

test("history failure skips its batch and does not stop subsequent users", async () => {
  const profiles = Array.from({ length: 51 }, (_, n) => ({ user_id: uid(n + 1), created_at: "2026-08-01T00:00:00Z" }))
  const db = new MemoryDb({ profiles })
  let historyReads = 0
  db.fail = query => query.table === "inbox_notifications" && query.method === "select" && ++historyReads === 1 ? { message: "timeout" } : null
  const result = await runInboxGenerator(db, { now: new Date("2026-09-13T02:30:00Z"), loadActivity: async (_, ids) => new Map(ids.map(id => [id, []])), logger: silent })
  assert.equal(result.failed, 50); assert.equal(result.created, 1); assert.equal(result.status, "partial")
})

test("bulk deadline returns acknowledged writes without inventing missing IDs or a count", async () => {
  const db = new MemoryDb({ inbox_notifications: Array.from({ length: 150 }, (_, n) => message(n + 1)) })
  const controller = new AbortController()
  let writes = 0
  db.fail = query => { if (query.method === "update" && ++writes === 2) controller.abort(); return null }
  const result = await mutateInbox(db, user, { action: "read", ids: db.tables.inbox_notifications.map(row => row.id) }, { signal: controller.signal })
  assert.equal(result.partial, true); assert.equal(result.refreshRequired, true)
  assert.equal(result.updated.length, 100); assert.equal(result.current.length, 100)
  assert.deepEqual(result.missingIds, []); assert.equal(result.unreadCount, null)
  assert.match(result.error, /Some changes may have been saved/)
  assert.equal(db.tables.inbox_notifications.filter(row => row.read_at).length, 150)
})

test("bulk reconciliation failure preserves confirmed writes and reports incomplete", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1)] })
  db.fail = query => query.method === "select" ? { message: "timeout" } : null
  const result = await mutateInbox(db, user, { action: "read", ids: [uid(1)] })
  assert.equal(result.partial, true); assert.equal(result.updated.length, 1)
  assert.deepEqual(result.missingIds, []); assert.equal(result.unreadCount, null)
})


for (const days of [7, 14, 28, 29, 30, 56, 57, 90]) test(`streak milestone at ${days} days uses an exact threshold, including a bounded history`, () => {
  const date = "2026-09-13"
  const events = Array.from({ length: days }, (_, n) => event({ day: shiftDay(date, -n - 1), sessionId: String(n) }))
  for (const window of [events, events.filter(row => row.day >= shiftDay(date, -29))]) {
    const result = rule({ events: window })
    assert.equal(result.type === "STREAK", [7, 14, 28].includes(days))
    if ([7, 14, 28].includes(days)) {
      assert.equal(result.ruleKey, `streak:${shiftDay(date, -days)}:${days}`)
      assert.notEqual(rule({ events: window, history: [{ rule_key: result.ruleKey }] }).type, "STREAK")
    }
  }
})

test("streaks reset after a gap and preserve daily uniqueness", async () => {
  const events = Array.from({ length: 7 }, (_, n) => event({ day: shiftDay("2026-09-13", -n - 1), sessionId: String(n) }))
  const first = rule({ events })
  const resumed = rule({ dateKey: "2026-09-22", events: events.map(e => ({ ...e, day: shiftDay(e.day, 9) })), history: [{ rule_key: first.ruleKey }] })
  assert.equal(resumed.type, "STREAK"); assert.notEqual(first.ruleKey, resumed.ruleKey)
  const db = new MemoryDb()
  assert.ok(await createInboxNotification(db, first)); assert.equal(await createInboxNotification(db, first), null)
})

for (const url of ["/%61pi/inbox/generate", "/%5fnext/static/x", "/a/../%61pi/inbox", "/%61pi%2finbox", "/%5Fnext", "/%2561pi/inbox"]) test(`encoded excluded CTA rejects ${url}`, () => assert.throws(() => internalPath(url)))

test("decoded CTA validation keeps search query and hash data legitimate", () => {
  assert.equal(internalPath("/history?search=scope%20trap#results"), "/history?search=scope%20trap#results")
  assert.equal(internalPath("/history?search=%61pi#results"), "/history?search=%61pi#results")
})

for (const action of ["read", "unread", "archive", "unarchive", "delete", "restore"]) test(`explicit ${action} can undo only acknowledged messages`, async () => {
  const initial = message(1, { read_at: action === "unread" ? "original" : null, archived_at: action === "unarchive" || action === "restore" ? "archived" : null, deleted_at: action === "restore" ? "deleted" : null })
  const db = new MemoryDb({ inbox_notifications: [initial, message(2, { user_id: other })] })
  const result = await mutateInbox(db, user, { action, ids: [uid(1), uid(2)] })
  const undo = inboxUndo(action, result)
  assert.deepEqual(undo.ids, [uid(1)])
  const restored = await mutateInbox(db, user, undo)
  assert.equal(restored.updated.length, 1)
  const row = db.tables.inbox_notifications[0]
  for (const field of ["read_at", "archived_at", "deleted_at"]) assert.equal(Boolean(row[field]), Boolean(initial[field]))
  assert.equal(row.body, initial.body)
})

test("undo skips later changes in another tab and excludes unsafe scopes", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1)] })
  const result = await mutateInbox(db, user, { action: "archive", ids: [uid(1)] })
  const undo = inboxUndo("archive", result)
  db.tables.inbox_notifications[0].updated_at = "2099-01-01T00:00:00.000Z"
  assert.equal((await mutateInbox(db, user, undo)).updated.length, 0)
  assert.ok(db.tables.inbox_notifications[0].archived_at)
  assert.equal(inboxUndo("read", result, { all: true }), null)
  assert.equal(inboxUndo("archive", { ...result, partial: true }), null)
  assert.equal(inboxUndo("archive", { updated: [] }), null)
  assert.throws(() => parseAction({ action: "read", ids: [uid(1)], ifUpdatedAt: "injected" }))
  assert.throws(() => parseAction({ action: "read", all: true, ifUpdatedAt: undo.ifUpdatedAt }))
})

test("archive/unarchive no-ops cannot become undo candidates", async () => {
  const db = new MemoryDb({ inbox_notifications: [message(1, { archived_at: "existing" }), message(2)] })
  assert.equal((await mutateInbox(db, user, { action: "archive", ids: [uid(1)] })).updated.length, 0)
  assert.equal((await mutateInbox(db, user, { action: "unarchive", ids: [uid(2)] })).updated.length, 0)
})

test("request deadline settles even when an underlying operation ignores cancellation", async () => {
  const { withInboxDeadline, InboxTimeoutError } = await import("../lib/inbox/request.js")
  let bounded
  await assert.rejects(withInboxDeadline(signal => { bounded = signal; return new Promise(() => {}) }, { timeoutMs: 10 }), InboxTimeoutError)
  assert.equal(bounded.aborted, true)
  const abort = new AbortController(); abort.abort()
  await assert.rejects(withInboxDeadline(() => assert.fail("must not start"), { signal: abort.signal }))
})

for (const stage of ["session", "fetch", "body", "mutation", "unread-count"]) test(`Inbox ${stage} wait is bounded`, async () => {
  const { createInboxRequest, InboxTimeoutError } = await import("../lib/inbox/request.js")
  const never = () => new Promise(() => {})
  const session = () => Promise.resolve({ data: { session: { access_token: "fixture" } } })
  let signal
  const api = createInboxRequest(stage === "session" ? never : session, async (_, options) => {
    signal = options.signal
    return stage === "body" ? { ok: true, json: never } : never()
  }, { sessionTimeoutMs: 10, readTimeoutMs: 20, writeTimeoutMs: 20 })
  await assert.rejects(api(stage === "unread-count" ? "/api/inbox/unread-count" : "/api/inbox", { method: stage === "mutation" ? "PATCH" : "GET" }), InboxTimeoutError)
  if (signal) assert.equal(signal.aborted, true)
})

test("bounded API preserves authorization, cancellation, errors and successful JSON", async () => {
  const { createInboxRequest } = await import("../lib/inbox/request.js")
  let sent
  const api = createInboxRequest(async () => ({ data: { session: { access_token: "fixture" } } }), async (_, options) => { sent = options; return { ok: true, json: async () => ({ unreadCount: 3 }) } })
  assert.equal((await api("/api/inbox")).unreadCount, 3)
  assert.equal(sent.headers.Authorization, "Bearer fixture"); assert.equal(sent.cache, "no-store")
  const guest = createInboxRequest(async () => ({ data: { session: null } }), () => assert.fail("guest must not fetch"))
  await assert.rejects(guest("/api/inbox"), error => error.status === 401)
})

test("generator loads the 29th day and prevents rolling 28-day notifications", async () => {
  const db = new MemoryDb({ profiles: [{ user_id: user, created_at: "2020-01-01" }] })
  const result = await runInboxGenerator(db, { now: new Date("2026-09-13T02:30:00Z"), logger: silent, loadActivity: async (_, ids, from) => {
    assert.equal(from, "2026-08-15")
    return new Map([[user, Array.from({ length: 29 }, (_, n) => event({ day: shiftDay("2026-09-13", -n - 1) }))]])
  } })
  assert.equal(result.status, "complete"); assert.notEqual(db.tables.inbox_notifications[0]?.type, "STREAK")
})

test("generator closes timed-out history reads even when the database ignores abort", async () => {
  const db = new MemoryDb({ profiles: [{ user_id: user }] })
  const from = db.from.bind(db)
  db.from = table => { const q = from(table); if (table === "inbox_notifications") q.then = () => new Promise(() => {}); return q }
  const result = await runInboxGenerator(db, { budgetMs: 40, logger: silent })
  assert.equal(result.status, "partial"); assert.ok(db.tables.inbox_generation_runs[0].finished_at)
})

test("generator recovers killed runs, preserves live runs and retries ledger finalization", async () => {
  const db = new MemoryDb({ inbox_generation_runs: [{ id: uid(1), status: "running", started_at: "2020-01-01T00:00:00Z" }, { id: uid(2), status: "running", started_at: new Date().toISOString() }] })
  let finishCalls = 0
  db.fail = q => q.table === "inbox_generation_runs" && q.method === "update" && q.patch.status === "complete" && ++finishCalls === 1 ? { message: "temporary failure" } : null
  const result = await runInboxGenerator(db, { logger: silent })
  assert.equal(result.status, "complete"); assert.equal(finishCalls, 2)
  assert.equal(db.tables.inbox_generation_runs[0].status, "failed")
  assert.equal(db.tables.inbox_generation_runs[1].status, "running")
  assert.equal(db.tables.inbox_generation_runs.at(-1).status, "complete")
})

test("navigation exposes Inbox on desktop and mobile without replacing existing items", async () => {
  const desktop = fs.readFileSync("app/page.js", "utf8")
  const mobile = fs.readFileSync("app/components/MobileBottomNav.jsx", "utf8")
  assert.match(desktop, /id: "inbox", label: "Inbox", icon: Inbox, unreadCount: inboxUnreadCount/)
  const React = await import("react"), runtime = await import("react/jsx-runtime"), icons = await import("lucide-react")
  const { renderToStaticMarkup } = await import("react-dom/server")
  const module = { exports: {} }
  const compiled = ts.transpileModule(mobile, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  new Function("require", "module", "exports", compiled)(name => name === "react/jsx-runtime" ? runtime : name === "lucide-react" ? icons : { useRouter: () => ({ push() {} }) }, module, module.exports)
  const html = renderToStaticMarkup(React.createElement(module.exports.default, { view: "home", inboxUnreadCount: 7, capabilities: { showCATSectionals: true } }))
  for (const label of ["Home", "Inbox", "Practice", "CAT", "Profile"]) assert.ok(html.includes(`aria-label="${label}"`))
  assert.match(html, />7</)
  assert.match(mobile, /router.push\("\/inbox"\)/); assert.match(desktop, /router.push\("\/inbox"\)/)
})

test("production catalog checks remain a read-only SQL assertion script", () => {
  const sql = fs.readFileSync(new URL("./inbox-security.sql", import.meta.url), "utf8")
  assert.match(sql, /begin read only;/)
  assert.equal(sql.split("$$").length - 1, 2)
  assert.match(sql, /do \$\$/)
  assert.match(sql, /rollback;/)
  for (const object of ["inbox_notifications_rule_key_idx", "inbox_notifications_daily_cap_idx", "inbox_assign_proactive_day", "service_role", "relrowsecurity", "pg_policies"]) assert.ok(sql.includes(object))
})
