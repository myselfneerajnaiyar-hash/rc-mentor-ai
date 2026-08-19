export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import {
  PRECISION_DURATION_SECONDS,
  authenticatedUser,
  buildTargetPlan,
  normalizeDrill,
  normalizeTargetSkill,
  sanitizeDrill,
  sealDrill,
} from "@/lib/precision/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req) {

  try {

    const user = await authenticatedUser(req, supabase)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const weakSkills = [...new Set(Array.isArray(body.weakSkills)
      ? body.weakSkills.filter((skill) => typeof skill === "string").map(normalizeTargetSkill).filter(Boolean).slice(0, 2)
      : [])]
    if (!weakSkills.length) {
      return NextResponse.json({ error: "No diagnosed Precision skills were provided" }, { status: 400 })
    }
    const targetPlan = buildTargetPlan(weakSkills)
    const userId = user.id

    // ===== LIMIT CHECK =====

    const today = new Date().toISOString().split("T")[0]

    const { data: attempts } = await supabase
      .from("precision_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("attempt_date", today)
      .single()

    let attemptCount = attempts?.attempt_count || 0

    // Assume free user for now
    const limit = 5

    if (attemptCount >= limit) {

      return NextResponse.json({
        limitReached: true,
        message: "Precision limit reached"
      })

    }

    // ===== GENERATE DRILL =====
const legacyPrompt = `
You are a senior CAT VARC examiner designing high-quality reasoning drills similar to the CAT exam.

Weak skills to target:
${weakSkills.join(", ")}

Your goal is to create questions that require careful reasoning. The correct answer must NOT be identifiable through obvious elimination.

The difficulty must resemble CAT 2021–2023 VARC.

--------------------------------------------------
PASSAGE WRITING RULES
--------------------------------------------------

Write argumentative passages (80–120 words).

The passage must contain a clear reasoning structure, not merely a balanced opinion.

Use one of the following logical patterns:

* A commonly held belief followed by a critique or limitation  
* An observed phenomenon followed by a deeper explanation  
* A claim followed by a qualification that changes its implications  

Avoid symmetrical “both sides are equally valid” conclusions.

The paragraph should subtly lean toward a specific interpretation or insight.

IMPORTANT:

Do NOT refer to the author directly.

Avoid phrases like:
- "the author argues"
- "the author suggests"
- "the author critiques"
- "this passage shows"

Instead present the ideas naturally as part of the discussion.

The passage should resemble an academic editorial paragraph.

The passage must NOT directly reveal the answer.

PASSAGE COMPLEXITY RULE

The passage should include at least one of the following:

* a qualification that limits the main claim
* a contrast between two related ideas
* a subtle shift in argument in the final sentence

Avoid overly clean "balanced conclusion" structures.

--------------------------------------------------
QUESTION DESIGN RULES
--------------------------------------------------

Questions must test real CAT reasoning patterns:

* inference  
* author agreement  
* paragraph function  
* tone / author attitude  
* implicit assumption  
* next paragraph prediction  

Students must interpret the argument to answer.

Avoid factual recall or line-matching questions.

--------------------------------------------------
--------------------------------------------------
OPTION DESIGN METHOD (CAT STYLE)
--------------------------------------------------

Step 1  
Identify the author's precise claim.

Step 2  
Write the correct option as a higher-level interpretation of the author's reasoning, not a paraphrase of any sentence in the passage.

Step 3  
Create three distractors using CAT-style traps:

* ONE strong trap that appears almost correct but subtly misinterprets the author's logic.
* ONE scope-shift trap that slightly broadens or narrows the author's claim.
* ONE weaker trap that exaggerates or oversimplifies the author's reasoning.

IMPORTANT:

At least TWO incorrect options must appear nearly as plausible as the correct answer.

The difference between the correct answer and the strongest distractor should depend on subtle reasoning rather than obvious wording differences.

IMPORTANT:

Distractors must NOT be obviously wrong.

CRITICAL WORDING RULE:

Avoid absolute or extreme terms such as:

always  
never  
inevitably  
entirely  
solely  
completely  

Options containing extreme wording are easy to eliminate and reduce question difficulty.

Prefer moderate language such as:

often  
generally  
tends to  
largely  
may  
in many cases



All options must appear equally plausible.

The correct answer must capture the author's underlying reasoning, not simply restate a sentence from the passage.
--------------------------------------------------
OPTION QUALITY RULES
--------------------------------------------------

All four options must:

* be similar in length (8–16 words)  
* use similar vocabulary  
* appear equally plausible  
* avoid extreme wording

Do NOT use words like:

Avoid excessive use of extreme words such as always or never unless they logically follow from the passage.

At least TWO distractors must appear reasonable to a careful reader.

The correct answer must blend with the distractors and not appear clearly superior.
At least TWO incorrect options must appear nearly as plausible as the correct answer.

The correct answer should only be identifiable after careful reasoning.

--------------------------------------------------
FINAL OPTION CHECK
--------------------------------------------------

FINAL OPTION CHECK (CRITICAL)

Before returning the question, perform this internal test:

Step 1
Pretend you are a strong CAT aspirant solving the question.

Step 2
Attempt to eliminate options quickly.

Step 3
If two options can be eliminated immediately because they are clearly weaker,
rewrite the options.

Step 4
The final options must satisfy:

* At least THREE options appear plausible after the first reading.
* The correct answer should only become clear after analyzing the passage carefully.

If the correct answer resembles a sentence in the passage, rewrite it at a more abstract reasoning level.

Additional CAT Quality Check:

Before returning the question verify:

* None of the options can be eliminated immediately due to extreme wording.
* At least three options appear reasonable after first reading.
* The correct answer should only become clear after analyzing the author's logic.
--------------------------------------------------
SESSION STRUCTURE
--------------------------------------------------

Generate 6 MICRO DRILLS.

Each drill must contain:

paragraph  
question  
options (4)  
correctIndex  
skill  

explanation:

{
 "reasoning": "step-by-step reasoning explaining the correct answer",
 "why_correct": "why the correct option matches the author's argument",
 "traps": [
   {
     "optionIndex": 0,
     "trap_type": "",
     "reason": ""
   }
 ]
}

--------------------------------------------------

Then generate:

1 MINI RC PASSAGE (250–300 words)

The passage must contain:

* competing viewpoints  
* conceptual tension  
* a nuanced position  

Create 2 questions testing:

* inference  
* tone OR paragraph function  

Answers must require combining ideas across the passage.

Avoid obvious summary questions.

--------------------------------------------------

Return JSON exactly in this format:

{
 "micro": [],
 "mini_rc": {
  "passage": "",
  "questions": []
 }
}

Return ONLY valid JSON.
`;
const prompt = `
You are a senior CAT VARC examiner creating a targeted Precision remediation session.

TARGET SKILLS (HARD CONSTRAINT): ${weakSkills.join(", ")}
EXACT EIGHT-QUESTION SKILL PLAN: ${targetPlan.map((skill, index) => `${index + 1}:${skill}`).join(", ")}

Every question MUST use the exact target_skill assigned at its position and MUST set both "target_skill" and "skill" to that value. Never introduce, substitute, or broaden to another skill. The cognitive task—not merely its label—must test that skill.

SKILL ALIGNMENT RULES:
- inference: require a conclusion supported by combined textual evidence, never direct retrieval.
- main_idea: test the passage's central claim or organizing insight, never an isolated detail.
- author_agreement or author_stance: test the position the writer would endorse from the argument.
- author_purpose or purpose: test why the passage or a key move exists.
- tone: distinguish the writer's precise attitude using textual cues.
- paragraph_function: test the logical role a paragraph or statement plays.
- assumption: require the unstated premise needed by the reasoning.
- detail or detail_evidence: test precise evidence without turning into trivial line matching.
- strengthen or weaken: require evaluating how new information affects the argument.
- application: require transferring the passage's principle to a new case.
- next_paragraph: require predicting the logically warranted next development.
For any other supplied target, construct a genuine reasoning task matching its ordinary RC meaning.

Create 6 micro drills, each with an argumentative paragraph of 80–120 words, then one nuanced mini RC passage of 250–300 words with 2 questions. Use the skill plan in order: micro questions are positions 1–6; mini RC questions are positions 7–8. Do not force the mini RC to inference or tone unless those appear in its assigned positions.

Each question must have four similarly plausible options and one correctIndex. Design distractors intentionally. For every incorrect option, include either structured trap metadata when a meaningful trap is deliberately used, or null fields when there is genuinely no meaningful named trap. Never use a fallback category merely because classification is uncertain.

Allowed trap_type values only:
extreme_wording, scope_shift, opposite_inference, partially_true, unsupported_assumption, too_broad, too_narrow, qualifier_ignored, cause_effect_confusion, passage_contradiction, distorted_relationship, irrelevant_detail, wrong_comparison, misinterpretation, other.

Use "other" only for a real, clearly explained distractor pattern that cannot fit a named category. Do not emit trap metadata for the correct option.

Every question must have this shape:
{
  "paragraph": "",
  "question": "",
  "question_type": "the cognitive task being tested",
  "target_skill": "exact assigned skill",
  "skill": "exact assigned skill",
  "options": ["", "", "", ""],
  "correctIndex": 0,
  "explanation": {
    "reasoning": "why the target skill leads to the answer",
    "why_correct": "why the correct option matches the passage",
    "traps": [
      {
        "optionIndex": 1,
        "trap_type": "scope_shift or null",
        "trap_label": "Scope shift or null",
        "trap_explanation": "Specific explanation grounded in this option and passage, or null"
      }
    ]
  }
}

Before returning JSON, verify internally:
1. Every skill exactly matches its assigned position in the skill plan.
2. Each question actually requires that cognitive skill.
3. No unrelated RC skill appears.
4. Trap metadata describes the actual distractor and is not a generic label.
5. A distractor without a meaningful named trap uses nulls.

Return ONLY valid JSON in exactly this top-level structure:
{"micro": [6 questions], "mini_rc": {"passage": "", "questions": [2 questions]}}
`;
void legacyPrompt
console.log("Generating precision drill...")
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
     {
  role: "system",
  content: `
You are a strict JSON generator.

Rules:
- Return ONLY valid JSON
- No markdown
- No comments
- No text outside JSON
- Ensure all strings are closed
- Ensure arrays and objects are valid JSON
`
},
        { role: "user", content: prompt }
      ],
      temperature: 0.45,
      response_format: { type: "json_object" },
      max_tokens: 7000
    })

    console.log("OpenAI response received")

    let drill

const raw = completion.choices[0].message.content

console.log("RAW AI RESPONSE LENGTH:", raw.length)

try {

  drill = JSON.parse(raw)

} catch (err) {

  console.error("INVALID JSON FROM AI:")
  console.error(raw)

  return NextResponse.json(
    { error: "AI returned incomplete JSON. Please retry." },
    { status: 500 }
  )

}

if (!Array.isArray(drill.micro)) {
  drill.micro = []
}

if (!drill.mini_rc || !Array.isArray(drill.mini_rc.questions)) {
  drill.mini_rc = {
    passage: "",
    questions: []
  }
}

    const normalizedDrill = normalizeDrill(drill, weakSkills)
    const sealedDrill = sealDrill(normalizedDrill)

    const { data: storedDrill, error: drillStoreError } = await supabase
      .from("precision_drills")
      .insert({
        skill_1: weakSkills[0] || "inference",
        skill_2: weakSkills[1] || weakSkills[0] || "inference",
        drill_data: {
          sealed_payload: sealedDrill,
          generation_version: "precision-targeted-v2",
        },
      })
      .select("id")
      .single()

    if (drillStoreError || !storedDrill) {
      console.error("Precision drill storage failed", drillStoreError)
      return NextResponse.json({ error: "Could not store Precision drill" }, { status: 500 })
    }

    const { data: session, error: sessionError } = await supabase
      .from("rc_sessions")
      .insert({
        user_id: userId,
        passage_id: `precision-v2:${storedDrill.id}`,
        passage_text: "Precision reasoning drill",
        total_questions: normalizedDrill.micro.length + normalizedDrill.mini_rc.questions.length,
        correct_answers: null,
        time_taken_sec: null,
        difficulty: "precision",
      })
      .select("id,created_at,total_questions")
      .single()

    if (sessionError || !session) {
      console.error("Precision session creation failed", sessionError)
      return NextResponse.json({ error: "Could not create Precision session" }, { status: 500 })
    }

    // ===== SAVE ATTEMPT =====

    if (attempts) {

      await supabase
        .from("precision_attempts")
        .update({
          attempt_count: attemptCount + 1
        })
        .eq("id", attempts.id)

    } else {

      await supabase
        .from("precision_attempts")
        .insert({
          user_id: userId,
          attempt_date: today,
          attempt_count: 1
        })

    }

    const expiresAt = new Date(
      new Date(session.created_at).getTime() + PRECISION_DURATION_SECONDS * 1000
    ).toISOString()

    return NextResponse.json({
      sessionId: session.id,
      createdAt: session.created_at,
      expiresAt,
      durationSeconds: PRECISION_DURATION_SECONDS,
      drill: sanitizeDrill(normalizedDrill),
    })

  } catch (err) {

    console.error("Precision drill error:", err)

    return NextResponse.json(
      { error: "Precision drill failed" },
      { status: 500 }
    )

  }

}
