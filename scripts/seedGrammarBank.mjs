import crypto from "crypto"
import { appendFile, mkdir } from "node:fs/promises"
import dotenv from "dotenv"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"
import { GRAMMAR_DIFFICULTIES, GRAMMAR_ONTOLOGY, GRAMMAR_QUESTION_TYPES, GRAMMAR_TRAP_TYPES } from "../lib/grammarOntology.js"
import { GRAMMAR_DIFFICULTY_BLUEPRINT, GRAMMAR_QUALITY_RULES } from "../lib/grammarDifficultyBlueprint.js"
import { GRAMMAR_QUESTION_SCHEMA, validateGrammarQuestions } from "../lib/grammarQuestionSchema.js"
import { GRAMMAR_TOPIC_BLUEPRINTS, validateGrammarTopicBlueprints } from "./grammarTopicBlueprints.mjs"
import { failClosedAuditReasons, preAuditQualityReasons } from "./grammarQualityGates.mjs"

dotenv.config({ path: ".env.local" })
const generationRunNonce = crypto.randomUUID()
const TOPIC_NAMES = {
  "subject-verb-agreement": "Subject–Verb Agreement",
  pronouns: "Pronouns and Reference",
}
const SVA_PLANS = {
  easy: [
    "An Error Detection item with a true head subject separated from its verb by a natural prepositional or participial modifier; do not use the stock 'bouquet of roses' pattern. question_text MUST begin with an explicit instruction such as 'Identify the segment containing the subject–verb agreement error (or select No Error):' followed by the complete sentence. Options A-C MUST be verbatim contiguous sentence segments copied into question_text, and option D MUST be 'No Error'. The key must identify the literal erroneous segment, not give the correction.",
    "A Sentence Correction item using either/or or neither/nor where the nearer subject must first be identified inside a natural sentence. Every option must be a contextualized phrase or complete sentence of at least five words; do not return a reusable block of one-word verb forms.",
    "A Sentence Correction item with an inverted or fronted construction whose post-verbal subject is an explicit compound joined by 'and'; plural agreement must follow from the complete compound, not from a disputed notional reading of 'set', 'series', or another collective head. Every option must include the complete inverted predicate and subject, not a bare verb.",
    "A Sentence Correction or Best Revision item using a published-work title, organization/country name, or noun ending in -s whose grammatical number must be inferred from its syntactic function in a natural report or review; never use generic claims about school subjects. All options must be contextualized phrases or complete revisions of at least five words, not one-word verb forms.",
    "A Sentence Correction item using a quantity or measurement treated as a single unit in a context that makes the unit reading necessary. All options must be contextualized phrases or complete revisions of at least five words, not one-word verb forms.",
  ],
  moderate: [
    "A Sentence Correction item using a relative clause in a 'one of the plural noun who...' construction where the relative verb agrees with the plural antecedent. Use primary_skill exactly 'Relative Clause Agreement' and trap_type exactly 'Proximity Attraction'. All four options MUST be contextualized phrases or complete sentence alternatives of at least five words; never use Fill in the Blank or bare verb forms.",
    "A Sentence Correction item using a collective noun whose singular agreement is established by unified action, with a plausible plural distractor based on notional plurality; make the context decisive. Use primary_skill exactly 'Collective Noun Agreement' and trap_type exactly 'Meaning-Grammar Conflict'. All four options MUST be contextualized phrases or complete sentence alternatives of at least five words; never use Fill in the Blank or bare verb forms.",
    "A Sentence Correction item contrasting 'a number of' with 'the number of', or an equivalently meaningful quantifier contrast, requiring the student to identify the full subject phrase. Use primary_skill exactly 'Basic Number Agreement' and trap_type exactly 'Number Confusion'. All four options MUST expose both sites in contextualized phrases or complete revisions; never use Fill in the Blank or bare verb pairs.",
    "A Sentence Correction item using a paired or compound construction in which an additive phrase such as 'as well as' does not create a compound subject, embedded in realistic prose. Use primary_skill exactly 'Intervening Phrase Attraction' and trap_type exactly 'Proximity Attraction'. All four options MUST be contextualized phrases or complete sentence alternatives of at least five words; never use Fill in the Blank or bare verb forms.",
    "A Sentence Correction item using an inverted locative/existential construction with an intervening phrase and a post-verbal subject; the student must reconstruct normal order. Use primary_skill exactly 'Inverted Structures' and trap_type exactly 'Proximity Attraction'. All four options MUST be contextualized phrases or complete sentence alternatives of at least five words; never use Fill in the Blank or bare verb forms.",
  ],
  hard: [
    "A Best Revision or Sentence Correction item that literally contains both 'one of the X who have...' and, separately, 'the only one of the X who has...'. Both relative-clause controllers must be tested; 'only one of' alone does not satisfy the first construction. Use primary_skill exactly 'Relative Clause Agreement' and trap_type exactly 'Rule Collision'. Do not use blanks or bare have/has pairs. Every option must be a complete parallel revision of the full sentence containing both constructions.",
    "A Sentence Correction item combining 'the number of + plural noun' as a singular main controller with an embedded who/that clause controlled by the plural noun, plus an intervening or additive phrase. The tested verbs must have distinct controllers and rules; multiple verbs agreeing with the same noun do not qualify. Use primary_skill exactly 'Relative Clause Agreement' and trap_type exactly 'Proximity Attraction'. Every option must be a complete contextualized correction of at least five words.",
    "A Sentence Correction or Best Revision item using a correlative construction plus an independently demanding embedded agreement mechanism. In standard edited English, the main verb agrees with the nearer subject in either/or and neither/nor; the embedded site must use a different controller and also require structural reasoning through a number-quantifier, additive/intervening phrase, collective interpretation, or one-of relative construction. A transparent phrase such as 'statement that explains' does not qualify. Use primary_skill exactly 'Either-Or and Neither-Nor' and trap_type exactly 'Rule Collision'. Do not use blanks or bare form sequences. Every option must be a complete parallel revision of the full sentence.",
    "A Sentence Correction or Best Revision item whose sentence MUST literally contain both (1) a numeric money/time/distance quantity treated as one unit with a singular verb and (2) a separate clause beginning with the exact words 'a number of' plus a plural count noun and plural verb. Both sites must be tested. An obviously plural bare noun such as 'funds are' does not qualify. Do not use either/neither. Use primary_skill exactly 'Titles and Amounts' and trap_type exactly 'Meaning-Grammar Conflict'. Do not use blanks or bare form pairs. Every option must be a complete parallel revision of the full sentence.",
    "A sophisticated but natural Best Revision item combining (1) a singular published title or proper name ending in -s that controls its own singular main verb and (2) a separate relative clause containing the literal construction 'one of the [plural noun] who' whose verb is controlled by that plural antecedent. Both agreement sites must be tested in every complete option. Repeating singular agreement for the same title across several verbs does not qualify. Use primary_skill exactly 'Titles and Amounts' and trap_type exactly 'Surface Agreement'. Do not use blanks. Options must remain complete parallel revisions and vary only the tested agreement forms.",
  ],
}
const PRONOUN_PLANS = {
  easy: [
    "A Sentence Correction item testing clear pronoun-antecedent agreement in a natural context. The antecedent must be an explicit count noun with fixed grammatical number and uniquely identifiable; do not use a collective noun, organization, or other antecedent whose singular/plural interpretation can vary. Avoid disputed gender assumptions and do not make singular-they acceptability the tested distinction. Use primary_skill exactly 'Pronoun-Antecedent Agreement'. Every option must be a complete contextualized revision of at least five words.",
    "A Sentence Correction item testing an unambiguous subject-versus-object case choice required by the pronoun's syntactic role. Avoid informal-versus-formal usage disputes and elliptical comparison constructions. Use primary_skill exactly 'Pronoun Case'.",
    "A Sentence Correction item contrasting a reflexive pronoun with a personal pronoun where co-reference with the clause subject makes the reflexive requirement decisive. Use primary_skill exactly 'Reflexive Pronouns'.",
    "A Contextual Usage or Sentence Correction item testing this/that versus these/those with an explicit, unambiguous referent and meaningful discourse context. Use primary_skill exactly 'Demonstrative Pronouns'.",
    "A Sentence Correction item testing an indefinite pronoun in a context with one defensible pronoun form and no arbitrary gender assumption. Use primary_skill exactly 'Indefinite Pronouns'.",
  ],
  moderate: [
    "A Sentence Correction item testing pronoun case inside a coordinated phrase. The correct case must remain clear when the other coordinate is removed; avoid 'between you and I' as the sentence's only stock trick. Use primary_skill exactly 'Pronoun Case'.",
    "A Best Revision item repairing a genuinely ambiguous pronoun reference by naming or structurally identifying the intended antecedent. Every option must be a complete revision, and exactly one must resolve the ambiguity without changing meaning. Use primary_skill exactly 'Reference Clarity'.",
    "A Sentence Correction or Fill in the Blank item testing who/whom/whose by the relative pronoun's role inside its own clause, with a realistic proximity distractor. Use primary_skill exactly 'Relative Pronouns'.",
    "A Sentence Correction item contrasting reflexive and personal pronouns across an embedded clause whose local subject determines whether reflexive binding is possible. Use primary_skill exactly 'Reflexive Pronouns'.",
    "A Best Revision item repairing an unjustified shift in person or number while preserving the sentence's intended viewpoint. Use primary_skill exactly 'Pronoun Consistency'.",
  ],
  hard: [
    "A Best Revision item combining (1) pronoun case inside a coordination governed unambiguously by a transitive verb or ordinary preposition and (2) a separate embedded-clause personal or relative pronoun whose case is controlled by a different syntactic role. Both sites must be tested in complete parallel revisions. Do not use the stock phrases 'between you and I', 'between you and me', or elliptical comparisons; do not use whoever/whomever unless the pronoun's role inside its own clause is unmistakable. Use primary_skill exactly 'Pronoun Case' and secondary_skill 'Pronoun Consistency' or null.",
    "A Best Revision item combining relative-pronoun selection with reference clarity: the relative pronoun's clause role and its uniquely intended antecedent must both be resolved. Options must not alter the intended facts. Use primary_skill exactly 'Relative Pronouns' and secondary_skill 'Reference Clarity'.",
    "A Sentence Correction or Best Revision item with two distinct pronoun mechanisms: (1) an antecedent-agreement decision controlled by a fixed-number individual count noun or an explicit plural count noun and (2) a separately controlled reflexive-versus-personal-pronoun decision in another clause. Never use a collective noun, organization, team, committee, staff, board, jury, company, government, audience, family, class, faculty, or crew as the antecedent. Use primary_skill exactly 'Pronoun-Antecedent Agreement' and secondary_skill 'Reflexive Pronouns'.",
    "A Best Revision item requiring resolution of cross-clause reference plus repair of a separate person/number consistency shift. The intended referents must be recoverable without world-knowledge guesses. Use primary_skill exactly 'Reference Clarity' and secondary_skill 'Pronoun Consistency'.",
    "A Best Revision item combining an anticipatory or dummy-pronoun construction with a separate demonstrative or referential-pronoun decision. Both functions must be independently tested and the prose must remain natural. Use primary_skill exactly 'Dummy Pronouns' and secondary_skill 'Demonstrative Pronouns'.",
  ],
}
const GRAMMAR_TOPIC_PLANS = {
  "subject-verb-agreement": {
    name: TOPIC_NAMES["subject-verb-agreement"],
    plans: SVA_PLANS,
    families: {
      easy: ["intervening-prepositional", "neither-nor", "compound-subject", "plural-looking-title", "quantity-unit"],
      moderate: ["one-of-relative", "collective-noun", "number-quantifier", "additive-phrase", "inverted-structure"],
      hard: ["relative-clause-contrast", "multi-clause-agreement", "correlative-embedded", "quantity-unit", "plural-looking-title"],
    },
    auditSiteName: "agreement site",
  },
  pronouns: {
    name: TOPIC_NAMES.pronouns,
    plans: PRONOUN_PLANS,
    families: {
      easy: ["antecedent-agreement", "pronoun-case", "reflexive-binding", "demonstrative-reference", "indefinite-pronoun"],
      moderate: ["coordinated-case", "reference-repair", "relative-pronoun-role", "embedded-reflexive", "pronoun-consistency"],
      hard: ["case-embedded", "relative-reference", "agreement-reflexive", "reference-consistency", "dummy-demonstrative"],
    },
    auditSiteName: "pronoun decision site",
  },
}
const BLUEPRINT_PRODUCTION_TOPICS = ["parts-of-speech", "nouns", "tenses", "verbs-auxiliaries", "articles-determiners", "prepositions", "modifiers", "parallelism", "active-passive-voice", "conjunctions", "conditionals"]
for (const topicId of BLUEPRINT_PRODUCTION_TOPICS) {
  const blueprint = GRAMMAR_TOPIC_BLUEPRINTS[topicId]
  GRAMMAR_TOPIC_PLANS[topicId] = {
    name: blueprint.name,
    plans: Object.fromEntries(Object.entries(blueprint.difficulties).map(([difficulty, constructions]) => [difficulty, constructions.map((construction) => `Construction '${construction.id}': ${construction.focus}. Use primary_skill exactly '${construction.skill}' and trap_type exactly '${construction.trap}'. Validate these topic-controlled sites: ${blueprint.controlledSites.join("; ")}. Reject: ${blueprint.forbidden.join("; ")}. Distractors: ${blueprint.distractors} Use only these suitable question types: ${blueprint.questionTypes.join(", ")}. ${difficulty === "hard" ? "Hard requires at least two materially interacting topic mechanisms or controlled sites; added length or repeated instances of one rule do not qualify." : ""}`)])),
    families: Object.fromEntries(Object.entries(blueprint.difficulties).map(([difficulty, constructions]) => [difficulty, constructions.map((construction) => construction.id)])),
    auditSiteName: "controlled grammar site",
    questionTypes: blueprint.questionTypes,
    blueprint,
  }
}
const argv = process.argv.slice(2)
const planValidation = validateGrammarTopicBlueprints()
if (!planValidation.success) throw new Error(`Grammar topic-plan registry is invalid: ${planValidation.errors.join("; ")}`)
const args = new Map(argv.flatMap((value, index) => value.startsWith("--") ? [[value.slice(2), !argv[index + 1] || argv[index + 1].startsWith("--") ? true : argv[index + 1]]] : []))
const topics = args.get("topic") === "all" ? Object.keys(GRAMMAR_TOPIC_PLANS) : [String(args.get("topic") || "subject-verb-agreement")]
const difficulties = args.get("difficulty") === "all" ? [...GRAMMAR_DIFFICULTIES] : [String(args.get("difficulty") || "easy")]
const target = Math.max(1, Math.min(500, Number.parseInt(args.get("count"), 10) || 5))
const batchSize = Math.max(1, Math.min(10, Number.parseInt(args.get("batch-size"), 10) || 5))
const candidateWindows = Math.max(1, Math.min(6, Number.parseInt(args.get("candidate-windows"), 10) || 1))
const GRAMMAR_SESSION_COUNT = 5
const preview = args.get("preview") === true
const efficientSet = args.get("efficient-set") === true
const setNumber = Math.max(1, Number.parseInt(args.get("set-number"), 10) || 1)
const benchmarkStartedAt = new Date()
const benchmarkStartedPerformance = performance.now()
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required in .env.local")
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server credentials are required in .env.local")
const unknownTopic = topics.find((id) => !GRAMMAR_ONTOLOGY[id])
if (unknownTopic) throw new Error(`Invalid --topic '${unknownTopic}'. Use an ID from the Grammar ontology.`)
const unplannedTopic = topics.find((id) => !GRAMMAR_TOPIC_BLUEPRINTS[id])
if (unplannedTopic) throw new Error(`Topic '${unplannedTopic}' exists in the ontology but has no content blueprint.`)
const unapprovedTopic = topics.find((id) => !GRAMMAR_TOPIC_BLUEPRINTS[id].productionReady || !GRAMMAR_TOPIC_PLANS[id])
if (unapprovedTopic) throw new Error(`Topic '${unapprovedTopic}' has a validated draft blueprint but no approved production content plan.`)
if (difficulties.some((value) => !GRAMMAR_DIFFICULTIES.includes(value))) throw new Error("Invalid --difficulty. Use easy, moderate, hard, or all")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 1 })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const usageTotals = { generation: 0, "set-audit": 0, replacement: 0, "replacement-audit": 0, input: 0, output: 0, total: 0, cachedInput: 0, reasoning: 0 }
const benchmarkTimings = { generation: 0, localValidation: 0, audit: 0, persistence: 0 }
const benchmarkQuality = { initialGenerated: 0, locallyRejected: 0, setAuditRejected: 0, replacementsGenerated: 0, auditorInconsistencies: 0 }
async function recordOpenAIUsage(context, response, success = true) {
  const usage = response?.usage || {}
  const cachedInput = usage.prompt_tokens_details?.cached_tokens ?? usage.input_tokens_details?.cached_tokens ?? null
  const reasoning = usage.completion_tokens_details?.reasoning_tokens ?? usage.output_tokens_details?.reasoning_tokens ?? null
  const entry = { timestamp: new Date().toISOString(), topic: context.topic, difficulty: context.difficulty, set_number: context.setNumber, question_slots: context.slots, call_type: context.callType, model: response?.model ?? null, input_tokens: usage.prompt_tokens ?? usage.input_tokens ?? null, output_tokens: usage.completion_tokens ?? usage.output_tokens ?? null, total_tokens: usage.total_tokens ?? null, cached_input_tokens: cachedInput, reasoning_tokens: reasoning, usage, success }
  usageTotals[context.callType] += 1
  usageTotals.input += Number(entry.input_tokens || 0); usageTotals.output += Number(entry.output_tokens || 0); usageTotals.total += Number(entry.total_tokens || 0)
  usageTotals.cachedInput += Number(cachedInput || 0); usageTotals.reasoning += Number(reasoning || 0)
  await mkdir("logs", { recursive: true }); await appendFile("logs/grammar-openai-usage.jsonl", `${JSON.stringify(entry)}\n`)
}
async function trackedCompletion(payload, context = null) {
  const startedAt = performance.now()
  try {
    const response = await openai.chat.completions.create(payload)
    const elapsed = performance.now() - startedAt
    if (context?.callType === "generation" || context?.callType === "replacement") benchmarkTimings.generation += elapsed
    else if (context) benchmarkTimings.audit += elapsed
    if (context) await recordOpenAIUsage(context, response, true)
    return response
  } catch (error) {
    if (context) await recordOpenAIUsage(context, null, false)
    throw error
  }
}
const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
const dedupHash = (topic, difficulty, text) => crypto.createHash("sha256").update(`${topic}|${difficulty}|${normalize(text)}`).digest("hex")
const similarity = (left, right) => { const a = new Set(normalize(left).split(" ").filter(Boolean)); const b = new Set(normalize(right).split(" ").filter(Boolean)); const union = new Set([...a, ...b]).size; return union ? [...a].filter((token) => b.has(token)).length / union : 0 }
const blankCount = (value) => (String(value || "").match(/_{2,}/g) || []).length
const optionSignature = (question) => ["A", "B", "C", "D"].map((key) => normalize(question.options?.[key])).sort().join("|")
const storedOptionSignature = (question) => Array.isArray(question.options)
  ? question.options.map((option) => normalize(option.text)).sort().join("|")
  : optionSignature(question)
const CONSTRUCTION_FAMILIES = [
  ["only-one-relative", /\bonly one\b.*\bwho\b/i],
  ["one-of-relative", /\bone of\b.*\bwho\b/i],
  ["neither-nor", /\bneither\b.*\bnor\b/i],
  ["either-or", /\beither\b.*\bor\b/i],
  ["additive-phrase", /\b(along with|together with|as well as|accompanied by|in addition to|including)\b/i],
  ["number-quantifier", /\b(a number of|the number of)\b/i],
  ["quantity-unit", /(?:[$£€]\s*\d|\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred|thousand|million)(?:[ -]\w+){0,2}\s+(?:dollars?|hours?|minutes?|miles?|kilomet(?:er|re)s?|percent))\b/i],
  ["plural-looking-title", /\b(united nations|economics|physics|statistics|news|ethics|measles|brothers karamazov|chronicles of narnia)\b/i],
  ["collective-noun", /\b(committee|jury|board|panel|team|staff|council|cabinet|faculty|audience|crew)\b/i],
  ["inverted-structure", /^\s*(?:in|on|at|among|beyond|inside|outside|near|here|there)\b/i],
  ["compound-subject", /\b\w+\s+and\s+(?:a |an |the )?\w+\b/i],
  ["intervening-prepositional", /\b(?:list|collection|series|set|group|range|bouquet|cluster) of\b/i],
  ["multi-clause-agreement", /\b(which|who|that|although|while)\b/i],
]
const constructionFamily = (question) => CONSTRUCTION_FAMILIES.find(([, pattern]) => pattern.test(question.question_text))?.[0] || question.diagnosis?.primary_skill || "other"
const plannedConstructionFamily = (topic, difficulty, planIndex, question) => GRAMMAR_TOPIC_PLANS[topic]?.families?.[difficulty]?.[planIndex % GRAMMAR_TOPIC_PLANS[topic].families[difficulty].length] || constructionFamily(question)
const contextAnchor = (question) => ["researcher", "committee", "director", "student", "brothers karamazov", "united nations"].find((anchor) => normalize(question.question_text).includes(anchor)) || null
function hardAgreementMechanisms(question) {
  const stem = String(question.question_text || "").toLowerCase()
  const withoutOnlyOne = stem.replace(/\bonly one of\b/g, "")
  const mechanisms = new Set()
  if (/\bone of\b[\s\S]*\bwho\b/.test(withoutOnlyOne)) mechanisms.add("one-of-relative")
  if (/\bonly one of\b[\s\S]*\bwho\b/.test(stem)) mechanisms.add("only-one-relative")
  if (/\b(?:either\b[\s\S]*\bor|neither\b[\s\S]*\bnor)\b/.test(stem)) mechanisms.add("correlative-proximity")
  if (/\b(?:a number of|the number of)\b/.test(stem)) mechanisms.add("number-quantifier")
  if (/\b(?:along with|together with|as well as|accompanied by|in addition to|including)\b/.test(stem)) mechanisms.add("additive-controller")
  if (/(?:[$£€]\s*\d|\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twenty|hundred|thousand|million)(?:[ -]\w+){0,2}\s+(?:dollars?|hours?|minutes?|miles?|percent))\b/.test(stem)) mechanisms.add("quantity-unit")
  if (/\b(?:united states|united nations|economics|physics|statistics|news|ethics|measles|brothers karamazov|chronicles of narnia)\b/.test(stem)) mechanisms.add("plural-looking-singular")
  if (/\b(?:committee|jury|board|panel|team|staff|council|cabinet|faculty|audience|crew)\b/.test(stem)) mechanisms.add("collective-interpretation")
  if (/^\s*(?:in|on|at|among|beyond|inside|outside|near|here|there)\b/.test(stem)) mechanisms.add("inverted-controller")
  if (/\b(?:which|who|that)\b/.test(stem)) mechanisms.add("embedded-relative")
  return mechanisms
}

function hasQuestionTypeIntegrity(question) {
  const stem = String(question.question_text || "")
  const options = Object.values(question.options || {}).map(String)
  if (question.question_type === "Error Detection") {
    const asksForError = /\b(error|erroneous|incorrect segment|contains an error|no error)\b/i.test(stem)
    const hasNoError = options.some((option) => /^\s*(?:no error|no correction|none)\.?\s*$/i.test(option))
    const segmentCount = options.filter((option) => normalize(option).length > 0 && normalize(stem).includes(normalize(option))).length
    const wholeSentenceChoices = options.filter((option) => option.trim().split(/\s+/).length >= Math.max(8, Math.floor(stem.trim().split(/\s+/).length * 0.65))).length
    return asksForError && (hasNoError || segmentCount >= 3) && segmentCount >= 1 && wholeSentenceChoices < 2
  }
  if (question.question_type === "Sentence Correction") return options.every((option) => option.trim().length > 0)
  if (question.question_type === "Fill in the Blank") return blankCount(stem) >= 1 && options.every((option) => option.trim().length > 0 && !/_{2,}/.test(option))
  if (question.question_type === "Best Revision") return blankCount(stem) === 0 && options.every((option) => option.trim().split(/\s+/).length >= 6)
  return true
}
function contentGateReasons(question, topic, difficulty, planIndex) {
  const reasons = []
  if (!hasQuestionTypeIntegrity(question)) reasons.push("question-type-integrity")
  if (question.question_type === "Fill in the Blank" && blankCount(question.question_text) === 0) reasons.push("fill-blank-marker-missing")
  if (/mathematics is an important subject|fascinating subject|interesting topic to study/i.test(question.question_text)) reasons.push("artificial-textbook-context")
  const embeddedOptionLabels = (String(question.question_text || "").match(/(?:^|\n)\s*[A-D][).:]\s+/g) || []).length
  if (embeddedOptionLabels >= 2) reasons.push("duplicated-option-block-in-stem")
  const structuralEvidence = /\b(of|either|neither|who|which|that|there|along with|as well as|together with|number of|amount|sum|distance|title|series|committee|team|jury|board)\b/i.test(question.question_text)
  if (question.diagnosis?.primary_skill === "Basic Number Agreement" && !structuralEvidence) reasons.push("bare-number-agreement-without-structure")
  if (question.diagnosis?.primary_skill === "Collective Noun Agreement") {
    const evidence = `${question.question_text} ${question.explanation?.core_rule} ${question.explanation?.why_correct}`
    if (!/\b(as (?:a single|one) (?:unit|body|entity)|unanimously|one verdict|one decision|jointly|collectively|acting as (?:a unit|one))\b/i.test(evidence)) reasons.push("collective-interpretation-not-explicit")
    if (/\b(British|American) English\b/i.test(evidence) && !/\b(as (?:a single|one) (?:unit|body|entity)|unanimously|one verdict|one decision|jointly|collectively|acting as (?:a unit|one))\b/i.test(question.question_text)) reasons.push("collective-agreement-dialect-dependent")
  }
  if (topic === "subject-verb-agreement" && difficulty === "easy" && planIndex % SVA_PLANS.easy.length === 2 && (!/\band\b/i.test(question.question_text) || /\b(set|series|collection) of\b/i.test(question.question_text))) reasons.push("easy-compound-subject-plan-missing")
  if (topic === "subject-verb-agreement" && difficulty === "easy" && [1, 3, 4].includes(planIndex % SVA_PLANS.easy.length) && !Object.values(question.options || {}).every((option) => String(option).trim().split(/\s+/).length >= 5)) reasons.push("easy-contextualized-options-missing")
  if (topic === "subject-verb-agreement" && difficulty === "moderate" && question.question_type !== "Error Detection" && !Object.values(question.options || {}).every((option) => String(option).trim().split(/\s+/).length >= 5)) reasons.push("moderate-contextualized-options-missing")
  if (topic === "pronouns") {
    const plan = planIndex % PRONOUN_PLANS[difficulty].length
    const stemAndOptions = `${question.question_text} ${Object.values(question.options || {}).join(" ")}`
    const expectedSkill = [
      ["Pronoun-Antecedent Agreement", "Pronoun Case", "Reflexive Pronouns", "Demonstrative Pronouns", "Indefinite Pronouns"],
      ["Pronoun Case", "Reference Clarity", "Relative Pronouns", "Reflexive Pronouns", "Pronoun Consistency"],
      ["Pronoun Case", "Relative Pronouns", "Pronoun-Antecedent Agreement", "Reference Clarity", "Dummy Pronouns"],
    ][difficulty === "easy" ? 0 : difficulty === "moderate" ? 1 : 2][plan]
    if (!Object.values(question.options || {}).every((option) => String(option).trim().split(/\s+/).length >= 5)) reasons.push("pronoun-contextualized-options-missing")
    if (question.diagnosis?.primary_skill !== expectedSkill) reasons.push(`pronoun-plan-skill-mismatch: expected ${expectedSkill}`)
    if (!/\b(he|him|his|she|her|hers|they|them|their|theirs|it|its|we|us|our|ours|I|me|my|mine|who|whom|whose|which|that|myself|yourself|himself|herself|itself|ourselves|themselves|this|these|those|each other|one another)\b/i.test(stemAndOptions)) reasons.push("controlled-pronoun-site-missing")
    if (/\b(?:a person|someone|somebody)\b/i.test(question.question_text) && /\b(?:he or she|his or her|he\/she|s\/he)\b/i.test(stemAndOptions)) reasons.push("arbitrary-gender-binary-construction")
    if (question.diagnosis?.primary_skill === "Pronoun-Antecedent Agreement" && /\b(team|committee|staff|board|jury|company|organization|government|audience|family|class|faculty|crew)\b/i.test(question.question_text)) reasons.push("pronoun-collective-antecedent-ambiguity")
    if (/\bbetween you and I\b/i.test(question.question_text) && difficulty !== "easy") reasons.push("stock-pronoun-case-item")
    if (difficulty === "moderate" && [1, 4].includes(plan) && !Object.values(question.options || {}).every((option) => String(option).trim().split(/\s+/).length >= 6)) reasons.push("pronoun-full-revisions-missing")
    if (difficulty === "hard") {
      if ((question.quality?.reasoning_steps || []).length < 3) reasons.push("hard-multi-step-reasoning")
      if (!Object.values(question.options || {}).every((option) => String(option).trim().split(/\s+/).length >= 8)) reasons.push("hard-pronoun-full-revisions-missing")
      const expectedSecondary = ["Pronoun Consistency", "Reference Clarity", "Reflexive Pronouns", "Pronoun Consistency", "Demonstrative Pronouns"][plan]
      if (question.diagnosis?.secondary_skill !== expectedSecondary) reasons.push(`hard-pronoun-secondary-skill-mismatch: expected ${expectedSecondary}`)
    }
    return [...new Set(reasons)]
  }
  const blueprint = GRAMMAR_TOPIC_PLANS[topic]?.blueprint
  if (blueprint) {
    const construction = blueprint.difficulties[difficulty][planIndex % blueprint.difficulties[difficulty].length]
    const evidence = `${question.question_text} ${Object.values(question.options || {}).join(" ")} ${question.explanation?.core_rule || ""} ${question.explanation?.why_correct || ""}`
    if (question.diagnosis?.primary_skill !== construction.skill) reasons.push(`blueprint-skill-mismatch: expected ${construction.skill}`)
    if (question.diagnosis?.trap_type !== construction.trap) reasons.push(`blueprint-trap-mismatch: expected ${construction.trap}`)
    if (!blueprint.questionTypes.includes(question.question_type)) reasons.push("blueprint-question-type-mismatch")
    if (difficulty === "hard" && (question.quality?.reasoning_steps || []).length < 3) reasons.push("hard-multi-step-reasoning")
    if (topic === "nouns" && /\badvice\b/i.test(evidence) && /\b(?:advice|such as ['\"]advice['\"])[^.!?]{0,80}\bboth countable and uncountable\b/i.test(evidence)) reasons.push("noun-countability-rule-inaccurate")
    if (topic === "tenses" && !/\b(yesterday|today|now|currently|already|yet|since|for|before|after|by the time|when|while|then|last|next|ago|until|recently|previously|at the time|earlier|later|every|usually|currently)\b/i.test(evidence)) reasons.push("tense-temporal-evidence-missing")
    if (topic === "modifiers" && !/\b(modif|attach|refer|scope|place|position|describe|limit|only|almost|even|who|which|that|particip)/i.test(evidence)) reasons.push("modifier-controlled-relation-missing")
    if (topic === "active-passive-voice" && !/\b(active|passive|agent|patient|participle|auxiliary|transitive|by\b|been|being)\b/i.test(evidence)) reasons.push("voice-controlled-structure-missing")
    if (difficulty === "hard" && question.question_type === "Best Revision" && !Object.values(question.options || {}).every((option) => String(option).trim().split(/\s+/).length >= 8)) reasons.push("hard-full-revisions-missing")
    return [...new Set(reasons)]
  }
  if (difficulty !== "hard" || topic !== "subject-verb-agreement") return reasons
  if ((question.quality?.reasoning_steps || []).length < 3) reasons.push("hard-multi-step-reasoning")
  const stem = String(question.question_text || "").toLowerCase()
  const options = Object.values(question.options || {}).map(String)
  const mechanisms = hardAgreementMechanisms(question)
  if (mechanisms.size < 2) reasons.push("hard-distinct-mechanisms-missing")
  if (!options.every((option) => option.trim().split(/\s+/).length >= 4)) reasons.push("hard-contextualized-options-missing")
  if (/\b\w+\s+of\s+(?:[\w-]+\s+){0,3}[\w-]+s\s*,\s*(?:which|who|that)\b/i.test(question.question_text)) reasons.push("ambiguous-relative-antecedent")
  const plan = planIndex % SVA_PLANS.hard.length
  if (plan === 0) {
    if (!mechanisms.has("one-of-relative") || !mechanisms.has("only-one-relative")) reasons.push("relative-controller-contrast-missing")
    if (blankCount(stem) > 0 || !options.every((option) => option.trim().split(/\s+/).length >= 10)) reasons.push("relative-controller-full-revisions-missing")
  }
  if (plan === 1) {
    if (!/\b(which|who|that)\b/.test(stem)) reasons.push("required-embedded-agreement-site-missing")
    if (!/\bthe number of\b/.test(stem)) reasons.push("singular-number-controller-missing")
    if (!mechanisms.has("additive-controller") && !/\b(?:of|with|among|from|in)\b/.test(stem)) reasons.push("required-intervening-structure-missing")
    if (!options.every((option) => option.split(/\s+/).length >= 5)) reasons.push("multi-clause-answer-not-explicit")
  }
  if (plan === 2) {
    if (!/\b(either|neither)\b/.test(stem)) reasons.push("required-correlative-construction-missing")
    if (!/\b(which|who|that|although|while)\b/.test(stem)) reasons.push("required-embedded-modifier-missing")
    if (!["number-quantifier", "additive-controller", "collective-interpretation", "one-of-relative", "only-one-relative"].some((mechanism) => mechanisms.has(mechanism))) reasons.push("independent-embedded-mechanism-missing")
    if (blankCount(stem) > 0 || !options.every((option) => option.trim().split(/\s+/).length >= 10)) reasons.push("correlative-full-revisions-missing")
  }
  if (plan === 3) {
    const correct = String(question.options?.[question.correct_answer] || "").toLowerCase()
    if (!mechanisms.has("quantity-unit") || !/\ba number of\b/.test(stem)) reasons.push("quantity-independent-mechanism-missing")
    if (blankCount(stem) > 0 || !options.every((option) => option.trim().split(/\s+/).length >= 10)) reasons.push("quantity-full-revisions-missing")
    if (!/\b(is|has|was)\b/.test(correct) || !/\b(are|have|were)\b/.test(correct)) reasons.push("quantity-controller-contrast-missing")
  }
  if (plan === 4) {
    const wordCounts = options.map((option) => option.trim().split(/\s+/).length)
    if (!/\b(which|who|that)\b/.test(stem)) reasons.push("required-embedded-agreement-site-missing")
    if (!options.every((option) => option.split(/\s+/).length >= 7)) reasons.push("best-revision-options-not-complete")
    if (new Set(wordCounts).size !== 1) reasons.push("best-revision-options-not-parallel")
    if (!mechanisms.has("plural-looking-singular") || !["one-of-relative", "number-quantifier", "correlative-proximity", "additive-controller"].some((mechanism) => mechanisms.has(mechanism))) reasons.push("title-independent-mechanism-missing")
  }
  return [...new Set(reasons)]
}

async function generate(topic, difficulty, count, planOffset = 0, priorApproved = [], variationNonce = "", usageContext = null, repairConstraints = null) {
  const blueprint = GRAMMAR_DIFFICULTY_BLUEPRINT[difficulty]
  const topicPlan = GRAMMAR_TOPIC_PLANS[topic]
  const subjectVerbCoverage = topic === "subject-verb-agreement" ? `Use a balanced selection appropriate to this batch from: intervening/prepositional phrases; either/or and neither/nor; indefinite pronouns; collective nouns whose agreement is resolved by intended meaning; nouns ending in -s; titles; quantities treated as units versus countable items; paired constructions; relative clauses where the antecedent controls agreement; inverted constructions; compound subjects; proximity traps; and tense-agreement interactions. Prefer exam-style error identification, best revision, and sentence correction. Do not repeat the same governing construction within this batch unless the reasoning demand is genuinely different.` : ""
  const assignedPlans = Array.from({ length: count }, (_, index) => `Question ${index + 1}: ${topicPlan.plans[difficulty][(planOffset + index) % topicPlan.plans[difficulty].length]}${topic === "pronouns" ? " REQUIRED OPTION FORMAT: A-D must each be a complete contextualized revision of at least five words; never return bare pronoun forms." : ""}`).join("\n")
  const pronounCoverage = topic === "pronouns" ? `PRONOUN-SPECIFIC STANDARD:
- Every A-D option must be a contextualized phrase or complete sentence of at least five words. Never return a reusable block of bare pronouns or one-word forms; preserve the same tested pronoun contrast inside distinct natural wording.
- Every tested pronoun must have a syntactically identifiable role or a uniquely recoverable antecedent.
- When pronoun number is tested, use an antecedent with fixed grammatical number. Reject collective nouns, organizations, or other notional antecedents if 'its' versus 'their' can vary by dialect, style, or intended group interpretation.
- Do not use arbitrary gender assumptions or make singular-they controversy the basis of an answer.
- Do not present disputed informal-versus-formal case preferences as absolute grammar.
- Reference-repair options must preserve intended meaning while exactly one resolves ambiguity.
- Reflexive choice must follow local clause structure and genuine co-reference, not emphasis alone.
- For Hard, test at least two distinct pronoun mechanisms with independently controlled sites; repeated forms governed by one rule do not qualify.` : ""
  const partsOfSpeechOptionStandard = topic === "parts-of-speech" ? `PARTS-OF-SPEECH OPTION-BLOCK STANDARD:
- Do not use four bare or reusable category labels such as noun/verb/adjective/adverb as the complete A-D options.
- Make every option a contextualized analysis, sentence pairing, or complete classification tied to the specific target word and syntactic site, so the normalized four-option block is genuinely unique.
- Do not put two or more lines beginning A., B., C., or D. in question_text; the option block belongs only in options.
- When replacing a rejected item, change the target lexical item, scenario, and syntactic evidence rather than recycling the rejected sentence frame.` : ""
  const priorOptionBlocks = [...new Set([
    ...priorApproved.map((item) => optionSignature(item.question)),
    ...(repairConstraints?.existingOptionBlocks || []),
  ])]
  const priorContextAnchors = priorApproved.map((item) => contextAnchor(item.question)).filter(Boolean)
  const response = await trackedCompletion({ model: "gpt-4.1", response_format: { type: "json_object" }, temperature: 0.75, messages: [
    { role: "system", content: "You are Auctor's senior competitive-exam grammar assessment designer. Build natural, intellectually honest items that reward structural reasoning. Never inflate difficulty through length, obscure vocabulary, or artificial prose. Return JSON only." },
    { role: "user", content: `Generate exactly ${count} questions.

TOPIC ID: ${topic}
TOPIC: ${topicPlan.name}
DIFFICULTY: ${difficulty}
VARIATION NONCE: ${variationNonce}. Use this only to choose fresh wording, context, names, and option phrasing; it never changes the assigned grammar rule, key standard, or quality threshold.
ALLOWED SKILLS: ${JSON.stringify(GRAMMAR_ONTOLOGY[topic].skills)}
ALLOWED TRAPS: ${JSON.stringify(GRAMMAR_TRAP_TYPES)}
ALLOWED QUESTION TYPES: ${JSON.stringify(topicPlan.questionTypes || GRAMMAR_QUESTION_TYPES)}

METADATA CONTRACT:
- diagnosis.primary_skill must be copied exactly from ALLOWED SKILLS; never invent, paraphrase, combine, or hyphenate a label.
- diagnosis.secondary_skill must be null or copied exactly from ALLOWED SKILLS.
- diagnosis.trap_type must be copied exactly from ALLOWED TRAPS; never invent or paraphrase a label.

DIFFICULTY BLUEPRINT:
${JSON.stringify(blueprint)}

UNIVERSAL QUALITY RULES:
${JSON.stringify(GRAMMAR_QUALITY_RULES.universal)}
${difficulty === "hard" ? `HARD REJECTION RULES:\n${JSON.stringify(GRAMMAR_QUALITY_RULES.hardQuestionRejectionRules)}` : ""}

CONTENT STANDARD:
- Every item must test one clearly identifiable governing concept and require analysis of the whole relevant construction.
- Easy still requires grammatical reasoning. Reject bare subject + verb items and answers exposed by obvious adjacent singular/plural matching.
- Moderate must contain at least two initially plausible options and a named, realistic exam misconception.
- Hard should resemble CAT/XAT/GMAT verbal grammar traps where appropriate: competing agreement cues, rule collision, syntactic embedding, or meaning-dependent agreement. It must not be a longer Easy item.
- Use natural editorial, academic, professional, or everyday contexts. Reject generic textbook filler such as 'Mathematics is an important subject' unless context is indispensable to the tested distinction.
- Sentence length must earn its place; do not manufacture complexity with padding.
- Exactly one answer must remain defensible under standard edited English. Every completed option must produce a structurally complete sentence; explicitly reread each filled sentence to reject errors such as 'has publish' or 'have publishes'. Avoid dialect-dependent collective-noun questions unless the required convention is stated or meaning resolves agreement.
- For collective nouns, the sentence itself must make unified or individual action unmistakable. Never make disputed British/American convention the sole reason an option is correct. Keep verbs, relative clauses, and pronouns consistent with the explicitly established interpretation.
- Distinguish true compound/correlative subjects joined by and/or/nor from additive modifiers introduced by 'along with', 'together with', 'as well as', 'accompanied by', 'in addition to', 'including', and similar phrases. Additive phrases never replace the grammatical head as controller, regardless of semantic plurality.
- For either/or and neither/nor with mixed-number subjects, standard edited English agreement follows the nearer subject. An embedded relative or subordinate clause is solved independently and never changes the main verb's controller. Do not invent a policy, context, emphasis, or notional-agreement exception to force a preferred verb.
- Never invent plurality for a grammatically singular lexical controller merely to create a contrast between answer sites. Singular abstract and mass nouns such as urgency, evidence, information, funding, and advice remain singular unless the sentence contains a genuinely plural grammatical head. Determine each controller first, then choose its verb; do not reverse-engineer controllers from the required option pattern.
- Every distractor must encode a specific plausible misconception. No nonsense fillers.
- In sentence-correction items, options may change only the agreement-controlled verb forms needed by the task. Do not introduce synonyms or stylistic rewrites that create a second correct answer.
- QUESTION-TYPE CONTRACT: Error Detection must ask for the erroneous segment or No Error and offer sentence segments/No Error, never whole-sentence revisions. Sentence Correction may offer corrected phrases or sentences. Fill in the Blank must visibly contain one or more blanks and options must supply the missing forms. Best Revision must offer complete revised sentences. Reject internally if format and declaration differ.
- For Error Detection, every segment option must be copied verbatim as one contiguous substring of question_text, and the keyed option must be the literal segment containing the error. Include No Error only as an option, never as the key when the sentence contains an error. Do not use abstract labels such as '(1)' without the corresponding sentence text.
- explanation.why_correct must apply the rule to the actual sentence. It must not merely restate the answer.
- explanation.why_distractor_is_tempting and why_distractor_fails must analyze the strongest distractor precisely.
- primary_skill, core_rule, trap_type, misconception, and option analysis must all diagnose the same construction actually tested.
- secondary_skill must be null unless it exactly matches one of the allowed skills.
- Do not repeat question text, embed an option block in the stem and then repeat it in options, or reuse the same four-option block for another question.
- These normalized option blocks have already been accepted in this run and must not be reused: ${JSON.stringify(priorOptionBlocks)}
- If the natural short verb forms would recreate one of those blocks, change the question format or use contextualized phrase/full-sentence alternatives. Never resubmit the same four forms in a different order or with cosmetically different punctuation.
${repairConstraints ? `- REPLACEMENT REQUIREMENT: The rejected slot failed because: ${repairConstraints.reason}. The rejected question text was: ${JSON.stringify(repairConstraints.rejectedQuestionText)}. Avoid these colliding stored question texts: ${JSON.stringify(repairConstraints.avoidedQuestionTexts || [])}. Produce a genuinely different normalized four-option block from every listed block. Do not merely change the stem, reorder the options, or alter punctuation. Use a different tested lexical item, scenario, sentence frame, and contextual mechanism within the assigned construction.` : ""}
- These convenient context anchors have already been used and must not appear again in this difficulty batch: ${JSON.stringify(priorContextAnchors)}
- Deliberately rotate realistic domains across policy, technology, finance, publishing, education, business, public administration, culture, and science. Do not default to researchers, scientists, committees, directors, or students. If a prior context anchor is listed above, choose a different domain and role before drafting.
- Reject an item whose only reasoning is visible singular noun -> singular verb or plural noun -> plural verb. A valid item must require identifying a non-obvious controller, resolving a construction, applying notional meaning, or checking an embedded dependency.
- Do not manufacture Hard difficulty by adding more verbs, blanks, modifiers, or clauses. Hard means interacting agreement rules/controllers that require tracking structure across the sentence. A Hard item must contain at least two genuinely distinct agreement mechanisms with distinct structural work; multiple verbs controlled by the same subject do not count. If removing either tested mechanism leaves a straightforward Moderate question, reject the draft before returning it.
${difficulty === "hard" && topic === "subject-verb-agreement" ? `- HARD DETERMINISTIC CONTRACT: provide at least three non-empty quality.reasoning_steps; satisfy the assigned construction literally; and make every required correction explicit in the answer options.
- Relative-controller contrast: literally include both 'one of the X who have' and 'the only one of the X who has' as separate tested constructions. The substring 'one of' inside 'only one of' does not satisfy the first requirement. Use no blanks: all four options must be complete parallel revisions containing both constructions.
- Multi-clause agreement: combine singular 'the number of + plural noun' with an embedded who/that verb controlled by that plural noun and an intervening/additive structure. Make every option a contextualized phrase or full revision of at least five words. Do not let both tested verbs share one controller.
- Correlative-embedded: include either/neither plus an independently difficult embedded which/who/that/although/while mechanism using a number-quantifier, additive/intervening controller, collective interpretation, or one-of relative construction. The main verb must follow the nearer correlative subject. A transparent bare-noun relative such as 'statement that explains' is insufficient. Use no blanks; all options must be complete parallel revisions.
- Quantity-controller contrast: contrast a singular unit/amount with 'a number of + plural noun' or an equivalently non-obvious plural construction. A bare plural such as 'funds are' is insufficient. Use no blanks; all options must be complete parallel revisions exposing both sites.
- Plural-looking-title revision: combine the singular title/name with a separately controlled one-of-relative, number-quantifier, correlative, or additive mechanism. Do not repeat the title's singular rule across all sites. All options must be complete parallel revisions of at least seven words and change only agreement forms.
- Relative-clause antecedents must be uniquely recoverable. Never place which/who/that after a 'head noun of plural noun' phrase where either noun could plausibly be its antecedent. Rewrite the sentence to name the antecedent directly.
- Hard items may contain 3-5 independent agreement sites. Each site must have one unambiguous controller, remain natural, and be explicitly represented in the answer format. Check every embedded clause separately. The item must require multi-step reasoning and a meaningful trap; surface morphology alone must never solve it.` : ""}
${subjectVerbCoverage}
${pronounCoverage}
${partsOfSpeechOptionStandard}
${assignedPlans ? `MANDATORY PER-QUESTION CONSTRUCTION PLAN:\n${assignedPlans}\nEach numbered output question must follow its corresponding plan. Do not substitute a simpler stock pattern.` : ""}

Use this complete structure: ${JSON.stringify(GRAMMAR_QUESTION_SCHEMA)}
Use exactly four unique A-D options; option statuses exactly 'correct'/'incorrect'; quality_score integer 8-10; explicit ambiguity_check; and non-empty string reasoning_steps. Return {"questions":[...]} only.` },
  ] }, usageContext)
  const parsed = JSON.parse(response.choices[0].message.content || "{}")
  if (!Array.isArray(parsed.questions) || parsed.questions.length < count) throw new Error(`Expected ${count} questions but received ${parsed.questions?.length || 0}`)
  return parsed.questions.slice(0, count).map((question) => {
    if (question?.diagnosis && !GRAMMAR_ONTOLOGY[topic].skills.includes(question.diagnosis.secondary_skill)) question.diagnosis.secondary_skill = null
    return question
  })
}

async function audit(questions, topic, difficulty, planOffset = 0) {
  const topicPlan = GRAMMAR_TOPIC_PLANS[topic]
  return Promise.all(questions.map(async (question, questionIndex) => {
    const response = await openai.chat.completions.create({ model: "gpt-4.1", response_format: { type: "json_object" }, temperature: 0, messages: [
      { role: "system", content: "You are an independent, adversarial senior grammar editor. Solve the item yourself before looking at its supplied key. Reject rather than repair any item with a wrong key, secondary error, artificial construction, shallow difficulty, ambiguity, or diagnosis drift. For Hard items, the JSON audit must include mechanism_1, mechanism_2, mechanism_independence_explanation, and hard_mechanism_categories. Return JSON only." },
      { role: "user", content: `Independently solve and audit this ${difficulty} ${topicPlan.name} item.

REQUIRED CONSTRUCTION FOR THIS ITEM:
${topicPlan.plans[difficulty][(planOffset + questionIndex) % topicPlan.plans[difficulty].length]}
Reject if the item substitutes a simpler construction, omits any required contrast/dependency, or merely gestures at this assignment.
${topic === "pronouns" ? "For Pronouns, reject unresolved or merely context-guessed antecedents, arbitrary gender assumptions, disputed informal/formal case preferences, and collective antecedents whose pronoun number varies by dialect, style, or notional interpretation." : ""}

MANDATORY METHOD:
1. Complete or reconstruct every option exactly as a student would read it.
2. Identify every controlled grammatical decision required by the assigned construction. A controlled site may be an agreement relation, pronoun antecedent, case role, reference relation, reflexive-binding relation, word form, temporal relation, attachment, or another topic-specific decision.
3. For each site, state its literal location, the controlling syntactic/semantic evidence, the expected form or interpretation, and the governing rule. Never infer the answer from the supplied explanation.
4. Check every completed option for secondary errors; do not stop after finding the intended distinction.
5. Evaluate A-D independently before reading correct_answer. For every option return grammatical status, semantic/meaning-preservation status, defensibility, and an objective reason. A stylistic preference is not a defect. Derive the uniquely correct option only after this four-option defense pass.
6. Copy the literal option named by correct_answer directly from ITEM.options and compare every independently derived controlled site against that literal text. Reject when the explanation claims the option contains a form or relationship that is not literally supported by the option.
6a. Return one keyed_option_site_check entry per controlled site. For correction/fill/revision formats, verify that the literal keyed option supplies or preserves the required form. For Error Detection, verify that the literal keyed option is the actual erroneous segment (or literal No Error only when the sentence is fully correct). Do not infer or repair missing content.
7. Compare the derived answer with the supplied key, explanation, skill, rule, trap, and every option-analysis entry.
8. For Hard items, name mechanism_1 and mechanism_2, assign distinct structural hard_mechanism_categories, and explain why neither follows automatically from the other. Multiple sites governed by one repeated rule do not establish Hard difficulty. For Tenses, two event-before-past-reference decisions are one mechanism. For Voice, identifying the patient is not independent of recognizing an ordinary passive auxiliary chain. For Nouns Hard, require contextual sense, quantifier compatibility, and a third independent noun mechanism.
9. Treat the stem and options as the only evidence for correctness. The supplied explanation cannot establish missing context, intended scope, speaker viewpoint, noun sense, or attachment.
10. For Modifiers, accept grammatical parentheticals and fronted adverbials when they preserve meaning; reject the item if they create a second defensible answer. For Tenses, reject hidden speaker-viewpoint assumptions. For Nouns, verify every count/mass reading against its literal determiner or quantifier and reject contradictory readings.

Reject if any condition holds:
- the governing grammar concept is unclear or differs from the stated skill/core rule/diagnosis;
- more than one option is defensible, or correctness depends on an unstated dialect/style convention;
- the answer is available through an obvious surface-form match without applying the topic's governing rule;
- the sentence is generic textbook filler, contrived, padded, or semantically unnatural;
- the strongest distractor does not represent a realistic misconception;
- the explanation fails to show both why the answer works and why the tempting distractor fails in this sentence;
- the assigned difficulty is inflated; Easy lacks reasoning, Moderate lacks a credible exam trap, or Hard is not genuinely advanced and does not require at least two material reasoning steps;
- complexity comes mainly from sentence length rather than grammatical dependencies.
- the only meaningful distinction is a visible form match without a controlled syntactic, semantic, referential, or discourse decision.
- the stem repeats its rendered option block, two options are duplicates, or the option block duplicates another item in the batch.
- declared question_type does not match its stem and option structure.

For Hard, aggressively reject mechanical surface checks and any item a capable student can answer without tracing the topic-specific controlled sites. Hard must require at least two meaningful mechanisms or an equivalently deep interaction defined by the assigned topic plan.

Return {"audit":{"question_index":${questionIndex},"pass":true,"unique_defensible_answer":true,"defensible_option_ids":["A"],"option_evaluations":[{"option_id":"A","grammatical_status":"correct/incorrect","semantic_status":"preserved/defective","defensible":true,"reason":"objective independent reason"}],"ambiguity_status":"none","ambiguity_reason":null,"context_sufficiency":"sufficient","style_dependency":"none","semantic_consistency":"consistent","hard_reasoning_steps":["mechanism 1","mechanism 2"],"hard_mechanisms_independent":true,"derived_correct_answer":"A","supplied_key_matches":true,"supplied_correct_option_text":"literal text copied from ITEM.options[ITEM.correct_answer]","derived_correct_option_text":"literal text copied from the independently selected option","keyed_option_site_check":[{"site_id":"site-1","required_form_or_interpretation":"...","literal_keyed_evidence":"exact text from the keyed option or erroneous segment","keyed_option_supports_derived_answer":true,"analysis":"Explain the literal comparison."}],"construction_plan_satisfied":true,"question_type_integrity":true,"actual_difficulty":"${difficulty}","quality_score":9,"fatal_flaws":[],"controlled_sites":[{"id":"site-1","location":"literal location in stem/option","decision":"the grammatical choice being controlled","controller":"precise evidence","expected_form_or_interpretation":"...","rule":"...","literal_keyed_evidence":"exact supporting text"}],"reconstructed_correct_sentence":"...","controlled_site_analysis":"...","completed_option_analysis":"...","construction_plan_analysis":"...","concept_alignment":"...","naturalness_analysis":"...","ambiguity_analysis":"...","distractor_analysis":"...","explanation_analysis":"...","option_analysis_consistency":"...","verdict":"..."}}. Include exactly four option_evaluations. Pass requires exactly one defensible option; no ambiguity, insufficient context, style dependency, or semantic contradiction; exact literal option copies; complete controlled-site verification; key/explanation/analysis consistency; correct construction and question type; actual_difficulty ${difficulty}; quality_score >= 9; and, for Hard, at least two independent mechanisms.

For Hard items, the audit object MUST additionally include mechanism_1, mechanism_2, mechanism_independence_explanation, and hard_mechanism_categories (an array of structural category IDs). For non-Hard items these fields may be empty.

ITEM: ${JSON.stringify(question)}` },
    ] })
    const auditResult = JSON.parse(response.choices[0].message.content || "{}").audit
    if (!auditResult || auditResult.question_index !== questionIndex) throw new Error(`Auditor returned an incomplete result for question ${questionIndex + 1}`)
    const literalKeyedOption = String(question.options?.[question.correct_answer] || "")
    if (failClosedAuditReasons(auditResult, difficulty).length || auditResult.derived_correct_answer !== question.correct_answer || auditResult.supplied_key_matches !== true || auditResult.supplied_correct_option_text !== literalKeyedOption || auditResult.derived_correct_option_text !== String(question.options?.[auditResult.derived_correct_answer] || "") || !Array.isArray(auditResult.keyed_option_site_check) || auditResult.keyed_option_site_check.length === 0 || auditResult.keyed_option_site_check.some((site) => !site?.site_id || !site?.required_form_or_interpretation || !site?.literal_keyed_evidence || site?.keyed_option_supports_derived_answer !== true) || auditResult.construction_plan_satisfied !== true || auditResult.question_type_integrity !== true || !Array.isArray(auditResult.controlled_sites) || auditResult.controlled_sites.length === 0 || auditResult.controlled_sites.some((site) => !site?.id || !site?.location || !site?.decision || !site?.controller || !site?.expected_form_or_interpretation || !site?.rule || !site?.literal_keyed_evidence) || !auditResult.reconstructed_correct_sentence || !auditResult.option_analysis_consistency) auditResult.pass = false
    return auditResult
  }))
}

const isTransientConnectionError = (error) => error?.status >= 500 || ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN", "ENETUNREACH"].includes(error?.code) || /fetch failed|connection|socket|timeout|network/i.test(String(error?.message || ""))
async function withOneConnectionRetry(operation, onRetry) {
  try {
    return await operation()
  } catch (error) {
    if (!isTransientConnectionError(error)) throw error
    onRetry()
    return operation()
  }
}

async function compactSetAudit(questions, topic, difficulty, slots, callType) {
  const items = questions.map((question, index) => ({ question_number: slots[index] + 1, construction: GRAMMAR_TOPIC_PLANS[topic].families[difficulty][slots[index]], skill: question.diagnosis.primary_skill, trap: question.diagnosis.trap_type, question_type: question.question_type, question: question.question_text, options: question.options, supplied_answer: question.correct_answer, explanation: question.explanation, controlled_metadata: question.quality?.reasoning_steps || [] }))
  const usageContext = { topic, difficulty, setNumber, slots: slots.map((slot) => slot + 1), callType }
  const response = await trackedCompletion({ model: "gpt-4.1", response_format: { type: "json_object" }, temperature: 0, messages: [
    { role: "system", content: "You are a conservative grammar-bank reviewer. Assess only; never rewrite. Solve each literal item independently, evaluate all four options, and reject ambiguity, style-only distinctions, context assumptions, wrong keys, explanation conflicts, blueprint drift, or inflated difficulty. Return JSON only." },
    { role: "user", content: `Audit these ${topic} ${difficulty} production questions. Relevant rules: exactly one defensible option; literal keyed option must match the independently solved answer and every controlled site; explanation must match the literal option; question type and construction must match; Hard requires at least two independent mechanisms, not one rule repeated. Return {"set_pass":boolean,"questions":[{"question_number":1,"pass":boolean,"defensible_option_ids":["A"],"unique_defensible_answer":boolean,"ambiguity_status":"none|fatal","difficulty":"${difficulty}","literal_key_valid":boolean,"controlled_sites_valid":boolean,"explanation_consistent":boolean,"hard_mechanisms_independent":boolean,"reason":"...","repair_required":boolean}]}. ITEMS: ${JSON.stringify(items)}` },
  ] }, usageContext)
  const result = JSON.parse(response.choices[0].message.content || "{}")
  if (!Array.isArray(result.questions) || result.questions.length !== questions.length) throw new Error("Compact auditor returned an incomplete set result")
  result.questions.forEach((audit, index) => {
    const expected = questions[index].correct_answer
    audit.pass = audit.pass === true && audit.unique_defensible_answer === true && Array.isArray(audit.defensible_option_ids) && audit.defensible_option_ids.length === 1 && audit.defensible_option_ids[0] === expected && audit.ambiguity_status === "none" && audit.difficulty === difficulty && audit.literal_key_valid === true && audit.controlled_sites_valid === true && audit.explanation_consistent === true && (difficulty !== "hard" || audit.hard_mechanisms_independent === true)
  })
  result.set_pass = result.questions.every((audit) => audit.pass)
  return result
}

function efficientLocalReasons(question, topic, difficulty, slot, pool, retained) {
  const startedAt = performance.now()
  const validation = validateGrammarQuestions([question], { topicId: topic, difficulty, skills: GRAMMAR_ONTOLOGY[topic].skills, trapTypes: GRAMMAR_TRAP_TYPES, questionTypes: GRAMMAR_TOPIC_PLANS[topic].questionTypes || GRAMMAR_QUESTION_TYPES, archetypeIds: [], count: 1 })
  const reasons = validation.success ? [] : validation.errors.slice(0, 5)
  reasons.push(...contentGateReasons(question, topic, difficulty, slot), ...preAuditQualityReasons(question, topic, difficulty))
  const hash = dedupHash(topic, difficulty, question.question_text), options = optionSignature(question)
  if (pool.some((item) => item.dedup_hash === hash || similarity(item.question_text, question.question_text) >= 0.82) || retained.some((item) => similarity(item.question.question_text, question.question_text) >= 0.62)) reasons.push("duplicate or near-duplicate question")
  if (pool.some((item) => storedOptionSignature(item) === options) || retained.some((item) => optionSignature(item.question) === options)) reasons.push("duplicate option block")
  benchmarkTimings.localValidation += performance.now() - startedAt
  return [...new Set(reasons)]
}

async function seedEfficientSet(topic, difficulty) {
  if (target !== 5 || topics.length !== 1 || difficulties.length !== 1) throw new Error("--efficient-set requires one topic, one difficulty, and --count 5")
  const { data: pool, error } = await supabase.from("grammar_questions").select("question_text,dedup_hash,options").eq("topic_id", topic).eq("difficulty", difficulty).limit(10000)
  if (error) throw error
  const retained = Array(5).fill(null)
  const localRepairAttempts = Array(5).fill(0), auditRepairAttempts = Array(5).fill(0)
  const generated = await withOneConnectionRetry(
    () => generate(topic, difficulty, 5, 0, [], `${generationRunNonce}-set`, { topic, difficulty, setNumber, slots: [1, 2, 3, 4, 5], callType: "generation" }),
    () => {},
  )
  benchmarkQuality.initialGenerated += generated.length
  for (let slot = 0; slot < 5; slot += 1) retained[slot] = { question: generated[slot], planIndex: slot }

  async function repairSlot(slot, reason, phase = "local") {
    const attempts = phase === "local" ? localRepairAttempts : auditRepairAttempts
    while (attempts[slot] < 2) {
      attempts[slot] += 1
      const attempt = attempts[slot]
      const prior = retained.filter(Boolean).filter((_, index) => index !== slot)
      const existingOptionBlocks = retained.filter(Boolean).map((item) => optionSignature(item.question))
      const rejectedQuestionText = retained[slot]?.question?.question_text
      const avoidedQuestionTexts = (pool || [])
        .filter((item) => similarity(item.question_text, rejectedQuestionText) >= 0.6)
        .slice(0, 10)
        .map((item) => item.question_text)
      const [question] = await withOneConnectionRetry(
        () => generate(topic, difficulty, 1, slot, prior, `${generationRunNonce}-${phase}-${slot}-${attempt}`, { topic, difficulty, setNumber, slots: [slot + 1], callType: "replacement" }, { reason, existingOptionBlocks, rejectedQuestionText, avoidedQuestionTexts }),
        () => {},
      )
      benchmarkQuality.replacementsGenerated += 1
      const local = efficientLocalReasons(question, topic, difficulty, slot, pool || [], prior)
      if (!local.length) { retained[slot] = { question, planIndex: slot }; return true }
      console.warn(`Slot ${slot + 1} local replacement ${attempt}/2 rejected: ${local.join("; ")}`)
    }
    console.warn(`Slot ${slot + 1} abandoned after ${phase} repairs: ${reason}`); return false
  }

  for (let slot = 0; slot < 5; slot += 1) {
    const prior = retained.filter(Boolean).filter((_, index) => index !== slot)
    const local = efficientLocalReasons(retained[slot].question, topic, difficulty, slot, pool || [], prior)
    if (local.length) benchmarkQuality.locallyRejected += 1
    if (local.length && !await repairSlot(slot, local.join("; "))) return { inserted: 0, incomplete: true }
  }

  if (new Set(retained.map((item) => optionSignature(item.question))).size !== retained.length) return { inserted: 0, incomplete: true }

  let audit = await withOneConnectionRetry(
    () => compactSetAudit(retained.map((item) => item.question), topic, difficulty, [0, 1, 2, 3, 4], "set-audit"),
    () => {},
  )
  benchmarkQuality.setAuditRejected += audit.questions.filter((item) => !item.pass).length
  for (let round = 1; round <= 2 && !audit.set_pass; round += 1) {
    const failedSlots = audit.questions.map((item, index) => item.pass ? null : index).filter((index) => index !== null)
    for (const slot of failedSlots) if (!await repairSlot(slot, audit.questions[slot].reason, "audit")) return { inserted: 0, incomplete: true }
    const replacementAudit = await withOneConnectionRetry(
      () => compactSetAudit(failedSlots.map((slot) => retained[slot].question), topic, difficulty, failedSlots, "replacement-audit"),
      () => {},
    )
    replacementAudit.questions.forEach((item, index) => { audit.questions[failedSlots[index]] = item })
    audit.set_pass = audit.questions.every((item) => item.pass)
  }
  if (!audit.set_pass) return { inserted: 0, incomplete: true }

  const persistenceStartedAt = performance.now()
  const { data: test, error: testError } = await supabase.from("grammar_tests").insert({ topic_id: topic, topic_name: GRAMMAR_TOPIC_PLANS[topic].name, difficulty, test_number: setNumber, question_count: 5, is_active: true, taxonomy_version: 1, generation_model: "gpt-4.1", prompt_version: "grammar-slot-fill-v1", source: "generated" }).select("id").single()
  if (testError) throw testError
  try {
    const rows = retained.map(({ question }, index) => { const options = Object.entries(question.options).map(([label, text]) => ({ id: crypto.randomUUID(), label, text: String(text) })); const optionIds = Object.fromEntries(options.map((option) => [option.label, option.id])); return { test_id: test.id, question_number: index + 1, question_type: question.question_type, question_text: question.question_text, options, option_ids: optionIds, correct_answer: optionIds[question.correct_answer], explanation: question.explanation.why_correct, subskill: question.diagnosis.primary_skill, primary_skill: question.diagnosis.primary_skill, secondary_skill: question.diagnosis.secondary_skill, trap_type: question.diagnosis.trap_type, error_pattern: question.diagnosis.misconception, rule_tested: question.explanation.core_rule, why_students_fail: question.diagnosis.why_students_fail, ideal_thinking_process: question.diagnosis.ideal_thinking_process, lesson_for_future: question.diagnosis.future_lesson, option_analysis: question.option_analysis, difficulty_breakdown: question.quality, quality_score: question.quality.quality_score, quality_status: "approved", full_payload: question, question_version: 1, taxonomy_version: 1, generation_model: "gpt-4.1", prompt_version: "grammar-slot-fill-v1", source: "generated", review_status: "ai_audited", archetype_id: question.archetype_id || null, topic_id: topic, difficulty, skill_id: question.diagnosis.primary_skill, is_active: true, bank_status: "approved", audit_payload: audit.questions[index], dedup_hash: dedupHash(topic, difficulty, question.question_text) } })
    const { error: insertError } = await supabase.from("grammar_questions").insert(rows); if (insertError) throw insertError
  } catch (insertError) { await supabase.from("grammar_tests").delete().eq("id", test.id); throw insertError }
  benchmarkTimings.persistence += performance.now() - persistenceStartedAt
  return { generated: benchmarkQuality.initialGenerated + benchmarkQuality.replacementsGenerated, inserted: 5, rejected: benchmarkQuality.locallyRejected + benchmarkQuality.setAuditRejected, duplicates: 0, auditInconsistencies: benchmarkQuality.auditorInconsistencies }
}

async function seedCombination(topic, difficulty) {
  const { data: existing, error } = await supabase.from("grammar_questions").select("question_text,dedup_hash,options").eq("topic_id", topic).eq("difficulty", difficulty).limit(10000)
  if (error) throw error
  const pool = [...(existing || [])], approved = []
  const maxCandidates = target * 2 * candidateWindows
  let generated = 0, rejected = 0, duplicates = 0, auditInconsistencies = 0, llmAudits = 0, retries = 0
  for (let candidateNumber = 1; candidateNumber <= maxCandidates && approved.length < target; candidateNumber += 1) {
    const label = `[${difficulty[0].toUpperCase()}${difficulty.slice(1)}] candidate ${candidateNumber}/${maxCandidates}`
    let candidateQuestion = null
    try {
      const planIndex = approved.length
      const [question] = await withOneConnectionRetry(() => generate(topic, difficulty, 1, planIndex, approved, `${generationRunNonce}-${candidateNumber}`), () => { retries += 1 })
      candidateQuestion = question
      generated += 1
      const validation = validateGrammarQuestions([question], { topicId: topic, difficulty, skills: GRAMMAR_ONTOLOGY[topic].skills, trapTypes: GRAMMAR_TRAP_TYPES, questionTypes: GRAMMAR_TOPIC_PLANS[topic].questionTypes || GRAMMAR_QUESTION_TYPES, archetypeIds: [], count: 1 })
      const localReasons = validation.success ? [] : validation.errors.slice(0, 5)
      const hash = dedupHash(topic, difficulty, question.question_text)
      const optionBlock = optionSignature(question)
      if (pool.some((item) => item.dedup_hash === hash || similarity(item.question_text, question.question_text) >= 0.82)) { localReasons.push("duplicate or near-duplicate question"); duplicates += 1 }
      if (pool.some((item) => storedOptionSignature(item) === optionBlock)) localReasons.push("duplicate option block in stored bank")
      if (approved.some((item) => optionSignature(item.question) === optionBlock)) localReasons.push("duplicate option block")
      const family = plannedConstructionFamily(topic, difficulty, planIndex, question)
      const anchor = contextAnchor(question)
      const quotaWindow = approved.slice(Math.floor(planIndex / 10) * 10)
      localReasons.push(...contentGateReasons(question, topic, difficulty, planIndex))
      localReasons.push(...preAuditQualityReasons(question, topic, difficulty))
      if (quotaWindow.filter((item) => plannedConstructionFamily(topic, difficulty, item.planIndex, item.question) === family).length >= 2) localReasons.push(`construction quota exceeded: ${family}`)
      if (approved.some((item) => similarity(item.question.question_text, question.question_text) >= 0.62)) localReasons.push("within-batch near duplicate")
      if (anchor && approved.some((item) => contextAnchor(item.question) === anchor)) localReasons.push(`repeated context anchor: ${anchor}`)
      if (localReasons.length) throw new Error(localReasons.join("; "))

      llmAudits += 1
      const [auditResult] = await withOneConnectionRetry(() => audit([question], topic, difficulty, planIndex), () => { retries += 1 })
      const auditReasons = []
      if (!auditResult?.pass) auditReasons.push("auditor rejected")
      auditReasons.push(...failClosedAuditReasons(auditResult, difficulty, topic))
      if (auditResult?.supplied_correct_option_text !== String(question.options?.[question.correct_answer] || "")) auditReasons.push("auditor literal keyed-option copy mismatch")
      if (auditResult?.derived_correct_option_text !== String(question.options?.[auditResult?.derived_correct_answer] || "")) auditReasons.push("auditor literal derived-option copy mismatch")
      if (!Array.isArray(auditResult?.keyed_option_site_check) || auditResult.keyed_option_site_check.some((site) => site?.keyed_option_supports_derived_answer !== true)) auditReasons.push("literal keyed-option site verification failed")
      if (auditResult?.actual_difficulty !== difficulty) auditReasons.push(`auditor difficulty ${auditResult?.actual_difficulty || "missing"}`)
      if (Number(auditResult?.quality_score) < 9) auditReasons.push(`auditor score ${auditResult?.quality_score ?? "missing"}`)
      if (GRAMMAR_TOPIC_PLANS[topic]?.blueprint && difficulty === "hard") {
        const controlledSites = Array.isArray(auditResult?.controlled_sites) ? auditResult.controlled_sites : []
        if (controlledSites.length < 2) auditReasons.push("hard-independent-controlled-sites-missing")
      }
      if (auditResult?.fatal_flaws?.length) auditReasons.push(...auditResult.fatal_flaws)
      if (auditResult && (auditResult.supplied_key_matches !== true || auditResult.derived_correct_answer !== question.correct_answer || auditResult.supplied_correct_option_text !== String(question.options?.[question.correct_answer] || "") || auditResult.derived_correct_option_text !== String(question.options?.[auditResult.derived_correct_answer] || "") || !Array.isArray(auditResult.keyed_option_site_check) || auditResult.keyed_option_site_check.some((site) => site?.keyed_option_supports_derived_answer !== true) || !auditResult.reconstructed_correct_sentence || !auditResult.option_analysis_consistency)) auditInconsistencies += 1
      if (auditReasons.length) throw new Error(auditReasons.join("; "))

      pool.push({ question_text: question.question_text, dedup_hash: hash })
      approved.push({ question, audit: auditResult, hash, planIndex })
      console.log(`${label} -> ACCEPT`)
    } catch (reason) {
      if (reason?.status === 429 || reason?.code === "insufficient_quota") throw reason
      rejected += 1
      console.warn(`${label} -> REJECT: ${reason.message}`)
      if (preview && candidateQuestion) console.warn(`Rejected candidate: ${JSON.stringify(candidateQuestion)}`)
    }
  }
  const runStats = { generated, inserted: 0, rejected, duplicates, approved, auditInconsistencies, llmAudits, retries, maxCandidates }
  if (!approved.length || preview) return runStats
  if (approved.length !== target || target % GRAMMAR_SESSION_COUNT !== 0) {
    console.warn(`Target not reached exactly (${approved.length}/${target}); nothing persisted.`)
    return { ...runStats, incomplete: true }
  }
  const { data: previous } = await supabase.from("grammar_tests").select("test_number").eq("topic_id", topic).eq("difficulty", difficulty).eq("is_active", true).order("test_number", { ascending: false }).limit(1).maybeSingle()
  let nextTestNumber = Number(previous?.test_number || 0) + 1
  const createdTestIds = []
  try {
    for (let offset = 0; offset < approved.length; offset += GRAMMAR_SESSION_COUNT) {
      const setQuestions = approved.slice(offset, offset + GRAMMAR_SESSION_COUNT)
      const { data: test, error: testError } = await supabase.from("grammar_tests").insert({ topic_id: topic, topic_name: GRAMMAR_TOPIC_PLANS[topic].name, difficulty, test_number: nextTestNumber, question_count: GRAMMAR_SESSION_COUNT, is_active: true, taxonomy_version: 1, generation_model: "gpt-4.1", prompt_version: "grammar-bank-direct-v1", source: "generated" }).select("id").single()
      if (testError) throw testError
      createdTestIds.push(test.id)
      nextTestNumber += 1
      const rows = setQuestions.map(({ question, audit: auditResult, hash }, index) => {
        const options = Object.entries(question.options).map(([label, text]) => ({ id: crypto.randomUUID(), label, text: String(text) })); const optionIds = Object.fromEntries(options.map((option) => [option.label, option.id]))
        return { test_id: test.id, question_number: index + 1, question_type: question.question_type, question_text: question.question_text, options, option_ids: optionIds, correct_answer: optionIds[question.correct_answer], explanation: question.explanation.why_correct, subskill: question.diagnosis.primary_skill, primary_skill: question.diagnosis.primary_skill, secondary_skill: question.diagnosis.secondary_skill, trap_type: question.diagnosis.trap_type, error_pattern: question.diagnosis.misconception, rule_tested: question.explanation.core_rule, why_students_fail: question.diagnosis.why_students_fail, ideal_thinking_process: question.diagnosis.ideal_thinking_process, lesson_for_future: question.diagnosis.future_lesson, option_analysis: question.option_analysis, difficulty_breakdown: question.quality, quality_score: question.quality.quality_score, quality_status: "approved", full_payload: question, question_version: 1, taxonomy_version: 1, generation_model: "gpt-4.1", prompt_version: "grammar-bank-direct-v1", source: "generated", review_status: "ai_audited", archetype_id: question.archetype_id || null, topic_id: topic, difficulty, skill_id: question.diagnosis.primary_skill, is_active: true, bank_status: "approved", audit_payload: auditResult, dedup_hash: hash }
      })
      const { error: insertError } = await supabase.from("grammar_questions").insert(rows)
      if (insertError) throw insertError
    }
  } catch (error) {
    if (createdTestIds.length) await supabase.from("grammar_tests").delete().in("id", createdTestIds)
    throw error
  }
  return { ...runStats, inserted: approved.length, testIds: createdTestIds }
}

const totals = { generated: 0, inserted: 0, rejected: 0, duplicates: 0 }
if (efficientSet) {
  console.log(`Planned slots: ${GRAMMAR_TOPIC_PLANS[topics[0]].families[difficulties[0]].map((family, index) => `${index + 1}. ${family}`).join(" | ")}`)
  console.log("Configured OpenAI model: gpt-4.1")
  console.log(`Start timestamp: ${benchmarkStartedAt.toISOString()}`)
}
for (const topic of topics) for (const difficulty of difficulties) {
  console.log(`\n${GRAMMAR_TOPIC_PLANS[topic].name} | ${difficulty} | target ${target}`)
  const result = efficientSet ? await seedEfficientSet(topic, difficulty) : await seedCombination(topic, difficulty)
  Object.keys(totals).forEach((key) => { totals[key] += Number(result[key] || 0) })
  console.log(`  generated ${result.generated}, inserted ${result.inserted}, rejected ${result.rejected}, duplicates ${result.duplicates}${result.testId ? `, test ${result.testId}` : ""}`)
  if (efficientSet) continue
  if (preview) result.approved.forEach(({ question }, index) => {
    console.log(`\n[${difficulty.toUpperCase()} ${index + 1}] ${question.question_type}`)
    console.log(question.question_text)
    Object.entries(question.options).forEach(([label, option]) => console.log(`  ${label}. ${option}`))
    console.log(`Correct: ${question.correct_answer}`)
    console.log(`Concept: ${question.diagnosis.primary_skill}`)
    console.log(`Core rule: ${question.explanation.core_rule}`)
    console.log(`Explanation: ${question.explanation.why_correct}`)
    console.log(`Tempting distractor: ${question.explanation.strongest_distractor} — ${question.explanation.why_distractor_is_tempting}`)
    console.log(`Why it fails: ${question.explanation.why_distractor_fails}`)
    const auditResult = result.approved[index].audit
    console.log(`Construction: ${plannedConstructionFamily(topic, difficulty, result.approved[index].planIndex, question)}`)
    console.log(`Controlled sites: ${JSON.stringify(auditResult.controlled_sites)}`)
    if (difficulty === "hard") {
      console.log(`Mechanism 1: ${auditResult.mechanism_1}`)
      console.log(`Mechanism 2: ${auditResult.mechanism_2}`)
      console.log(`Mechanism categories: ${JSON.stringify(auditResult.hard_mechanism_categories)}`)
      console.log(`Mechanism independence: ${auditResult.mechanism_independence_explanation}`)
    }
    if (topic === "tenses" && difficulty === "moderate") console.log(`Context sufficiency: ${auditResult.context_sufficiency}; ambiguity: ${auditResult.ambiguity_status}${auditResult.ambiguity_reason ? ` — ${auditResult.ambiguity_reason}` : ""}`)
    console.log(`Auditor verdict: ${auditResult.verdict}`)
  })
  const constructionDistribution = Object.fromEntries([...new Set(result.approved.map((item) => plannedConstructionFamily(topic, difficulty, item.planIndex, item.question)))].map((family) => [family, result.approved.filter((item) => plannedConstructionFamily(topic, difficulty, item.planIndex, item.question) === family).length]))
  const questionTypeDistribution = Object.fromEntries([...new Set(result.approved.map((item) => item.question.question_type))].map((type) => [type, result.approved.filter((item) => item.question.question_type === type).length]))
  console.log(`\nQuality audit | ${difficulty}: accepted ${result.approved.length}, rejected ${result.rejected}, duplicates ${result.duplicates}, auditor inconsistencies ${result.auditInconsistencies}`)
  console.log(`Construction distribution: ${JSON.stringify(constructionDistribution)}`)
  console.log(`Question-type distribution: ${JSON.stringify(questionTypeDistribution)}`)
  console.log(`Requested: ${target}`)
  console.log(`Candidate budget: ${result.maxCandidates}`)
  console.log(`Candidates generated: ${result.generated}`)
  console.log(`Accepted: ${result.approved.length}`)
  console.log(`Rejected: ${result.rejected}`)
  console.log(`LLM audits: ${result.llmAudits}`)
  console.log(`Retries: ${result.retries}`)
}
console.log(`\nGrammar bank summary (${preview ? "PREVIEW — nothing inserted" : "persisted"}): generated ${totals.generated}, inserted ${totals.inserted}, rejected ${totals.rejected}, duplicates ${totals.duplicates}`)
if (efficientSet) console.log(`OpenAI usage\n------------\nGeneration calls: ${usageTotals.generation}\nAudit calls: ${usageTotals["set-audit"]}\nReplacement calls: ${usageTotals.replacement}\nReplacement audits: ${usageTotals["replacement-audit"]}\nTotal calls: ${usageTotals.generation + usageTotals["set-audit"] + usageTotals.replacement + usageTotals["replacement-audit"]}\nInput tokens: ${usageTotals.input}\nOutput tokens: ${usageTotals.output}\nTotal tokens: ${usageTotals.total}\nCached input tokens: ${usageTotals.cachedInput}\nReasoning tokens: ${usageTotals.reasoning}\nGeneration time ms: ${benchmarkTimings.generation.toFixed(1)}\nLocal validation time ms: ${benchmarkTimings.localValidation.toFixed(1)}\nAudit time ms: ${benchmarkTimings.audit.toFixed(1)}\nPersistence time ms: ${benchmarkTimings.persistence.toFixed(1)}\nTotal wall-clock time ms: ${(performance.now() - benchmarkStartedPerformance).toFixed(1)}\nInitial questions generated: ${benchmarkQuality.initialGenerated}\nLocally rejected: ${benchmarkQuality.locallyRejected}\nSet audit rejected: ${benchmarkQuality.setAuditRejected}\nReplacement questions generated: ${benchmarkQuality.replacementsGenerated}\nFinal accepted: ${totals.inserted}\nAuditor inconsistencies: ${benchmarkQuality.auditorInconsistencies}\nUsage log: logs/grammar-openai-usage.jsonl`)
