import assert from "node:assert/strict"
import { chromium } from "playwright-core"
import { readFile, mkdir } from "node:fs/promises"
import dotenv from "dotenv"

const output = ".tmp-grammar-ux"
await mkdir(output, { recursive: true })
const env = dotenv.parse(await readFile(".env.local"))
const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
const base = process.env.GRAMMAR_TEST_URL || "http://localhost:3112"
const browser = await chromium.launch({ executablePath: "C:/Users/NERAJ/.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe", headless: true })
const user = { id: "11111111-1111-4111-8111-111111111111", email: "grammar-audit@example.test" }
const session = { access_token: "local-audit-only", refresh_token: "local-audit-only", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 86400, expires_in: 86400, user }
const profile = { user_id: user.id, name: "Grammar Audit", exam: "CAT", is_premium: true }
const branding = { brandName: "Auctor", primaryColor: "#4f46e5", secondaryColor: "#0ea5e9", isInstitute: false }
const context = { user, profile, tenant: { kind: "b2c" }, branding, exam: "CAT", capabilities: { exam: "CAT", isCAT: true, showDailyRC: true, showCATSectionals: true }, entitlement: { hasAccess: true, isPremium: true, isInstituteStudent: false }, access: "allowed" }
const questions = Array.from({ length: 5 }, (_, i) => ({ id: `question-${i + 1}`, questionNumber: i + 1, questionType: i % 2 ? "Error Detection" : "Sentence Correction", skill: "Article Use with Proper Nouns", questionText: `Choose the correct article in sentence ${i + 1}.`, options: ["option-a", "option-b", "option-c", "option-d"].map((id, optionIndex) => ({ id: `${id}-${i + 1}`, label: String.fromCharCode(65 + optionIndex), text: `Answer ${String.fromCharCode(65 + optionIndex)} for question ${i + 1}` })) }))
const completed = { success: true, completed: true, attemptId: "attempt-1", topicId: "articles-determiners", topicName: "Articles & Determiners", difficulty: "moderate", score: 4, totalQuestions: 5, accuracy: 80, timeTakenSec: 100, questions: questions.map((q, i) => ({ ...q, selectedOptionId: `${i === 3 ? "option-c" : "option-a"}-${i + 1}`, correctOptionId: `${i === 3 ? "option-a" : "option-a"}-${i + 1}`, isCorrect: i !== 3, responseTimeSec: 20, explanation: { coreRule: "Use articles with geographic names according to convention.", whyCorrect: "The name takes the article in this context." }, selectedDiagnosis: i === 3 ? { whyChoiceFails: "The selected form omits the required article.", trap: "Exception Blindness", misconception: "Treating every proper name alike." } : null })) }
const catalog = (topicId) => {
  if (topicId === "all") return { success: true, topics: [{ topicId: "articles-determiners", availableTests: 30, availableQuestions: 150, overall: { percentage: 0 } }, { topicId: "prepositions", availableTests: 0, availableQuestions: 0, overall: { percentage: 0 } }] }
  return { success: true, topicId: "articles-determiners", availableTests: 30, availableQuestions: 150, overall: { percentage: 0 }, difficulties: Object.fromEntries(["easy", "moderate", "hard"].map((difficulty) => [difficulty, { completed: 0, total: 10, percentage: 0, sets: Array.from({ length: 10 }, (_, i) => ({ testId: `test-${difficulty}-${i + 1}`, setNumber: i + 1, questionCount: 5, completed: false })) }])) }
}
const analytics = { hasData: true, overall: { questionsAttempted: 5, questionsCorrect: 4, accuracy: 80, testsCompleted: 1, averageScore: 4, averageTimeSeconds: 20, currentStreak: null }, topics: [{ topicId: "articles-determiners", topicName: "Articles & Determiners", questionsAttempted: 5, questionsCorrect: 4, accuracy: 80, averageTimeSeconds: 20, mastery: "Strong", trend: null, weakestSkill: null }], difficulty: { easy: { attempted: 0, correct: 0, accuracy: null }, moderate: { attempted: 5, correct: 4, accuracy: 80 }, hard: { attempted: 0, correct: 0, accuracy: null } }, formats: [{ format: "Sentence Correction", attempted: 3, correct: 3, accuracy: 100 }, { format: "Error Detection", attempted: 2, correct: 1, accuracy: 50 }], weakestTopic: { topicId: "articles-determiners", topicName: "Articles & Determiners", accuracy: 80, questionsAttempted: 5, weakestSkill: null }, strongestTopic: { topicId: "articles-determiners", topicName: "Articles & Determiners", accuracy: 80, questionsAttempted: 5 }, missedQuestionCount: 1 }
const calls = []
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(({ projectRef, session }) => localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session)), { projectRef, session })
await ctx.route("**/*", async (route) => {
  const request = route.request(), url = new URL(request.url()), json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) calls.push({ path: url.pathname, method: request.method() })
  if (url.pathname === "/api/session-context") return json(context)
  if (url.pathname === "/api/tenant-context") return json({ tenant: context.tenant, branding })
  if (url.pathname === "/api/product-tour") return json({ completed: true })
  if (url.pathname === "/auth/v1/user") return json(user)
  if (url.pathname === "/auth/v1/token") return json(session)
  if (url.pathname.startsWith("/rest/v1/")) { const table = url.pathname.split("/").at(-1); if (table === "profiles") return json(request.headers().accept?.includes("object") ? profile : [profile]); if (table === "subscriptions") return json([]); return json([]) }
  if (url.pathname === "/api/grammar/catalog") return json(catalog(url.searchParams.get("topicId")))
  if (url.pathname === "/api/grammar/sessions" && request.method() === "POST") return json({ success: true, attemptId: "attempt-1", topicId: "articles-determiners", topicName: "Articles & Determiners", difficulty: "moderate", count: 5, questions })
  if (url.pathname === "/api/grammar/sessions/attempt-1/submit") return json(completed)
  if (url.pathname === "/api/grammar/analytics") return json({ success: true, analytics })
  if (url.pathname === "/api/grammar/history") return json({ success: true, history: [] })
  if (url.pathname.startsWith("/api/")) return json({ success: true, items: [] })
  if (url.origin === base) return route.continue()
  return route.abort()
})
const page = await ctx.newPage(), errors = []
page.on("pageerror", (error) => errors.push(error.message))
page.setDefaultTimeout(15000)
async function fit() { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${await page.evaluate(() => innerWidth)}px`) }
async function go() { await page.goto(`${base}/?view=grammar`, { waitUntil: "commit", timeout: 60000 }); try { await page.getByRole("heading", { name: "Grammar Lab", exact: true }).waitFor({ timeout: 60000 }) } catch (error) { console.error("Grammar route did not render:", await page.locator("body").innerText().catch(() => ""), calls); throw error } }

try {
  await go()
  await page.getByRole("button", { name: "Choose a topic" }).click()
  await page.getByRole("heading", { name: "What do you want to master?" }).waitFor()
  assert.ok(await page.getByText("Coming Soon", { exact: true }).count() > 0)
  assert.equal(await page.getByText("0/30 tests", { exact: false }).count(), 0)
  await fit()
  await page.getByRole("button", { name: /Articles & Determiners/ }).click()
  await page.getByRole("heading", { name: "Choose your challenge." }).waitFor()
  await page.getByRole("button", { name: /Moderate/ }).click()
  await page.getByRole("button", { name: /SET 1\/10/ }).click()
  await page.getByRole("navigation", { name: "Question navigation" }).getByRole("button", { name: /Question 3/ }).click()
  await page.getByRole("button", { name: "Answer A for question 3" }).click()
  await page.getByRole("button", { name: "Next" }).waitFor({ state: "visible" })
  await page.getByRole("navigation", { name: "Question navigation" }).getByRole("button", { name: /Question 1/ }).click()
  await page.getByRole("button", { name: "Answer A for question 1" }).click()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Answer A for question 2" }).click()
  await page.getByRole("button", { name: "Previous" }).click()
  assert.equal(await page.getByRole("button", { name: "Answer A for question 1" }).getAttribute("aria-pressed"), "true")
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Clear Answer" }).click()
  assert.equal(await page.getByRole("button", { name: "Next" }).isDisabled(), true)
  await page.getByRole("button", { name: "Answer A for question 3" }).click()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Answer A for question 4" }).click()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Answer A for question 5" }).click()
  await fit()
  await page.getByRole("button", { name: "Submit session" }).click()
  await page.getByText("Tap any question to see the detailed explanation.").waitFor()
  await page.getByRole("button", { name: "Question 4: incorrect" }).click()
  await page.getByText("The selected form omits the required article.").waitFor()
  await page.getByRole("button", { name: "Question 1: correct" }).click()
  await page.getByText("The name takes the article in this context.").waitFor()
  await page.getByRole("button", { name: "Back to Grammar Lab" }).click()
  await page.getByRole("button", { name: "Grammar Analytics" }).click()
  await page.getByText("Questions attempted", { exact: true }).waitFor()
  await page.getByRole("heading", { name: "Difficulty performance" }).waitFor()
  await page.getByRole("heading", { name: "Question format performance" }).waitFor()
  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); await fit() }
  assert.ok(calls.some((item) => item.path === "/api/grammar/analytics"))
  assert.deepEqual(errors, [])
  console.log("PASS: Grammar practice navigation, answer clearing, submission review, analytics, and 390px/1440px layout")
} finally {
  await page.screenshot({ path: `${output}/final.png`, fullPage: true }).catch(() => {})
  await browser.close()
}
