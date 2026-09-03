import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getAuthenticatedProfile } from "@/lib/tenant/getCurrentProfile"
import { authorizeTenantMembership, getRequestHostname, resolveHostname } from "@/lib/tenant/resolveHostname"
import { getEffectiveEntitlement } from "@/lib/tenant/entitlement"
import { GRAMMAR_ONTOLOGY, GRAMMAR_QUESTION_TYPES, GRAMMAR_TRAP_TYPES } from "@/lib/grammarOntology"

export const GRAMMAR_SESSION_COUNT = 5
export const GRAMMAR_TAXONOMY_VERSION = 1
export const GRAMMAR_PROMPT_VERSION = "grammar-phase1-v1"
export const GRAMMAR_MODEL = "gpt-4.1"
export const SUPPORTED_GRAMMAR_TOPICS = new Set(Object.keys(GRAMMAR_ONTOLOGY))
const titleizeTopic = (id) => id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
export const GRAMMAR_TOPIC_NAMES = Object.freeze({
  ...Object.fromEntries(Object.keys(GRAMMAR_ONTOLOGY).map((id) => [id, titleizeTopic(id)])),
  "subject-verb-agreement": "Subject–Verb Agreement",
  pronouns: "Pronouns",
  modifiers: "Modifiers",
  parallelism: "Parallelism",
  tenses: "Tenses",
  "articles-determiners": "Articles & Determiners",
  "mixed-practice": "Mixed Practice",
  "weakness-training": "Weakness Training",
})

export async function requireGrammarAccess(request) {
  const identity = await getAuthenticatedProfile(request)
  if (identity.error) return { ok: false, status: identity.error === "unauthorized" ? 401 : 403 }
  const tenant = await resolveHostname(getRequestHostname(request))
  const authorization = authorizeTenantMembership(tenant, identity.profile)
  if (!authorization.allowed) return { ok: false, status: 403 }
  const { data: subscription } = await supabaseAdmin.from("subscriptions").select("plan,expires_at").eq("user_id", identity.user.id).gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle()
  const entitlement = getEffectiveEntitlement({ profile: identity.profile, resolvedTenant: tenant, subscription })
  if (!entitlement.hasAccess) return { ok: false, status: 403 }
  return { ok: true, user: identity.user, profile: identity.profile, tenant, entitlement }
}

export function prepareGrammarQuestion(question, index = 0) {
  const optionIds = {}
  const options = Object.entries(question.options).map(([label, text]) => {
    const id = crypto.randomUUID()
    optionIds[label] = id
    return { id, label, text: String(text) }
  })
  return {
    record: {
      question_number: index + 1,
      question_type: question.question_type,
      question_text: question.question_text,
      options,
      option_ids: optionIds,
      correct_answer: optionIds[question.correct_answer],
      explanation: question.explanation.why_correct,
      subskill: question.diagnosis.primary_skill,
      trap_type: question.diagnosis.trap_type,
      primary_skill: question.diagnosis.primary_skill,
      secondary_skill: question.diagnosis.secondary_skill,
      error_pattern: question.diagnosis.misconception,
      rule_tested: question.explanation.core_rule,
      why_students_fail: question.diagnosis.why_students_fail,
      ideal_thinking_process: question.diagnosis.ideal_thinking_process,
      lesson_for_future: question.diagnosis.future_lesson,
      option_analysis: question.option_analysis,
      difficulty_breakdown: question.quality,
      quality_score: question.quality.quality_score,
      quality_status: "approved",
      archetype_id: question.archetype_id || null,
      full_payload: question,
      question_version: 1,
      taxonomy_version: GRAMMAR_TAXONOMY_VERSION,
      generation_model: GRAMMAR_MODEL,
      prompt_version: GRAMMAR_PROMPT_VERSION,
      source: "generated",
      review_status: "ai_audited",
    },
    client: { questionNumber: index + 1, questionType: question.question_type, questionText: question.question_text, skill: question.diagnosis.primary_skill, options },
  }
}

export function sanitizeStoredQuestion(question) {
  return { id: question.id, questionNumber: question.question_number, questionType: question.question_type, questionText: question.question_text, skill: question.primary_skill || question.subskill, options: question.options }
}

export function isPlayableStoredQuestion(question, test) {
  const options = Array.isArray(question?.options) ? question.options : []
  const optionIds = options.map((option) => option?.id).filter(Boolean)
  const topicId = test?.topic_id || question?.topic_id
  return question?.is_active === true
    && question?.bank_status === "approved"
    && question?.test_id === test?.id
    && question?.topic_id === topicId
    && question?.difficulty === test?.difficulty
    && GRAMMAR_QUESTION_TYPES.includes(question?.question_type)
    && GRAMMAR_ONTOLOGY[topicId]?.skills?.includes(question?.primary_skill || question?.subskill)
    && GRAMMAR_TRAP_TYPES.includes(question?.trap_type)
    && options.length === 4
    && new Set(optionIds).size === 4
    && optionIds.includes(question?.correct_answer)
    && Boolean(String(question?.question_text || "").trim())
    && Boolean(String(question?.explanation || "").trim())
    && Boolean(String(question?.rule_tested || "").trim())
    && question?.option_analysis != null
}

export function completedQuestion(question, attempt) {
  const payload = question.full_payload || {}
  const selected = (question.options || []).find((option) => option.id === attempt?.selected_option_id)
  const correct = (question.options || []).find((option) => option.id === question.correct_answer)
  const label = selected?.label
  const analysis = label ? payload.option_analysis?.[label] : null
  return {
    ...sanitizeStoredQuestion(question), selectedOptionId: selected?.id || null, correctOptionId: correct?.id || null,
    isCorrect: attempt?.is_correct === true, responseTimeSec: attempt?.time_taken_seconds || 0,
    explanation: { coreRule: payload.explanation?.core_rule || question.rule_tested, whyCorrect: payload.explanation?.why_correct || question.explanation },
    selectedDiagnosis: selected && selected.id !== correct?.id ? { whyChoiceFails: analysis?.why_it_is_correct_or_wrong || payload.explanation?.why_distractor_fails, trap: payload.diagnosis?.trap_type || question.trap_type, misconception: payload.diagnosis?.misconception || question.error_pattern, evidence: payload.diagnosis?.why_students_fail || question.why_students_fail } : null,
  }
}

export async function getTestQuestions(testId, limit = GRAMMAR_SESSION_COUNT) {
  const { data: questions, error } = await supabaseAdmin
    .from("grammar_questions")
    .select("*")
    .eq("test_id", testId)
    .eq("bank_status", "approved")
    .eq("is_active", true)
    .order("question_number")
    .limit(limit)
  if (error) throw error
  return questions || []
}

const stableRank = (seed, value) => crypto.createHash("sha256").update(`${seed}|${value}`).digest("hex")
async function availableBankQuestions(attempt) {
  let query = supabaseAdmin.from("grammar_questions").select("*").eq("bank_status", "approved").eq("is_active", true).lte("created_at", attempt.started_at).limit(5000)
  const { data, error } = await query
  if (error) throw error
  return (data || []).filter((question) => isPlayableStoredQuestion(question, { id: question.test_id, topic_id: question.topic_id, difficulty: question.difficulty })).sort((left, right) => stableRank(attempt.id, left.id).localeCompare(stableRank(attempt.id, right.id)))
}

export async function getAttemptQuestions(attempt, userId) {
  if (attempt.topic_id !== "mixed-practice" && attempt.topic_id !== "weakness-training") return getTestQuestions(attempt.test_id, attempt.total_questions)
  const bank = await availableBankQuestions(attempt)
  if (attempt.topic_id === "mixed-practice") {
    const selected = [], usedTopics = new Set()
    bank.forEach((question) => {
      if (selected.length < attempt.total_questions && !usedTopics.has(question.topic_id)) { selected.push(question); usedTopics.add(question.topic_id) }
    })
    bank.forEach((question) => { if (selected.length < attempt.total_questions && !selected.some((item) => item.id === question.id)) selected.push(question) })
    return selected
  }
  const { data: priorAttempts, error: attemptError } = await supabaseAdmin.from("grammar_test_attempts").select("id").eq("user_id", userId).eq("completed", true).lt("completed_at", attempt.started_at).limit(500)
  if (attemptError) throw attemptError
  const attemptIds = (priorAttempts || []).map((item) => item.id)
  if (!attemptIds.length) return bank.slice(0, attempt.total_questions)
  const { data: misses, error: missError } = await supabaseAdmin.from("grammar_question_attempts").select("question_id").eq("user_id", userId).eq("is_correct", false).in("attempt_id", attemptIds).limit(5000)
  if (missError) throw missError
  const missedIds = [...new Set((misses || []).map((item) => item.question_id))]
  if (!missedIds.length) return bank.slice(0, attempt.total_questions)
  const { data: missedQuestions, error: questionError } = await supabaseAdmin.from("grammar_questions").select("id,skill_id,primary_skill,topic_id").in("id", missedIds)
  if (questionError) throw questionError
  const weaknessCounts = new Map()
  ;(missedQuestions || []).forEach((question) => { const key = question.skill_id || question.primary_skill || question.topic_id; weaknessCounts.set(key, (weaknessCounts.get(key) || 0) + 1) })
  const weakest = [...weaknessCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const focused = bank.filter((question) => (question.skill_id || question.primary_skill || question.topic_id) === weakest)
  return [...focused, ...bank.filter((question) => !focused.some((item) => item.id === question.id))].slice(0, attempt.total_questions)
}
