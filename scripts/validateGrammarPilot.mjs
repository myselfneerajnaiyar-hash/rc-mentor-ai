import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { GRAMMAR_ONTOLOGY } from "../lib/grammarOntology.js"
import { GRAMMAR_TOPIC_BLUEPRINTS, validateGrammarTopicBlueprints } from "./grammarTopicBlueprints.mjs"

const run = (script) => {
  const result = spawnSync(process.execPath, [script], { cwd: process.cwd(), encoding: "utf8" })
  process.stdout.write(result.stdout || "")
  process.stderr.write(result.stderr || "")
  assert.equal(result.status, 0, `${script} failed`)
}

run("scripts/testGrammarQualityGates.mjs")
run("scripts/validateGrammarTopicPlans.mjs")

const validation = validateGrammarTopicBlueprints(GRAMMAR_TOPIC_BLUEPRINTS)
assert.equal(validation.success, true, validation.errors.join("\n"))
assert.deepEqual(Object.keys(GRAMMAR_TOPIC_BLUEPRINTS).sort(), Object.keys(GRAMMAR_ONTOLOGY).sort(), "Blueprint and ontology topics differ")
const expectedProduction = ["active-passive-voice", "articles-determiners", "conditionals", "conjunctions", "modifiers", "nouns", "parallelism", "prepositions", "pronouns", "subject-verb-agreement", "tenses", "verbs-auxiliaries"]
assert.deepEqual(validation.productionReady.sort(), expectedProduction, "Unexpected productionReady topic set")
for (const topic of expectedProduction) {
  const hard = GRAMMAR_TOPIC_BLUEPRINTS[topic].difficulties.hard
  assert.equal(hard.length, 5, `${topic}: expected five Hard constructions`)
  assert.ok(hard.every((construction) => construction.id && construction.skill && construction.trap && construction.focus), `${topic}: incomplete Hard construction`)
}
console.log("Grammar pilot validation: PASS (offline; no OpenAI or Supabase calls)")
