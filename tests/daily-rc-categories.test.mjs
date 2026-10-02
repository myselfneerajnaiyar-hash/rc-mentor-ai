import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { DAILY_RC_CATEGORIES, filterDailyRcHistory, normalizeDailyRcCategory } from "../lib/dailyRc/categories.mjs"

const sets = [
  { id: "legacy-cat", category: null },
  { id: "new-cat", category: "cat_pyq" },
  { id: "original", category: "daily_rc_challenge" },
]

test("legacy passages without category remain CAT PYQs", () => {
  assert.equal(normalizeDailyRcCategory(null), DAILY_RC_CATEGORIES.CAT_PYQ)
  assert.deepEqual(filterDailyRcHistory(sets, "cat_pyq", "all").map(({ id }) => id), ["legacy-cat", "new-cat"])
})

test("category and attempted status filter independently", () => {
  const attempted = new Set(["legacy-cat", "original"])
  assert.deepEqual(filterDailyRcHistory(sets, "cat_pyq", "attempted", attempted).map(({ id }) => id), ["legacy-cat"])
  assert.deepEqual(filterDailyRcHistory(sets, "cat_pyq", "unattempted", attempted).map(({ id }) => id), ["new-cat"])
  assert.deepEqual(filterDailyRcHistory(sets, "daily_rc_challenge", "unattempted", attempted), [])
})

test("migration defaults and backfills existing passage rows to CAT PYQ", async () => {
  const migration = await readFile(new URL("../supabase/migrations/202610030001_daily_rc_categories.sql", import.meta.url), "utf8")
  assert.match(migration, /add column if not exists category text not null default 'cat_pyq'/i)
  assert.match(migration, /set category = 'cat_pyq'[\s\S]*where category is null or category = ''/i)
  assert.match(migration, /'daily_rc_challenge'/)
})

test("attempt records continue joining to passages by the existing set ID", async () => {
  const review = await readFile(new URL("../lib/dailyRc/review.js", import.meta.url), "utf8")
  assert.match(review, /eq\("id", attempt\.daily_rc_set_id\)/)
})

test("daily leaderboard remains attached to the CAT PYQ set", async () => {
  const [dailyRoute, leaderboardRoute, leaderboard, weekly, dailyStatus] = await Promise.all([
    readFile(new URL("../app/api/get-daily-rc/route.js", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-leaderboard/route.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/dailyRc/leaderboard.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rc-weekly-challenge/route.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/mobile/dailyStatus.mjs", import.meta.url), "utf8"),
  ])
  assert.match(dailyRoute, /filterTodaysDailyRc/)
  assert.match(leaderboard, /selectDailyRcLeaderboardSet/)
  assert.match(leaderboardRoute, /loadDailyRcLeaderboard\(supabase/)
  assert.match(leaderboard, /\.select\("user_id,score,time_taken"\)/)
  assert.match(weekly, /\.eq\("category", "cat_pyq"\)/)
  assert.match(dailyStatus, /filterTodaysDailyRc/)
})
