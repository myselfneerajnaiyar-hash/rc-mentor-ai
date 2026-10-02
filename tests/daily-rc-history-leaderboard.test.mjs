import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { filterDailyRcHistorySets } from "../lib/dailyRc/history.mjs"
import { selectDailyRcLeaderboardSet } from "../lib/dailyRc/leaderboard.mjs"

function selectRows(rows) {
  const filters = []
  const query = {
    filters,
    eq(column, value) { filters.push(row => row[column] === value); return query },
    lt(column, value) { filters.push(row => row[column] < value); return query },
    lte(column, value) { filters.push(row => row[column] <= value); return query },
    in(column, values) { filters.push(row => values.includes(row[column])); return query },
    not(column, operator, value) {
      assert.equal(operator, "in")
      const excluded = value.slice(1, -1).split(",")
      filters.push(row => !excluded.includes(row[column]))
      return query
    },
    rows() { return rows.filter(row => filters.every(filter => filter(row))) },
  }
  return query
}

const passages = [
  { id: "billie", category: "daily_rc_challenge", challenge_date: "2026-10-03", is_published: true },
  { id: "daily-unattempted", category: "daily_rc_challenge", challenge_date: "2026-10-02", is_published: true },
  { id: "daily-old-attempt", category: "daily_rc_challenge", challenge_date: "2026-10-01", is_published: true },
  { id: "daily-draft", category: "daily_rc_challenge", challenge_date: "2026-10-02", is_published: false },
  { id: "cat-today", category: "cat_pyq", challenge_date: "2026-10-03", is_published: true },
  { id: "cat-old", category: "cat_pyq", challenge_date: "2026-10-01", is_published: true },
]

test("same-day completed Daily RC Challenge appears as attempted, never unattempted", () => {
  const attemptedSetIds = ["billie", "daily-old-attempt"]
  const attempted = filterDailyRcHistorySets(selectRows(passages), {
    category: "daily_rc_challenge", status: "attempted", today: "2026-10-03", attemptedSetIds,
  }).rows()
  const unattempted = filterDailyRcHistorySets(selectRows(passages), {
    category: "daily_rc_challenge", status: "unattempted", today: "2026-10-03", attemptedSetIds,
  }).rows()
  assert.deepEqual(attempted.map(row => row.id), ["billie", "daily-old-attempt"])
  assert.deepEqual(unattempted.map(row => row.id), ["daily-unattempted"])
  assert.ok(!unattempted.some(row => row.id === "billie"))
})

test("CAT PYQ history retains its category and legacy date filtering", () => {
  const attempted = filterDailyRcHistorySets(selectRows(passages), {
    category: "cat_pyq", status: "attempted", today: "2026-10-03", attemptedSetIds: ["cat-old", "cat-today"],
  }).rows()
  const unattempted = filterDailyRcHistorySets(selectRows(passages), {
    category: "cat_pyq", status: "unattempted", today: "2026-10-03", attemptedSetIds: ["cat-old"],
  }).rows()
  assert.deepEqual(attempted.map(row => row.id), ["cat-old"])
  assert.deepEqual(unattempted, [])
})

test("leaderboard set selection isolates categories; completed attempts use the existing score/time order", async () => {
  const dailySet = selectDailyRcLeaderboardSet(selectRows(passages), "daily_rc_challenge", "2026-10-03").rows()
  const catSet = selectDailyRcLeaderboardSet(selectRows(passages), "cat_pyq", "2026-10-03").rows()
  assert.deepEqual(dailySet.map(row => row.id), ["billie"])
  assert.deepEqual(catSet.map(row => row.id), ["cat-today"])

  const [savePage, leaderboardRoute, weeklyRoute, section, component] = await Promise.all([
    readFile(new URL("../app/daily-challenge/test/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-leaderboard/route.js", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-weekly-challenge/route.js", import.meta.url), "utf8"),
    readFile(new URL("../components/home-v2/LeaderboardSection.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/RCLeaderboard.jsx", import.meta.url), "utf8"),
  ])
  assert.match(savePage, /daily_rc_set_id:\s*challenge\.id/)
  assert.match(savePage, /completed_at:\s*new Date\(\)/)
  assert.match(leaderboardRoute, /new URL\(req\.url\)\.searchParams\.get\("category"\)/)
  assert.match(leaderboardRoute, /\.eq\(\s*"daily_rc_set_id",\s*todaySet\.id\s*\)/)
  assert.match(leaderboardRoute, /\.order\("score",\s*\{\s*ascending:\s*false\s*\}\)/)
  assert.match(leaderboardRoute, /\.order\("time_taken",\s*\{\s*ascending:\s*true\s*\}\)/)
  assert.match(weeklyRoute, /\.eq\("category", "cat_pyq"\)/)
  assert.match(section, /<RCLeaderboard category="daily_rc_challenge"\s*\/>/)
  assert.match(section, /<RCLeaderboard category="cat_pyq"\s*\/>/)
  assert.match(component, /rc-leaderboard\?category=\$\{encodeURIComponent\(category\)\}/)
})
