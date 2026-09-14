import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"
import { dailyRcAttemptHref, loadDailyRcReview } from "../lib/dailyRc/review.js"

function fixtures() {
  const sets = ["A", "B", "current"].map((id, i) => ({ id, source_year: ["2024", "2025", "2026"][i], challenge_date: ["2024-10-01", "2025-10-01", "2026-09-13"][i], passage: `Passage ${id}`, passage_enrichment: { centralDebate: `Explanation ${id}` } }))
  const questions = sets.flatMap(set => [1, 2].map(n => ({ id: `${set.id}-q${n}`, daily_rc_set_id: set.id, order_no: n, question_text: `${set.id} question ${n}`, options: [`${set.id} option 1`, `${set.id} option 2`], correct_answer: "1", question_enrichment: { explanation: `${set.id} explanation ${n}` } })))
  const attempts = sets.map(set => ({ id: `attempt-${set.id}`, user_id: "owner", daily_rc_set_id: set.id, completed_at: "2026-09-13T00:00:00Z", correct_count: 1, incorrect_count: 0, unanswered_count: 1 }))
  const responses = questions.map(q => ({ attempt_id: `attempt-${q.daily_rc_set_id}`, question_id: q.id, selected_option: q.order_no === 1 ? "A" : null, correct_option: "A", is_correct: q.order_no === 1 }))
  return { daily_rc_sets: sets, daily_rc_questions: questions, daily_rc_attempts: attempts, daily_rc_question_attempts: responses }
}

function database(rows) {
  const calls = []
  return { calls, from(table) {
    const filters = []
    calls.push({ table, filters })
    let order
    const result = () => ({ data: rows[table].filter(row => filters.every(([key, values]) => values.includes(row[key]))).sort((a, b) => order ? a[order] - b[order] : 0), error: null })
    const query = {
      select: () => query,
      eq: (key, value) => { filters.push([key, [value]]); return query },
      in: (key, values) => { filters.push([key, values]); return query },
      order: key => { order = key; return query },
      maybeSingle: async () => ({ ...result(), data: result().data[0] || null }),
      then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
    }
    return query
  } }
}

test("2024 A, older B and current attempts retain exact passages, question IDs, answers and explanations", async () => {
  const rows = fixtures()
  const db = database(rows)
  const original = await loadDailyRcReview(db, "owner", "attempt-A")
  for (const id of ["B", "current", "A", "B", "A"]) {
    const review = await loadDailyRcReview(db, "owner", `attempt-${id}`)
    assert.equal(review.rcSet.passage, `Passage ${id}`)
    assert.equal(review.rcSet.passage_enrichment.centralDebate, `Explanation ${id}`)
    assert.deepEqual(review.questions.map(q => q.order_no), [1, 2])
    assert.deepEqual(review.questions.map(q => q.id), [`${id}-q1`, `${id}-q2`])
    assert.deepEqual(review.questions.map(q => q.question_enrichment.explanation), [`${id} explanation 1`, `${id} explanation 2`])
    assert.deepEqual(review.responses.map(r => [r.question_id, r.selected_option, r.correct_option]), [[`${id}-q1`, "A", "A"], [`${id}-q2`, null, "A"]])
    if (id === "A") assert.deepEqual(review, original)
  }
  assert.equal(original.rcSet.source_year, "2024")
  assert.ok(db.calls.every(call => !call.filters.some(([key]) => key === "challenge_date")))
})

test("another user's attempt is rejected before fetching any passage or answers", async () => {
  const db = database(fixtures())
  await assert.rejects(loadDailyRcReview(db, "other-user", "attempt-A"), { status: 404 })
  assert.deepEqual(db.calls.map(call => call.table), ["daily_rc_attempts"])
  await assert.rejects(loadDailyRcReview(db, null, "attempt-A"), { status: 401 })
})

test("missing attempt IDs never fall back to today's or latest RC", async () => {
  const db = database(fixtures())
  await assert.rejects(loadDailyRcReview(db, "owner", null), { status: 400 })
  assert.equal(db.calls.length, 0)
  assert.equal(dailyRcAttemptHref("/detailed-review", null), "/rc-history")
  assert.equal(dailyRcAttemptHref("/detailed-review", "attempt-A"), "/detailed-review?attemptId=attempt-A")
})

test("later additions to a set are not substituted for the persisted question set", async () => {
  const rows = fixtures()
  rows.daily_rc_questions.push({ ...rows.daily_rc_questions[0], id: "new-question", order_no: 3 })
  const review = await loadDailyRcReview(database(rows), "owner", "attempt-A")
  assert.deepEqual(review.questions.map(q => q.id), ["A-q1", "A-q2"])
})

for (const corruption of ["wrong-set", "missing-question", "missing-passage", "missing-response", "changed-key"]) {
  test(`incomplete or inconsistent historical data fails closed: ${corruption}`, async () => {
    const rows = fixtures()
    if (corruption === "wrong-set") rows.daily_rc_question_attempts[0].question_id = "B-q1"
    if (corruption === "missing-question") rows.daily_rc_questions.shift()
    if (corruption === "missing-passage") rows.daily_rc_sets.shift()
    if (corruption === "missing-response") rows.daily_rc_question_attempts.shift()
    if (corruption === "changed-key") rows.daily_rc_questions[0].correct_answer = "2"
    await assert.rejects(loadDailyRcReview(database(rows), "owner", "attempt-A"), { status: 409 })
  })
}

async function compile(file, dependencies, globals = {}, expose = "") {
  const source = await readFile(new URL(file, import.meta.url), "utf8")
  const exports = {}
  const compiled = ts.transpileModule(source, { fileName: file, reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } })
  assert.equal(compiled.diagnostics.length, 0)
  vm.runInNewContext(compiled.outputText + expose, { exports, URL, AbortController, ...globals, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`)
    return dependencies[name]
  } })
  return exports
}

test("today's completed report link receives and retains its own attempt ID", async () => {
  const jsx = (type, props) => ({ type, props })
  const page = await compile("../app/daily-challenge/page.jsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx }, react: {}, "@/lib/supabase": {},
    "next/link": { default: "Link" }, "@/components/DailyRcAnalytics": {}, "lucide-react": {},
  }, {}, ";exports.TodaysRc = TodaysRc;")
  const tree = page.TodaysRc({ challenge: {}, title: "Current", timer: 8, questionCount: 4, alreadyAttempted: true, attemptId: "current-attempt" })
  const hrefs = []
  function visit(node) {
    if (!node || typeof node !== "object") return
    if (node.props?.href) hrefs.push(node.props.href)
    for (const child of Object.values(node)) Array.isArray(child) ? child.forEach(visit) : visit(child)
  }
  visit(tree)
  assert.ok(hrefs.includes("/daily-challenge/result?attemptId=current-attempt"))
  const source = await readFile(new URL("../app/daily-challenge/page.jsx", import.meta.url), "utf8")
  assert.match(source, /<TodaysRc[^>]*attemptId=\{attemptId\}/)
})

test("review API uses authenticated identity and disables caching", async () => {
  let access = { ok: true, identity: { user: { id: "owner" } } }
  const requestedId = "11111111-1111-1111-1111-111111111111"
  const calls = []
  const route = await compile("../app/api/daily-rc-review/route.js", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    "@/lib/supabaseAdmin": { supabaseAdmin: {} },
    "@/lib/tenant/requireCapability": { requireCapability: async () => access },
    "@/lib/dailyRc/review": { DailyRcReviewError: Error, loadDailyRcReview: async (_db, ...args) => { calls.push(args); return { attempt: { id: requestedId } } } },
  })
  const request = { url: `https://example.com/api/daily-rc-review?attemptId=${requestedId}&userId=attacker` }
  const result = await route.GET(request)
  assert.deepEqual(calls, [["owner", requestedId]])
  assert.equal(result.headers["Cache-Control"], "private, no-store")
  access = { ok: false, status: 401 }
  assert.equal((await route.GET(request)).status, 401)
  assert.equal(calls.length, 1)
})

test("client route changes hide old data, abort stale responses and ignore localStorage", async () => {
  let state, cleanup, lastId, effects = []
  const requests = []
  const { useDailyRcReview } = await compile("../lib/dailyRc/useReview.js", {
    react: {
      useState: () => [state, value => { state = value }],
      useEffect: (effect, [id]) => { if (id !== lastId) { cleanup?.(); effects.push(effect); lastId = id } },
    },
    "@/lib/supabase": { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "mock", user: { id: "owner" } } } }) } } },
  }, {
    localStorage: { getItem: () => assert.fail("Review must not read cached results") },
    fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })),
  })
  const tick = () => new Promise(resolve => setImmediate(resolve))
  async function render(id) {
    const value = useDailyRcReview(id)
    for (const effect of effects.splice(0)) cleanup = effect()
    await tick()
    return value
  }
  const response = id => ({ ok: true, json: async () => ({ attempt: { id, user_id: "owner" }, rcSet: { passage: id } }) })
  await render("A")
  requests[0].resolve(response("A")); await tick()
  assert.equal((await render("A")).data.rcSet.passage, "A")
  assert.equal((await render("B")).data, null)
  assert.equal(requests[0].options.signal.aborted, true)
  assert.equal((await render("A")).data?.rcSet.passage ?? null, "A")
  requests[2].resolve(response("A")); await tick()
  requests[1].resolve(response("B")); await tick()
  assert.equal((await render("A")).data.rcSet.passage, "A")
  assert.ok(requests.every(r => r.options.cache === "no-store"))
  await render("C")
  requests[3].resolve(response("B")); await tick()
  assert.match((await render("C")).error, /does not match/)
})

test("submission and all review entry points retain attempt identity", async () => {
  const files = ["../app/detailed-review/page.js", "../app/cognition-diagnosis/page.js", "../components/DailyRCResult.jsx", "../app/rc-session/[attemptId]/page.jsx"]
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8")
    assert.match(source, /useDailyRcReview\(|<DailyRCResult/)
    assert.doesNotMatch(source, /localStorage|\.from\("daily_rc_sets"\)|href="\/detailed-review"/)
    const result = ts.transpileModule(source, { fileName: file, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX } })
    assert.equal(result.diagnostics.length, 0)
  }
  const submission = await readFile(new URL("../app/daily-challenge/test/page.jsx", import.meta.url), "utf8")
  assert.match(submission, /daily_rc_set_id: challenge.id/)
  assert.match(submission, /attempt_id: attemptRow.id/)
  assert.match(submission, /question_id: q.id/)
  assert.match(submission, /result\?attemptId=\$\{encodeURIComponent\(attemptRow.id\)\}/)
  assert.match(submission, /key=\{selectedChallengeId \|\| "today"\}/)
  assert.doesNotMatch(submission, /dailyRCResult/)
})

test("historical and new result routes share the compact report and preserve the requested attempt", async () => {
  const jsx = (type, props) => ({ type, props })
  const dependencies = { "react/jsx-runtime": { jsx, jsxs: jsx }, "@/components/DailyRCResult": { default: "CompactReport" } }
  const historical = await compile("../app/rc-session/[attemptId]/page.jsx", {
    ...dependencies, "next/navigation": { useParams: () => ({ attemptId: "old-attempt" }) },
  })
  assert.equal(historical.default().type, "CompactReport")
  assert.equal(historical.default().props.attemptId, "old-attempt")
  const current = await compile("../app/daily-challenge/result/page.jsx", dependencies)
  assert.equal(current.default().type, "CompactReport")
  for (const [file, section] of [["detailed-review", "detailed-review"], ["cognition-diagnosis", "cognitive-diagnosis"]]) {
    const route = await compile(`../app/${file}/page.js`, dependencies)
    assert.equal(route.default().type, "CompactReport")
    assert.equal(route.default().props.initialSection, section)
  }
})

test("compact report retains saved stats and expands review content inside the same shell", async () => {
  const React = await import("react")
  const runtime = await import("react/jsx-runtime")
  const { renderToStaticMarkup } = await import("react-dom/server")
  let requestedId
  const review = await loadDailyRcReview(database(fixtures()), "owner", "attempt-A")
  Object.assign(review.attempt, { score: -1, accuracy: 50, time_taken: 125, composite_score: 7 })
  const Detail = ({ data }) => React.createElement("article", { "data-review": data.attempt.id }, data.rcSet.passage)
  const Cognitive = ({ data }) => React.createElement("article", { "data-diagnosis": data.attempt.id }, "Saved diagnosis")
  const report = await compile("../components/DailyRCResult.jsx", {
    "react/jsx-runtime": runtime, react: React, "next/navigation": { useSearchParams: () => new URLSearchParams("attemptId=attempt-A") },
    "@/lib/dailyRc/useReview": { useDailyRcReview: id => { requestedId = id; return { data: review } } },
    "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
    "lucide-react": { ArrowLeft: () => null },
    "@/components/DailyRCDetailedReview": { default: Detail },
    "@/components/DailyRCCognitiveDiagnosis": { default: Cognitive },
  })
  for (const attemptId of [undefined, "attempt-A"]) {
    const html = renderToStaticMarkup(React.createElement(report.default, { attemptId }))
    assert.equal(requestedId, "attempt-A")
    for (const text of ["RC Diagnosis Report", "RC Casualty", "Mentor Verdict", "Performance Profile", "Leaderboard Impact", "Today&#x27;s Mission", "50%", "2:05"]) assert.ok(html.includes(text), text)
    assert.match(html, /href="#detailed-review"/)
    assert.doesNotMatch(html, /href="\/detailed-review|data-review=|data-diagnosis=/)
    assert.equal((html.match(/aria-expanded="false"/g) || []).length, 2)
  }
  for (const section of ["detailed-review", "cognitive-diagnosis"]) {
    const html = renderToStaticMarkup(React.createElement(report.default, { initialSection: section }))
    assert.match(html, /RC Diagnosis Report/)
    assert.match(html, section === "detailed-review" ? /data-review="attempt-A">Passage A/ : /data-diagnosis="attempt-A"/)
    assert.equal((html.match(/aria-expanded="true"/g) || []).length, 1)
  }
})
