import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { filterDailyRcHistorySets } from "../lib/dailyRc/history.mjs"
import { loadDailyRcLeaderboard, selectDailyRcLeaderboardSet } from "../lib/dailyRc/leaderboard.mjs"
import { dailyRcTodayDate } from "../lib/dailyRc/today.mjs"

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

  const [savePage, leaderboardRoute, leaderboardData, weeklyRoute, weeklyData, section, component] = await Promise.all([
    readFile(new URL("../app/daily-challenge/test/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-leaderboard/route.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/dailyRc/leaderboard.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-weekly-challenge/route.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/weeklyRcCompetition.js", import.meta.url), "utf8"),
    readFile(new URL("../components/home-v2/LeaderboardSection.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/RCLeaderboard.jsx", import.meta.url), "utf8"),
  ])
  assert.match(savePage, /daily_rc_set_id:\s*challenge\.id/)
  assert.match(savePage, /completed_at:\s*new Date\(\)/)
  assert.match(leaderboardRoute, /new URL\(req\.url\)\.searchParams\.get\("category"\)/)
  assert.match(leaderboardRoute, /dailyRcTodayDate\(\)/)
  assert.match(leaderboardRoute, /loadDailyRcLeaderboard\(supabase/)
  assert.match(leaderboardRoute, /if \(result\.error\)/)
  assert.match(leaderboardData, /\.eq\("daily_rc_set_id", todaySet\.id\)/)
  assert.match(leaderboardData, /\.order\("score", \{ ascending: false \}\)/)
  assert.match(leaderboardData, /\.order\("time_taken", \{ ascending: true \}\)/)
  assert.match(leaderboardData, /\.maybeSingle\(\)/)
  assert.match(weeklyRoute, /loadWeeklyRcStandings\(supabase, window\)/)
  assert.match(weeklyData, /\.eq\("category", "daily_rc_challenge"\)/)
  assert.match(weeklyData, /\.eq\("is_published", true\)/)
  assert.doesNotMatch(section, /label: "CAT PYQ"/)
  assert.doesNotMatch(section, /<RCLeaderboard category="cat_pyq"\s*\/>/)
  assert.match(section, /isCAT\s*\?\s*"daily-rc-challenge"/)
  assert.match(section, /<RCLeaderboard category="daily_rc_challenge"\s*\/>/)
  assert.match(section, /activeTab === "workout" && <Leaderboard\s*\/>/)
  assert.match(section, /activeTab === "wordhunt" && <WordHuntLeaderboard\s*\/>/)
  assert.match(section, /activeTab === "champions" && <WeeklyRCChallenge\s*\/>/)
  assert.match(component, /rc-leaderboard\?category=\$\{encodeURIComponent\(category\)\}/)
  assert.match(component, /json\.top \|\| \[\]/)
  assert.match(component, /role="alert"/)
})

test("October 3 published Daily RC Challenge returns its linked score 1, time 17 attempt", async () => {
  const today = dailyRcTodayDate(new Date("2026-10-02T18:30:00Z"))
  assert.equal(today, "2026-10-03")

  const passage = { id: "billie-holiday-set", category: "daily_rc_challenge", challenge_date: "2026-10-03", is_published: true }
  const attempt = { user_id: "student-1", daily_rc_set_id: passage.id, score: 1, time_taken: 17 }
  const calls = []
  const db = {
    from(table) {
      const query = { table, filters: [], ordering: [] }
      query.select = () => query
      query.eq = (column, value) => { query.filters.push([column, value]); return query }
      query.order = (column, options) => { query.ordering.push([column, options]); return query }
      query.maybeSingle = async () => {
        calls.push({ table, filters: query.filters })
        return { data: query.filters.every(([column, value]) => passage[column] === value) ? { id: passage.id } : null, error: null }
      }
      query.in = async (_column, values) => ({ data: values.includes(attempt.user_id) ? [{ user_id: attempt.user_id, name: "Billie reader" }] : [], error: null })
      query.then = (resolve, reject) => {
        calls.push({ table, filters: query.filters, ordering: query.ordering })
        const data = table === "daily_rc_attempts" && query.filters.every(([column, value]) => attempt[column] === value) ? [attempt] : []
        return Promise.resolve({ data, error: null }).then(resolve, reject)
      }
      return query
    },
  }

  const result = await loadDailyRcLeaderboard(db, {
    category: "daily_rc_challenge",
    today,
    currentUserId: attempt.user_id,
  })

  assert.deepEqual(calls[0], {
    table: "daily_rc_sets",
    filters: [["challenge_date", "2026-10-03"], ["category", "daily_rc_challenge"], ["is_published", true]],
  })
  assert.deepEqual(calls[1].filters, [["daily_rc_set_id", "billie-holiday-set"]])
  assert.deepEqual(calls[1].ordering, [["score", { ascending: false }], ["time_taken", { ascending: true }]])
  assert.deepEqual(result.data, {
    top: [{ user_id: "student-1", daily_rc_set_id: "billie-holiday-set", score: 1, time_taken: 17, profiles: { name: "Billie reader" } }],
    yourRank: 1,
    totalParticipants: 1,
  })
})

test("leaderboard set lookup errors are returned instead of looking like an empty leaderboard", async () => {
  const db = {
    from() {
      const query = {
        select() { return this },
        eq() { return this },
        maybeSingle() { return Promise.resolve({ data: null, error: { code: "PGRST116", message: "Multiple rows returned" } }) },
      }
      return query
    },
  }
  const result = await loadDailyRcLeaderboard(db, { category: "daily_rc_challenge", today: "2026-10-03", currentUserId: "student-1" })
  assert.equal(result.stage, "set")
  assert.equal(result.error.code, "PGRST116")
  assert.equal(result.data, undefined)
})
