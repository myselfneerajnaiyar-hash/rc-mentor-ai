import test from "node:test"
import assert from "node:assert/strict"
import { buildGrammarAnalytics, fetchAllPages } from "../lib/grammar/analytics.mjs"

test("Grammar analytics pagination includes histories beyond 10,000 attempts", async () => {
  const history = Array.from({ length: 10_025 }, (_, index) => ({ id: `attempt-${index}` }))
  const requestedRanges = []
  const result = await fetchAllPages(async (from, to) => {
    requestedRanges.push([from, to])
    return history.slice(from, to + 1)
  })

  assert.equal(result.length, history.length)
  assert.equal(result.at(-1).id, "attempt-10024")
  assert.deepEqual(requestedRanges.at(-1), [10_000, 10_499])
})

test("Grammar analytics summarizes recorded answers without inventing empty metrics", () => {
  const attempts = [
    { id: "a1", topic_id: "articles-determiners", difficulty: "easy", score: 1, total_questions: 2, completed_at: "2026-10-01T10:00:00Z" },
    { id: "a2", topic_id: "articles-determiners", difficulty: "easy", score: 2, total_questions: 2, completed_at: "2026-10-02T10:00:00Z" },
  ]
  const responses = [
    { attempt_id: "a1", question_id: "q1", is_correct: false, time_taken_seconds: 30 },
    { attempt_id: "a1", question_id: "q2", is_correct: true, time_taken_seconds: 20 },
    { attempt_id: "a2", question_id: "q1", is_correct: true, time_taken_seconds: 25 },
    { attempt_id: "a2", question_id: "q3", is_correct: true, time_taken_seconds: 15 },
    { attempt_id: "a2", question_id: "q4", is_correct: false, time_taken_seconds: 40 },
  ]
  const questionMetadata = {
    q1: { topic_id: "articles-determiners", difficulty: "easy", question_type: "Sentence Correction", primary_skill: "Article Use" },
    q2: { topic_id: "articles-determiners", difficulty: "easy", question_type: "Error Detection", primary_skill: "Article Use" },
    q3: { topic_id: "articles-determiners", difficulty: "hard", question_type: "Sentence Correction", primary_skill: "Country names" },
    q4: { topic_id: "articles-determiners", difficulty: "easy", question_type: "Sentence Correction", primary_skill: "Article Use" },
  }
  const result = buildGrammarAnalytics({ attempts, responses, questionMetadata, topicNames: { "articles-determiners": "Articles & Determiners" } })
  assert.deepEqual(result.overall, { questionsAttempted: 5, questionsCorrect: 3, accuracy: 60, testsCompleted: 2, averageScore: 1.5, averageTimeSeconds: 26, currentStreak: null })
  assert.equal(result.topics[0].topicName, "Articles & Determiners")
  assert.equal(result.topics[0].accuracy, 60)
  assert.equal(result.topics[0].trend, 17)
  assert.equal(result.difficulty.easy.accuracy, 50)
  assert.equal(result.difficulty.moderate.accuracy, null)
  assert.deepEqual(result.formats.map(({ format }) => format), ["Error Detection", "Sentence Correction"])
  assert.equal(result.weakestTopic.topicId, "articles-determiners")
  assert.equal(result.missedQuestionCount, 2)
})

test("Grammar analytics leaves topic trend and weakness empty with insufficient evidence", () => {
  const result = buildGrammarAnalytics({
    attempts: [{ id: "a1", topic_id: "prepositions", difficulty: "moderate", score: 1, completed_at: "2026-10-01T10:00:00Z" }],
    responses: [{ attempt_id: "a1", question_id: "q1", is_correct: false, time_taken_seconds: 10 }],
    questionMetadata: { q1: { topic_id: "prepositions", difficulty: "moderate", primary_skill: "Place prepositions" } },
  })
  assert.equal(result.topics[0].trend, null)
  assert.equal(result.topics[0].mastery, "Building data")
  assert.equal(result.weakestTopic, null)
  assert.equal(result.strongestTopic, null)
  assert.equal(result.overall.currentStreak, null)
})
