import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import { preAuditQualityReasons } from "../scripts/grammarQualityGates.mjs"

const migration = await readFile(new URL("../supabase/migrations/202610200001_refine_grammar_geo_article_question.sql", import.meta.url), "utf8")

test("geo article correction keeps answer IDs, scoring, and approved question state stable", async () => {
  const db = new PGlite()
  await db.exec(`CREATE TABLE public.grammar_questions (
    topic_id text, question_text text, bank_status text, is_active boolean,
    options jsonb, correct_answer text, explanation text, rule_tested text, option_analysis jsonb, full_payload jsonb
  );
  INSERT INTO public.grammar_questions VALUES (
    'articles-determiners',
    'She plans to sail up the Amazon, then visit the Brazil before flying out of the country.',
    'approved', true,
    '[{"id":"a-id","label":"A","text":"the Amazon; the Brazil"},{"id":"b-id","label":"B","text":"the Amazon; Brazil"},{"id":"c-id","label":"C","text":"Amazon; the Brazil"},{"id":"d-id","label":"D","text":"Amazon; Brazil"}]'::jsonb,
    'b-id',
    'Original explanation', 'Original rule', '{}'::jsonb,
    '{"question_text":"She plans to sail up the Amazon, then visit the Brazil before flying out of the country.","options":{"A":"the Amazon; the Brazil","B":"the Amazon; Brazil","C":"Amazon; the Brazil","D":"Amazon; Brazil"},"explanation":{"core_rule":"Original rule","why_correct":"Original explanation","strongest_distractor":"A"}}'::jsonb
  );`)
  await db.exec(migration)
  const { rows: [row] } = await db.query("SELECT * FROM public.grammar_questions")
  assert.equal(row.question_text, "Choose the sentence that uses articles correctly with the river, ocean, and country names.")
  assert.deepEqual(row.options.map(({ label }) => label), ["A", "B", "C", "D"])
  assert.deepEqual(row.options.map(({ id }) => id), ["a-id", "b-id", "c-id", "d-id"])
  assert.equal(row.correct_answer, "b-id")
  assert.equal(row.options[1].text, "The Amazon flows toward the Atlantic before reaching Brazil.")
  assert.equal(row.explanation, "The Amazon and the Atlantic take the definite article, while Brazil does not.")
  assert.equal(row.bank_status, "approved")
  assert.equal(row.is_active, true)
  assert.equal(row.full_payload.explanation.strongest_distractor, "D")
  const questionForGate = {
    question_text: row.question_text,
    question_type: "Sentence Correction",
    options: Object.fromEntries(row.options.map(({ label, text }) => [label, text])),
    explanation: { why_distractor_fails: row.full_payload.explanation.why_distractor_fails },
    option_analysis: row.option_analysis,
    quality: row.full_payload.quality,
  }
  assert.deepEqual(preAuditQualityReasons(questionForGate, "articles-determiners", "moderate"), [])
  await db.exec(migration)
  const { rows: [rerunRow] } = await db.query("SELECT * FROM public.grammar_questions")
  assert.deepEqual(rerunRow, row)
  await db.close()
})

test("Grammar player and topic list expose clear, navigable mobile states", async () => {
  const source = await readFile(new URL("../components/GrammarLab.jsx", import.meta.url), "utf8")
  assert.match(source, /Clear Answer/)
  assert.match(source, /aria-label="Question navigation"/)
  assert.match(source, /overflow-x-auto pb-2/)
  assert.match(source, /Select an answer to enable Next/)
  assert.match(source, /Coming Soon/)
  assert.doesNotMatch(source, /NOT SEEDED|0\/30 tests/)
  assert.match(source, /REVIEW YOUR ANSWERS/)
  assert.match(source, /Tap any question to see the detailed explanation/)
  assert.match(source, /Grammar Analytics/)
})
