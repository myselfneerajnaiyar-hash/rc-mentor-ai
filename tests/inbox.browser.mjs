// Browser regression against a local Next server. All APIs use in-memory fixtures.
// Never points at production; run: node tests/inbox.browser.mjs
import { spawn } from "node:child_process"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import assert from "node:assert/strict"
import dotenv from "dotenv"
import { MemoryDb, message, uid } from "./helpers/inbox-db.mjs"
import { inboxHandlers } from "../lib/inbox/api.js"

const base = process.env.INBOX_TEST_BASE_URL || "http://localhost:3107"
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Browser fixture must stay local")
const env = dotenv.parse(await readFile(".env.local"))
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
const user = { id: uid(9000), email: "inbox-fixture@example.test" }
const profile = { user_id: user.id, name: "Inbox Fixture", exam: "CAT", profile_completed: true, created_at: "2026-01-01T00:00:00Z", is_premium: true }
const branding = { brandName: "Auctor RC", logoUrl: "/logo.png", faviconUrl: "/icon-192.png", primaryColor: "#4f46e5", secondaryColor: "#0ea5e9", isInstitute: false }
const tenant = { kind: "b2c" }
const context = { user, profile, tenant, branding, capabilities: { showDailyRC: true, showCATSectionals: true, exam: "CAT" }, entitlement: { hasAccess: true, isPremium: true, isInstituteStudent: false } }
const session = { access_token: "inbox-fixture-token", refresh_token: "fixture-refresh", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 86400, expires_in: 86400, user }
const db = new MemoryDb({ inbox_notifications: Array.from({ length: 45 }, (_, i) => message(i + 1, { type: i % 2 ? "PROGRESS" : "SYSTEM", title: "Message " + (i + 1), archived_at: i >= 35 && i < 40 ? "2026-09-12T00:00:00Z" : null, deleted_at: i >= 40 ? "2026-09-12T00:00:00Z" : null, action_url: "/?view=precision", metadata: { actionLabel: "Practice" } })) })
const handlers = inboxHandlers({ db, authenticate: async () => ({ user }), logger: { error() {} } })
const directory = await mkdtemp(path.join(os.tmpdir(), "inbox-browser-"))
const executable = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe")
const browser = spawn(executable, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", "--user-data-dir=" + directory, "about:blank"], { windowsHide: true })
let stderr = ""
const endpoint = await new Promise((resolve, reject) => {
  browser.stderr.on("data", chunk => { stderr += chunk; const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) resolve(match[1]) })
  browser.once("error", reject)
  setTimeout(() => reject(new Error("Chrome startup timed out")), 15000).unref()
})
const socket = new WebSocket(endpoint)
await new Promise(resolve => { socket.onopen = resolve })
let serial = 0, sessionId, passed = 0
const pending = new Map(), exceptions = [], apiCalls = []
const keepAlive = setInterval(() => {}, 1000)
const send = (method, params = {}, sid = sessionId) => new Promise((resolve, reject) => {
  const id = ++serial; pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }))
})
const fulfill = (requestId, body, responseCode = 200) => send("Fetch.fulfillRequest", { requestId, responseCode, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Access-Control-Allow-Headers", value: "*" }, { name: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, OPTIONS" }], body: Buffer.from(JSON.stringify(body)).toString("base64") })
socket.onmessage = async event => {
  const data = JSON.parse(event.data)
  if (data.id) { const item = pending.get(data.id); pending.delete(data.id); data.error ? item?.reject(new Error(JSON.stringify(data.error))) : item?.resolve(data.result); return }
  if (data.method === "Runtime.exceptionThrown") exceptions.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text)
  if (data.method !== "Fetch.requestPaused") return
  const { requestId, request } = data.params, url = new URL(request.url)
  try {
    if (request.method === "OPTIONS") { await fulfill(requestId, {}); return }
    if (url.pathname.startsWith("/api/inbox")) {
      apiCalls.push({ path: url.pathname, method: request.method })
      const req = new Request(request.url, { method: request.method, headers: request.headers, ...(request.postData ? { body: request.postData } : {}) })
      let response
      if (url.pathname === "/api/inbox") response = await (request.method === "PATCH" ? handlers.PATCH(req) : handlers.GET(req))
      else if (url.pathname.endsWith("unread-count")) response = await handlers.unread(req)
      else response = await handlers.detail(req, { params: { id: url.pathname.split("/").at(-1) } })
      await fulfill(requestId, await response.json(), response.status); return
    }
    if (url.pathname === "/api/tenant-context") { await fulfill(requestId, { tenant, branding }); return }
    if (url.pathname === "/api/session-context") { await fulfill(requestId, context); return }
    if (url.pathname === "/auth/v1/token") { await fulfill(requestId, session); return }
    if (url.pathname === "/auth/v1/user") { await fulfill(requestId, user); return }
    if (url.pathname === "/auth/v1/logout") { await fulfill(requestId, {}); return }
    if (url.pathname.startsWith("/rest/v1/")) { await fulfill(requestId, url.pathname.endsWith("profiles") ? (request.headers.Accept?.includes("object") || request.headers.accept?.includes("object") ? profile : [profile]) : []); return }
    if (url.pathname === "/api/birbal-context") { await fulfill(requestId, { analytics: { overallAccuracy: 0, readingIQ: 0, skills: [], readerType: "Learning" }, recommendations: [] }); return }
    if (url.pathname.startsWith("/api/")) { await fulfill(requestId, { messages: [], attempts: [], streak: 0, data: [] }); return }
    if (url.origin === base) { await send("Fetch.continueRequest", { requestId }); return }
    // No production requests, analytics, or external side effects.
    await send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" })
  } catch (error) { exceptions.push(error.message); await fulfill(requestId, { error: error.message }, 500) }
}
async function evaluate(expression) {
  const value = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description)
  return value.result.value
}
async function waitFor(expression) {
  const end = Date.now() + 45000
  while (Date.now() < end) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)) }
  throw new Error("Timed out: " + expression + "\n" + await evaluate("document.body.innerText.slice(0,1500)"))
}
async function click(label) {
  await evaluate("(()=>{const controls=[...document.querySelectorAll('button,a')].filter(e=>!e.disabled);const element=controls.find(e=>e.getAttribute('aria-label')===" + JSON.stringify(label) + ") || controls.find(e=>e.textContent.trim()===" + JSON.stringify(label) + ");if(!element)throw Error('Control missing');element.click()})()")
}
const idle = async () => { await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))"); return waitFor("!!document.querySelector('fieldset[aria-busy=\"false\"]:not(:disabled)') && !document.querySelector('[role=\"alert\"]')") }
function pass(name) { passed++; console.log("PASS", name) }
async function screenshot(name) { const result = await send("Page.captureScreenshot", { format: "png" }); await writeFile(path.join(directory, name + ".png"), Buffer.from(result.data, "base64")) }
async function fill(selector, value) { await evaluate("(()=>{const input=document.querySelector(" + JSON.stringify(selector) + ");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input," + JSON.stringify(value) + ");input.dispatchEvent(new Event('input',{bubbles:true}));})()") }
try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" }, null)
  ;({ sessionId } = await send("Target.attachToTarget", { targetId, flatten: true }, null))
  await send("Runtime.enable"); await send("Page.enable"); await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] })
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send("Page.navigate", { url: base + "/inbox" })
  await waitFor("location.pathname==='/login' && !!document.querySelector('#login-email')")
  await fill("#login-email", user.email); await fill("#login-password", "fixture-password")
  await evaluate("document.querySelector('form').requestSubmit()")
  await waitFor("location.pathname==='/inbox' && document.body.innerText.includes('Message 35')"); await idle()
  pass("login -> Inbox with return destination")
  assert.equal(await evaluate("document.querySelectorAll('article').length"), 20)
  await click("Load older messages"); await waitFor("document.querySelectorAll('article').length===35"); pass("cursor pagination")
  await fill('[aria-label="Search inbox"]', "Message 1"); await waitFor("document.querySelectorAll('article').length===11"); pass("search")
  await click("Clear search"); await waitFor("document.querySelectorAll('article').length===20")
  await click("Progress"); await waitFor("document.querySelectorAll('article').length===17"); pass("category filter")
  await click("All"); await waitFor("document.querySelectorAll('article').length===20")
  await evaluate("document.querySelector('article button:nth-child(2)').click()")
  await waitFor("!!document.querySelector('[role=dialog]') && document.querySelector('[role=dialog]').innerText.includes('Saved message')"); await idle()
  assert.ok(db.tables.inbox_notifications.find(row => row.id === uid(35)).read_at)
  await waitFor("document.body.innerText.includes('34 unread messages')"); pass("reader opens, marks read and updates unread count")
  await click("Mark unread"); await idle(); assert.equal(db.tables.inbox_notifications.find(row => row.id === uid(35)).read_at, null)
  await click("Back"); await click("Undo"); await idle(); assert.ok(db.tables.inbox_notifications.find(row => row.id === uid(35)).read_at); pass("mark unread and undo")
  await click("Select Message 35"); await click("Select Message 34"); await click("Archive"); await idle()
  assert.ok(db.tables.inbox_notifications.find(row => row.id === uid(35)).archived_at)
  await click("Undo"); await idle(); assert.equal(db.tables.inbox_notifications.find(row => row.id === uid(35)).archived_at, null); pass("multi-select bulk archive and undo")
  await click("Select Message 35"); await click("Select Message 34"); await click("Delete"); await idle()
  assert.ok(db.tables.inbox_notifications.find(row => row.id === uid(35)).deleted_at)
  await click("Trash"); await idle(); await click("Select Message 35"); await click("Restore"); await idle()
  assert.equal(db.tables.inbox_notifications.find(row => row.id === uid(35)).deleted_at, null)
  await click("Undo"); await idle(); assert.ok(db.tables.inbox_notifications.find(row => row.id === uid(35)).deleted_at); pass("bulk trash, restore and undo restore")
  await click("Inbox"); await idle(); await click("Mark all as read"); await idle()
  assert.ok(db.tables.inbox_notifications.filter(row=>!row.archived_at&&!row.deleted_at).every(row=>row.read_at))
  await waitFor("document.body.innerText.includes('cannot be undone')"); pass("mark all read and explicit undo exclusion")
  await click("Unread"); await idle(); assert.equal(await evaluate("document.querySelectorAll('article').length"), 0); await click("All"); await idle(); pass("unread filter after mark all read")
  await screenshot("inbox-desktop")
  db.tables.inbox_notifications.find(row=>row.id===uid(1)).read_at = null
  await send("Page.navigate", { url: base + "/" })
  await waitFor("!![...document.querySelectorAll('button')].find(e=>e.textContent.trim().startsWith('Inbox'))")
  await waitFor("[...document.querySelectorAll('nav.flex-col button')].some(e=>e.textContent.includes('Inbox') && e.textContent.includes('1'))"); pass("desktop unread badge")
  await evaluate("[...document.querySelectorAll('nav.flex-col button')].find(e=>e.textContent.trim().startsWith('Inbox')).click()")
  await waitFor("location.pathname==='/inbox'"); await idle(); pass("desktop Inbox navigation")
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await send("Page.navigate", { url: base + "/" }); await waitFor("!!document.querySelector('button[aria-label=Inbox]')")
  await waitFor("document.querySelector('button[aria-label=Inbox]')?.textContent.includes('1')"); pass("mobile unread badge")
  await click("Inbox"); await waitFor("location.pathname==='/inbox'"); await idle()
  assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth")); pass("mobile Inbox navigation and layout")
  await evaluate("document.querySelector('article button:nth-child(2)').click()")
  await waitFor("!!document.querySelector('[role=dialog]')"); await idle(); await screenshot("inbox-mobile-reader")
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 })
  await waitFor("!document.querySelector('[role=dialog]')"); pass("mobile reader and Escape")
  // Clear only this isolated browser's fixture session to simulate logout/session loss.
  await evaluate("localStorage.removeItem(" + JSON.stringify("sb-" + ref + "-auth-token") + ")")
  await send("Page.navigate", { url: base + "/inbox" })
  await waitFor("location.pathname==='/login' && !!document.querySelector('#login-email')")
  assert.ok(await evaluate("location.search.includes('next=')")); pass("session loss -> login with Inbox return")
  assert.deepEqual(exceptions, []); pass("no JavaScript runtime exceptions")
  console.log(JSON.stringify({ passed, fixtureOnly: true, screenshots: directory, inboxRequests: apiCalls.length }))
} finally { await send("Browser.close", {}, null); socket.close(); browser.kill(); clearInterval(keepAlive) }
