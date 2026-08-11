import test from "node:test"
import assert from "node:assert/strict"
import {
  getPreviousWeeklyRcWindow,
  getWeeklyRcWindow,
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
