import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"

const migration = await readFile(new URL("../supabase/migrations/20261021025958_refine_grammar_article_ambiguity_fixes.sql", import.meta.url), "utf8")
const diagnosticsMigration = await readFile(new URL("../supabase/migrations/20261021030417_align_grammar_corrected_diagnostics.sql", import.meta.url), "utf8")
const optionMigration = await readFile(new URL("../supabase/migrations/20261021030554_differentiate_grammar_article_options.sql", import.meta.url), "utf8")

const optionRows = (labels, key) => JSON.stringify(labels.map(([label, text]) => ({ id: `${label}-id`, label, text })))
const questions = [
  [1, "____ eagle is known for its keen eyesight, but today I saw ____ eagle perched on the library roof.", [["A", "The; an"], ["B", "An; the"], ["C", "An; an"], ["D", "The; the"]], "A-id"],
  [2, "At the conference, Dr. Patel presented ___ solution that required careful calibration, unlike ___ solutions commonly used in routine experiments.", [["A", "a the"], ["B", "the a"], ["C", "a -"], ["D", "- the"]], "A-id"],
  [3, "Choose the sentence that uses articles correctly with the river, ocean, and country names.", [["A", "Amazon flows toward the Atlantic before reaching Brazil."], ["B", "The Amazon flows toward the Atlantic before reaching Brazil."], ["C", "Amazon flows toward Atlantic before reaching the Brazil."], ["D", "The Amazon flows toward the Atlantic before reaching the Brazil."]], "B-id"],
  [4, "____ both proposals were reviewed by ____ committee before a decision was reached.", [["A", "All; the"], ["B", "Both; the"], ["C", "Both of; a"], ["D", "All of; a"]], "B-id"],
  [5, "Only ____ few participants expressed concern, so the committee believed ____ little adjustment was necessary.", [["A", "a; a"], ["B", "a; —"], ["C", "—; a"], ["D", "—; —"]], "A-id"],
]

test("targeted corrections are idempotent, preserve option IDs and keys, and keep the set complete", async () => {
  const db = new PGlite()
  await db.exec(`CREATE SCHEMA extensions;
    CREATE FUNCTION extensions.digest(text, text) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$ SELECT decode(repeat('00', 32), 'hex') $$;
    CREATE TABLE public.grammar_tests (id text primary key, topic_id text, difficulty text, test_number integer, question_count integer);
    CREATE TABLE public.grammar_questions (
      id text primary key, test_id text, question_number integer, topic_id text, difficulty text,
      bank_status text, is_active boolean, question_text text, question_type text, options jsonb,
      option_ids jsonb, correct_answer text, explanation text, rule_tested text, option_analysis jsonb,
      primary_skill text, subskill text, skill_id text, trap_type text, error_pattern text,
      why_students_fail text, ideal_thinking_process text, lesson_for_future text,
      question_version integer, updated_at timestamptz, dedup_hash text, full_payload jsonb, audit_payload jsonb
    );
    INSERT INTO public.grammar_tests VALUES ('test-1','articles-determiners','moderate',1,5);`)
  for (const [number, stem, options, key] of questions) {
    const ids = Object.fromEntries(options.map(([label]) => [label, `${label}-id`]))
    const map = Object.fromEntries(options)
    await db.query(`INSERT INTO public.grammar_questions (
      id,test_id,question_number,topic_id,difficulty,bank_status,is_active,question_text,question_type,options,option_ids,correct_answer,
      explanation,rule_tested,option_analysis,primary_skill,subskill,skill_id,trap_type,error_pattern,why_students_fail,
      ideal_thinking_process,lesson_for_future,question_version,updated_at,dedup_hash,full_payload,audit_payload
    ) VALUES ($1,'test-1',$2,'articles-determiners','moderate','approved',true,$3,'Fill in the Blank',$4::jsonb,$5::jsonb,$6,
      'Old explanation','Old rule','{}'::jsonb,'Generic Reference','Generic Reference','Generic Reference','Overgeneralized Rule','Old error','Old failure',
      'Old thinking','Old lesson',1,now(),'old-hash',$7::jsonb,'{}'::jsonb)`, [
      `q-${number}`, number, stem, optionRows(options, key), JSON.stringify(ids), key,
      JSON.stringify({ question_text: stem, question_type: "Fill in the Blank", options: map, correct_answer: key[0], explanation: { core_rule: "Old rule", why_correct: "Old explanation" }, option_analysis: {}, quality: { reasoning_steps: ["old"] }, diagnosis: { primary_skill: "Generic Reference", trap_type: "Overgeneralized Rule" } }),
    ])
  }

  await db.exec(migration)
  await db.exec(diagnosticsMigration)
  await db.exec(optionMigration)
  const { rows } = await db.query("SELECT * FROM public.grammar_questions ORDER BY question_number")
  assert.equal(rows.length, 5)
  assert.deepEqual(rows.map((row) => row.question_number), [1, 2, 3, 4, 5])
  assert.equal(rows[2].question_text, "Choose the sentence that uses articles correctly with the river, ocean, and country names.")

  const expected = new Map([
    [1, ["For a first, non-specific mention of one singular eagle, choose the correct indefinite article: “___ eagle.”", "A-id", "an"]],
    [2, ["The report has already identified one unique solution. To refer to that same item, complete the phrase with the correct article: “___ solution.”", "A-id", "the"]],
    [4, ["____ of the two proposals was approved before the committee made its decision.", "B-id", "Each"]],
    [5, ["To express some (but not many) participants and some (but not much) adjustment, use “___ few” for the countable noun and “___ little” for the uncountable noun.", "A-id", "a; a"]],
  ])
  for (const row of rows) {
    if (!expected.has(row.question_number)) continue
    const [stem, answerId, correctText] = expected.get(row.question_number)
    assert.equal(row.question_text, stem)
    assert.equal(row.correct_answer, answerId)
    assert.deepEqual(row.options.map((option) => option.id), ["A-id", "B-id", "C-id", "D-id"])
    assert.equal(row.options.find((option) => option.id === answerId)?.text, correctText)
    assert.equal(row.full_payload.options[row.options.find((option) => option.id === answerId).label], correctText)
    assert.equal(row.full_payload.correct_answer, row.options.find((option) => option.id === answerId).label)
    assert.equal(row.full_payload.explanation.why_correct, row.explanation)
    assert.equal(row.full_payload.explanation.core_rule, row.rule_tested)
    assert.equal(row.audit_payload.unique_defensible_answer, true)
    assert.equal(row.full_payload.diagnosis.primary_skill, row.primary_skill)
    assert.ok(row.full_payload.quality.reasoning_steps.length >= 3)
    if (row.question_number === 2) {
      assert.equal(row.options.find((option) => option.label === "D")?.text, "both")
      assert.match(row.option_analysis.D.why_it_is_correct_or_wrong, /singular count noun/)
    }
  }

  await db.exec(optionMigration)
  const { rows: rerun } = await db.query("SELECT * FROM public.grammar_questions ORDER BY question_number")
  assert.deepEqual(rerun, rows)
  await db.close()
})

test("topic availability copy and progress use the returned available counts", async () => {
  const [component, route] = await Promise.all([
    readFile(new URL("../components/GrammarLab.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/grammar/catalog/route.js", import.meta.url), "utf8"),
  ])
  assert.match(component, /practice sets available/)
  assert.match(component, /Coming Soon/)
  assert.doesNotMatch(component, /Thirty reusable sets|\/30 sets|\/10 ·/)
  assert.match(route, /total: availableTests/)
  assert.match(route, /total = sets\.length/)
})
