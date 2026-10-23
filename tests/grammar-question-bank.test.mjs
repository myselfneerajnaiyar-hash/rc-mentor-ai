import test from "node:test"
import assert from "node:assert/strict"
import { selectCompleteActiveTestQuestions, selectMixedPracticeQuestions } from "../lib/grammar/questionBank.mjs"
import { FEATURES, GRAMMAR_ENABLED } from "../lib/mobile/features.mjs"

const questionsFor = (testId, count = 5) => Array.from({ length: count }, (_, index) => ({ id: `${testId}-q${index + 1}`, test_id: testId }))
const playable = (question, parent) => question.test_id === parent.id

test("mixed bank excludes questions belonging to inactive or invalid sets", () => {
  const tests = [
    { id: "active", is_active: true, question_count: 5, test_number: 1 },
    { id: "inactive", is_active: false, question_count: 5, test_number: 2 },
    { id: "out-of-range", is_active: true, question_count: 5, test_number: 0 },
    { id: "wrong-count", is_active: true, question_count: 4, test_number: 3 },
  ]
  const questions = [...questionsFor("active"), ...questionsFor("inactive"), ...questionsFor("out-of-range"), ...questionsFor("wrong-count")]

  assert.deepEqual(selectCompleteActiveTestQuestions(tests, questions, playable).map(({ test_id }) => test_id), Array(5).fill("active"))
})

test("mixed bank excludes active sets that do not contain exactly five playable questions", () => {
  const tests = [{ id: "complete", is_active: true, question_count: 5, test_number: 1 }, { id: "partial", is_active: true, question_count: 5, test_number: 2 }]
  const questions = [...questionsFor("complete"), ...questionsFor("partial", 4)]

  assert.deepEqual(selectCompleteActiveTestQuestions(tests, questions, playable).map(({ test_id }) => test_id), Array(5).fill("complete"))
})

test("mixed practice selects multiple topics and formats when available", () => {
  const questions = [
    { id: "1", topic_id: "tenses", question_type: "Sentence Correction" },
    { id: "2", topic_id: "tenses", question_type: "Error Detection" },
    { id: "3", topic_id: "pronouns", question_type: "Sentence Correction" },
    { id: "4", topic_id: "articles", question_type: "Fill in the Blank" },
    { id: "5", topic_id: "prepositions", question_type: "Best Revision" },
    { id: "6", topic_id: "modifiers", question_type: "Contextual Usage" },
  ]
  const selected = selectMixedPracticeQuestions(questions, 5)

  assert.equal(selected.length, 5)
  assert.ok(new Set(selected.map(({ topic_id }) => topic_id)).size > 1)
  assert.ok(new Set(selected.map(({ question_type }) => question_type)).size > 1)
})

test("Grammar launches through the existing premium-gated route", () => {
  const feature = FEATURES.find(({ id }) => id === "grammar")

  assert.equal(GRAMMAR_ENABLED, true)
  assert.equal(feature?.premium, true)
  assert.equal(feature?.href, "/?view=grammar")
})
