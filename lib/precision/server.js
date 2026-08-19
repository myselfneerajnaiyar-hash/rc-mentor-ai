import crypto from "crypto"

export const PRECISION_DURATION_SECONDS = 480
export const PRECISION_GENERATION_VERSION = "precision-targeted-v2"
export const PRECISION_TAXONOMY_VERSION = 1

const SKILL_MAP = {
  "main-idea": "central_claim",
  main_idea: "central_claim",
  central_idea: "central_claim",
  detail: "detail_evidence",
  inference: "inference_unspecified",
  "author-agreement": "author_stance",
  tone: "tone",
  "author-attitude": "tone",
  function: "paragraph_function",
  "paragraph-function": "paragraph_function",
  purpose: "purpose",
  assumption: "assumption",
  "implicit-assumption": "assumption",
  strengthen: "strengthen",
  weaken: "weaken",
  application: "application",
  "next-paragraph": "next_paragraph",
  "next-paragraph-prediction": "next_paragraph",
}

const TRAP_MAP = {
  "extreme wording": "extreme_wording",
  extreme_wording: "extreme_wording",
  "scope shift": "scope_shift",
  scope_shift: "scope_shift",
  "opposite inference": "opposite_inference",
  opposite_inference: "opposite_inference",
  "partially true": "partially_true",
  partially_true: "partially_true",
  "partial truth": "partially_true",
  "unsupported assumption": "unsupported_assumption",
  unsupported_assumption: "unsupported_assumption",
  "unsupported inference": "unsupported_assumption",
  "too broad": "too_broad",
  too_broad: "too_broad",
  overstatement: "too_broad",
  "too narrow": "too_narrow",
  too_narrow: "too_narrow",
  narrowing: "too_narrow",
  "qualifier ignored": "qualifier_ignored",
  qualifier_ignored: "qualifier_ignored",
  "cause/effect confusion": "cause_effect_confusion",
  cause_effect_confusion: "cause_effect_confusion",
  "passage contradiction": "passage_contradiction",
  passage_contradiction: "passage_contradiction",
  "distorted relationship": "distorted_relationship",
  distorted_relationship: "distorted_relationship",
  "irrelevant detail": "irrelevant_detail",
  irrelevant_detail: "irrelevant_detail",
  "wrong comparison": "wrong_comparison",
  wrong_comparison: "wrong_comparison",
  misinterpretation: "misinterpretation",
  other: "other",
}

const SKILL_ALIASES = {
  "main-idea": "main_idea",
  "central-idea": "main_idea",
  "central-claim": "main_idea",
  "author-agreement": "author_agreement",
  "author-attitude": "tone",
  function: "paragraph_function",
  "paragraph-function": "paragraph_function",
  purpose: "author_purpose",
  "author-purpose": "author_purpose",
  "implicit-assumption": "assumption",
  "next-paragraph": "next_paragraph",
  "next-paragraph-prediction": "next_paragraph",
}

export function normalizeTargetSkill(raw) {
  const key = String(raw || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-")
  return SKILL_ALIASES[key] || key.replace(/-/g, "_")
}

export function canonicalSkill(raw) {
  const key = String(raw || "").trim().toLowerCase().replace(/\s+/g, "-")
  return SKILL_MAP[key] || "inference_unspecified"
}

export function canonicalTrap(raw) {
  const key = String(raw || "").trim().toLowerCase()
  if (!key) return null
  if (TRAP_MAP[key]) return TRAP_MAP[key]
  return null
}

function shuffle(values) {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeQuestion(question, sequence, expectedSkill, sharedPassage = "") {
  const generatedSkill = normalizeTargetSkill(question.skill || question.target_skill)
  const declaredTarget = normalizeTargetSkill(question.target_skill)
  const cognitiveTask = normalizeTargetSkill(question.question_type)
  if (!generatedSkill || generatedSkill !== expectedSkill || declaredTarget !== expectedSkill || cognitiveTask !== expectedSkill) {
    throw new Error(`Precision question ${sequence + 1} does not match target skill ${expectedSkill}`)
  }
  const traps = new Map(
    (question?.explanation?.traps || []).map((trap) => [Number(trap.optionIndex), trap])
  )
  const options = (question.options || []).map((text, originalIndex) => {
    const trap = traps.get(originalIndex)
    const trapType = canonicalTrap(trap?.trap_type)
    if (trap?.trap_type && !trapType) throw new Error(`Precision question ${sequence + 1} has an unsupported trap type`)
    if (originalIndex === Number(question.correctIndex) && trapType) {
      throw new Error(`Precision question ${sequence + 1} marks the correct answer as a trap`)
    }
    if (trapType && (!trap?.trap_label || !trap?.trap_explanation)) {
      throw new Error(`Precision question ${sequence + 1} has incomplete trap metadata`)
    }
    return {
      id: crypto.randomUUID(),
      text: String(text),
      rawTrapType: trap?.trap_type || null,
      trapType,
      trapLabel: trapType ? String(trap.trap_label) : null,
      trapExplanation: trapType ? String(trap.trap_explanation) : null,
      trapReason: trapType ? String(trap.trap_explanation) : null,
      isCorrect: originalIndex === Number(question.correctIndex),
    }
  })
  const shuffled = shuffle(options)
  const correct = shuffled.find((option) => option.isCorrect)

  if (shuffled.length !== 4 || !correct) {
    throw new Error("Precision question has an invalid option set")
  }

  const rawSkill = expectedSkill
  return {
    id: crypto.randomUUID(),
    sequence,
    paragraph: question.paragraph || "",
    sharedPassage,
    question: String(question.question || ""),
    options: shuffled,
    correctOptionId: correct.id,
    rawSkill,
    canonicalSkill: canonicalSkill(rawSkill),
    difficulty: "cat_generated",
    explanation: question.explanation || {},
    itemVersion: 1,
    taxonomyVersion: PRECISION_TAXONOMY_VERSION,
    generationVersion: PRECISION_GENERATION_VERSION,
  }
}

export function buildTargetPlan(targetSkills, total = 8) {
  const skills = [...new Set((targetSkills || []).map(normalizeTargetSkill).filter(Boolean))].slice(0, 2)
  if (!skills.length) throw new Error("Precision requires at least one target skill")
  return Array.from({ length: total }, (_, index) => skills[index % skills.length])
}

export function normalizeDrill(drill, targetSkills) {
  const plan = buildTargetPlan(targetSkills)
  let sequence = 0
  if ((drill.micro || []).length !== 6 || (drill.mini_rc?.questions || []).length !== 2) {
    throw new Error("Precision drill must contain exactly eight questions")
  }
  const micro = (drill.micro || []).map((question) => normalizeQuestion(question, sequence, plan[sequence++]))
  const passage = drill.mini_rc?.passage || ""
  const miniQuestions = (drill.mini_rc?.questions || []).map((question) =>
    normalizeQuestion(question, sequence, plan[sequence++], passage)
  )
  return { targetSkills: [...new Set(plan)], micro, mini_rc: { passage, questions: miniQuestions } }
}

export function allQuestions(drill) {
  return [...(drill?.micro || []), ...(drill?.mini_rc?.questions || [])]
}

export function sanitizeDrill(drill) {
  const sanitizeQuestion = (question) => ({
    id: question.id,
    sequence: question.sequence,
    paragraph: question.paragraph,
    question: question.question,
    options: question.options.map(({ id, text }) => ({ id, text })),
    skill: question.rawSkill,
    canonicalSkill: question.canonicalSkill,
    difficulty: question.difficulty,
    itemVersion: question.itemVersion,
    generationVersion: question.generationVersion,
  })
  return {
    targetSkills: drill.targetSkills || [],
    micro: drill.micro.map(sanitizeQuestion),
    mini_rc: {
      passage: drill.mini_rc.passage,
      questions: drill.mini_rc.questions.map(sanitizeQuestion),
    },
  }
}

function encryptionKey() {
  const secret = process.env.PRECISION_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("Precision session secret is not configured")
  return crypto.createHash("sha256").update(secret).digest()
}

export function sealDrill(drill) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(drill), "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".")
}

export function unsealDrill(value) {
  const [ivPart, tagPart, encryptedPart] = String(value || "").split(".")
  if (!ivPart || !tagPart || !encryptedPart) throw new Error("Invalid Precision session payload")
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"))
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"))
  const plain = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ])
  return JSON.parse(plain.toString("utf8"))
}

export function drillIdFromSession(session) {
  const prefix = "precision-v2:"
  if (!session?.passage_id?.startsWith(prefix)) throw new Error("Not a Phase 0 Precision session")
  return session.passage_id.slice(prefix.length)
}

export async function loadSessionDrill(session, supabase) {
  const drillId = drillIdFromSession(session)
  const { data, error } = await supabase
    .from("precision_drills")
    .select("drill_data")
    .eq("id", drillId)
    .maybeSingle()
  if (error || !data?.drill_data?.sealed_payload) {
    throw new Error("Precision session content is unavailable")
  }
  return unsealDrill(data.drill_data.sealed_payload)
}

export function sessionDeadline(session) {
  return new Date(new Date(session.created_at).getTime() + PRECISION_DURATION_SECONDS * 1000)
}

export async function authenticatedUser(req, supabase) {
  const authorization = req.headers.get("authorization") || ""
  if (!authorization.startsWith("Bearer ")) return null
  const token = authorization.slice("Bearer ".length)
  const { data, error } = await supabase.auth.getUser(token)
  return error ? null : data.user
}
