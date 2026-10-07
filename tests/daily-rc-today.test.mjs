import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { dailyRcTodayDate, filterTodaysDailyRc } from "../lib/dailyRc/today.mjs"
import { loadDailyStatus } from "../lib/mobile/dailyStatus.mjs"

function queryRecorder() {
  return {
    filters: [],
    eq(column, value) { this.filters.push([column, value]); return this },
  }
}

test("today uses the Asia/Kolkata calendar date around UTC midnight", () => {
  assert.equal(dailyRcTodayDate(new Date("2026-10-02T18:29:59Z")), "2026-10-02")
  assert.equal(dailyRcTodayDate(new Date("2026-10-02T18:30:00Z")), "2026-10-03")
})

test("today selection requires the scheduled date, original category, and published status", () => {
  const query = filterTodaysDailyRc(queryRecorder(), "2026-10-03")
  assert.deepEqual(query.filters, [
    ["challenge_date", "2026-10-03"],
    ["category", "daily_rc_challenge"],
    ["is_published", true],
  ])
})

function dailyStatusDb(passage) {
  return {
    from(table) {
      const query = {
        table,
        filters: [],
        select() { return this },
        eq(column, value) { this.filters.push([column, value]); return this },
        order() { return this },
        limit() { return this },
        maybeSingle() { return this },
        then(resolve) {
          let data = null
          if (table === "daily_rc_sets") {
            data = passage && this.filters.every(([key, value]) => passage[key] === value) ? passage : null
          } else if (table === "daily_rc_attempts") data = null
          else if (table === "daily_hangman") data = null
          else if (table === "workout_attempts") data = null
          return Promise.resolve({ data, error: null }).then(resolve)
        },
      }
      return query
    },
  }
}

test("homepage reports unavailable for CAT, unpublished, or future passages only", async () => {
  const now = new Date("2026-10-02T20:00:00Z")
  for (const passage of [
    { id: "cat", category: "cat_pyq", challenge_date: "2026-10-03", is_published: true, timer_minutes: 8 },
    { id: "draft", category: "daily_rc_challenge", challenge_date: "2026-10-03", is_published: false, timer_minutes: 8 },
    { id: "future", category: "daily_rc_challenge", challenge_date: "2026-10-04", is_published: true, timer_minutes: 8 },
  ]) {
    const status = await loadDailyStatus(dailyStatusDb(passage), "student", true, now)
    assert.equal(status.activities[0].available, false)
  }
})

test("a published original passage scheduled today makes the homepage challenge available", async () => {
  const passage = { id: "today", category: "daily_rc_challenge", challenge_date: "2026-10-03", is_published: true, timer_minutes: 8 }
  const status = await loadDailyStatus(dailyStatusDb(passage), "student", true, new Date("2026-10-02T20:00:00Z"))
  assert.equal(status.activities[0].available, true)
  assert.equal(status.activities[0].href, "/daily-challenge/instructions")
})

test("today API and runner share the homepage eligibility filters; weekly standings use Daily RC Challenge sessions", async () => {
  const [todayApi, runner, dailyLeaderboardRoute, dailyLeaderboard, weeklyLeaderboard] = await Promise.all([
    readFile(new URL("../app/api/get-daily-rc/route.js", import.meta.url), "utf8"),
    readFile(new URL("../app/daily-challenge/test/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-leaderboard/route.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/dailyRc/leaderboard.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-weekly-challenge/route.js", import.meta.url), "utf8"),
  ])
  assert.match(todayApi, /filterTodaysDailyRc/)
  assert.match(runner, /filterTodaysDailyRc/)
  assert.match(dailyLeaderboardRoute, /loadDailyRcLeaderboard/)
  assert.match(dailyLeaderboard, /selectDailyRcLeaderboardSet/)
  const weeklyData = await readFile(new URL("../lib/weeklyRcCompetition.js", import.meta.url), "utf8")
  assert.match(weeklyLeaderboard, /loadWeeklyRcStandings\(supabase, window\)/)
  assert.match(weeklyData, /\.eq\("category", "daily_rc_challenge"\)/)
  assert.match(weeklyData, /\.eq\("is_published", true\)/)
})
