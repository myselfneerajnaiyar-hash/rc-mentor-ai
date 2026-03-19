export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req) {

  try {

    const { userId, weakSkills } = await req.json()

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
const prompt = `
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
      max_tokens: 4000
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

    function shuffleQuestion(q) {

  if (!Array.isArray(q.options)) return q

  const correctOption = q.options[q.correctIndex]

  const shuffled = [...q.options].sort(() => Math.random() - 0.5)

  const newIndex = shuffled.indexOf(correctOption)

  q.options = shuffled
  q.correctIndex = newIndex

  return q
}

drill.micro = drill.micro.map(shuffleQuestion)

drill.mini_rc.questions =
  drill.mini_rc.questions.map(shuffleQuestion)

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

    return NextResponse.json(drill)

  } catch (err) {

    console.error("Precision drill error:", err)

    return NextResponse.json(
      { error: "Precision drill failed" },
      { status: 500 }
    )

  }

}