import test from "node:test"
import assert from "node:assert/strict"
import {
  getPreviousWeeklyRcWindow,
  getWeeklyRcWindow,
  loadWeeklyRcStandings,
  rankWeeklyRcPlayers,
  shouldFinalizeWeeklyRcCompetition,
} from "./lib/weeklyRcCompetition.js"

test("ranks descending by the sum of stored composite scores", () => {
  const slower = { userId: "b", weeklyCompositeScore: 850, accuracy: 75, totalTime: 350, lastCompletedAt: "2026-08-11T10:00:00Z" }
  const faster = { userId: "a", weeklyCompositeScore: 950, accuracy: 75, totalTime: 250, lastCompletedAt: "2026-08-11T10:00:00Z" }
  assert.equal(rankWeeklyRcPlayers([slower, faster])[0].userId, "a")
})

test("weekly composite total represents multiple stored Daily RC attempts", () => {
  const oneAttempt = { userId: "a", weeklyCompositeScore: 900, accuracy: 80, totalTime: 300, lastCompletedAt: "2026-08-11T10:00:00Z" }
  const multipleAttempts = { userId: "b", weeklyCompositeScore: 620 + 480, accuracy: 75, totalTime: 600, lastCompletedAt: "2026-08-11T11:00:00Z" }
  assert.equal(multipleAttempts.weeklyCompositeScore, 1100)
  assert.equal(rankWeeklyRcPlayers([oneAttempt, multipleAttempts])[0].userId, "b")
})

test("stored time-sensitive composites distinguish equal raw CAT scores", () => {
  const slower = { userId: "a", weeklyCompositeScore: 800, accuracy: 80, totalTime: 480, lastCompletedAt: "2026-08-11T10:00:00Z" }
  const faster = { userId: "b", weeklyCompositeScore: 980, accuracy: 80, totalTime: 300, lastCompletedAt: "2026-08-11T10:00:00Z" }
  assert.equal(rankWeeklyRcPlayers([slower, faster])[0].userId, "b")
})

test("uses Monday-to-Sunday boundaries in Asia/Kolkata", () => {
  const window = getWeeklyRcWindow(new Date("2026-08-16T18:29:59.999Z"))
  assert.equal(window.start.toISOString(), "2026-08-09T18:30:00.000Z")
  assert.equal(window.end.toISOString(), "2026-08-16T18:29:59.999Z")
  assert.equal(getWeeklyRcWindow(new Date("2026-08-16T18:30:00.000Z")).start.toISOString(), "2026-08-16T18:30:00.000Z")
  assert.equal(getPreviousWeeklyRcWindow(new Date("2026-08-16T18:30:00.000Z")).weekStart, "2026-08-10")
})

test("finalized previous-week snapshots remain immutable", () => {
  const finalized = Object.freeze([
    Object.freeze({ userId: "a", weeklyCompositeScore: 900, accuracy: 80, totalTime: 300, lastCompletedAt: "2026-08-10T10:00:00Z" }),
    Object.freeze({ userId: "b", weeklyCompositeScore: 800, accuracy: 90, totalTime: 200, lastCompletedAt: "2026-08-10T09:00:00Z" }),
  ])
  const ranked = rankWeeklyRcPlayers(finalized)
  assert.notEqual(ranked, finalized)
  assert.deepEqual(finalized.map((player) => player.userId), ["a", "b"])
  assert.equal(shouldFinalizeWeeklyRcCompetition({ id: "existing-snapshot" }), false)
  assert.equal(shouldFinalizeWeeklyRcCompetition(null), true)
})

test("weekly standings include published Daily RC attempts and return the current user's ranked position", async () => {
  const window = getWeeklyRcWindow(new Date("2026-10-07T06:00:00.000Z"))
  const sets = [
    { id: "monday", category: "daily_rc_challenge", is_published: true, challenge_date: "2026-10-05" },
    { id: "tuesday", category: "daily_rc_challenge", is_published: true, challenge_date: "2026-10-06" },
    { id: "draft", category: "daily_rc_challenge", is_published: false, challenge_date: "2026-10-07" },
    { id: "old-category", category: "cat_pyq", is_published: true, challenge_date: "2026-10-06" },
    { id: "previous-week", category: "daily_rc_challenge", is_published: true, challenge_date: "2026-10-04" },
  ]
  const attempts = [
    { id: "a1", user_id: "student-a", daily_rc_set_id: "monday", score: 8, composite_score: 850, correct_count: 3, incorrect_count: 1, unanswered_count: 0, time_taken: 180, completed_at: "2026-10-05T05:00:00.000Z" },
    { id: "a2", user_id: "student-a", daily_rc_set_id: "tuesday", score: 6, composite_score: 700, correct_count: 2, incorrect_count: 0, unanswered_count: 2, time_taken: 240, completed_at: "2026-10-06T05:00:00.000Z" },
    { id: "b1", user_id: "student-b", daily_rc_set_id: "tuesday", score: 9, composite_score: 1000, correct_count: 3, incorrect_count: 0, unanswered_count: 1, time_taken: 150, completed_at: "2026-10-06T06:00:00.000Z" },
    { id: "draft-attempt", user_id: "student-c", daily_rc_set_id: "draft", score: 30, composite_score: 9999, correct_count: 10, incorrect_count: 0, unanswered_count: 0, time_taken: 1, completed_at: "2026-10-07T05:00:00.000Z" },
    { id: "cat-attempt", user_id: "student-c", daily_rc_set_id: "old-category", score: 30, composite_score: 9999, correct_count: 10, incorrect_count: 0, unanswered_count: 0, time_taken: 1, completed_at: "2026-10-07T05:00:00.000Z" },
    { id: "previous-attempt", user_id: "student-c", daily_rc_set_id: "previous-week", score: 30, composite_score: 9999, correct_count: 10, incorrect_count: 0, unanswered_count: 0, time_taken: 1, completed_at: "2026-10-04T18:29:59.999Z" },
  ]
  const profiles = [
    { user_id: "student-a", name: "Student A" },
    { user_id: "student-b", name: "Student B" },
    { user_id: "student-c", name: "Student C" },
  ]
  const queryCalls = []
  const db = {
    from(table) {
      const query = { table, filters: [], ordering: [] }
      query.select = () => query
      query.eq = (column, value) => { query.filters.push([column, "eq", value]); return query }
      query.gte = (column, value) => { query.filters.push([column, "gte", value]); return query }
      query.gt = (column, value) => { query.filters.push([column, "gt", value]); return query }
      query.lt = (column, value) => { query.filters.push([column, "lt", value]); return query }
      query.lte = (column, value) => { query.filters.push([column, "lte", value]); return query }
      query.in = (column, value) => { query.filters.push([column, "in", value]); return query }
      query.order = (column, options) => { query.ordering.push([column, options]); return query }
      query.then = (resolve, reject) => {
        queryCalls.push(query)
        let rows = table === "daily_rc_attempts" ? attempts : table === "daily_rc_sets" ? sets : profiles
        rows = rows.filter((row) => query.filters.every(([column, operator, value]) => {
          if (operator === "eq") return row[column] === value
          if (operator === "in") return value.includes(row[column])
          if (operator === "gte") return row[column] >= value
          if (operator === "gt") return row[column] > value
          if (operator === "lte") return row[column] <= value
          if (operator === "lt") return row[column] < value
          return true
        }))
        for (const [column, options] of query.ordering) {
          rows.sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0) * (options.ascending ? 1 : -1))
        }
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
      }
      return query
    },
  }

  const standings = await loadWeeklyRcStandings(db, window)
  const ranked = rankWeeklyRcPlayers(standings).map((player, index) => ({ ...player, rank: index + 1 }))
  const currentUser = ranked.find((player) => player.userId === "student-b")

  assert.deepEqual(queryCalls[0].filters, [
    ["completed_at", "gte", window.start.toISOString()],
    ["completed_at", "lt", window.nextStart.toISOString()],
  ])
  assert.ok(queryCalls[1].filters.some(([column, operator, value]) => column === "category" && operator === "eq" && value === "daily_rc_challenge"))
  assert.ok(queryCalls[1].filters.some(([column, operator, value]) => column === "is_published" && operator === "eq" && value === true))
  assert.deepEqual(ranked.map(({ userId, weeklyCompositeScore }) => [userId, weeklyCompositeScore]), [
    ["student-a", 1550],
    ["student-b", 1000],
  ])
  assert.equal(currentUser.rank, 2)
  assert.equal(currentUser.name, "Student B")
  assert.equal(currentUser.attempts, 1)
})
