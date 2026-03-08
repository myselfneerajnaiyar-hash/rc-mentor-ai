import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0]

    // 1️⃣ Check if workout already exists
    const { data: existingWorkout } = await supabase
      .from("daily_workout_templates")
      .select("*")
      .eq("workout_date", today)
      .single()

    if (existingWorkout) {
      return NextResponse.json(existingWorkout.content)
    }

    // 2️⃣ Generate new workout
   const generatedWorkout = await generateWorkoutWithRetry()

    // 3️⃣ Store in Supabase
    await supabase.from("daily_workout_templates").insert({
      workout_date: today,
      mode: "normal",
      content: generatedWorkout,
    })

    return NextResponse.json(generatedWorkout)

  } catch (err) {
    console.error("Daily Workout Error:", err)
    return NextResponse.json(
      { error: "Failed to generate daily workout" },
      { status: 500 }
    )
  }
}

async function generateWorkoutWithRetry() {

  const MAX_TRIES = 3

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {

    try {

      console.log("Workout generation attempt:", attempt)

      const workout = await generateWorkout()

      return workout

    } catch (err) {

      console.error("Generation attempt failed:", attempt, err.message)

      if (attempt === MAX_TRIES) {
        throw err
      }

    }

  }

}

async function generateWorkout() {
  const prompt = `
You are a senior CAT VARC examiner.

Design a COMPLETE 30-minute Daily VARC Intelligence Workout.

STRICT RULES:
1. Real CAT-level difficulty.
2. Moderate to difficult.
3. Logical traps must exist.
4. Options must be close and confusing.
5. All questions must include correctIndex (0-3).
6.  Do NOT under-generate length.
7.  Length requirements must be strictly followed.
8. If passage is below minimum word count, regenerate internally before returning.
9. Every question MUST include a "skill" field.
10. The "skill" value must be chosen from the allowed list below.
11. Every question MUST include a detailed "explanation" field.
12. Explanation must:
   - Justify why the correct option is correct.
   - Briefly explain why at least one incorrect option is misleading.
   - Be 80–150 words.
   - Be analytical, not generic.

====================================
RETURN ONLY VALID JSON IN THIS STRUCTURE
====================================

{
  "speed": { "questions": [] },
  "vocab": { "questions": [] },
  "rc1": { "passage": "", "questions": [] },
  "rc2": { "passage": "", "questions": [] },
  "micro": { "questions": [] }
}

====================================
ALLOWED SKILL TAGS (MANDATORY)
====================================

Each question must include one of the following skill values:

- main_idea
- inference
- tone
- structure
- para_completion
- odd_one_out
- logic
- critical_reasoning
- vocabulary
====================================
COUNT REQUIREMENTS
====================================

Speed: 10 questions  
Each question MUST follow this exact structure:

{
  "paragraph": "100-130 word mini passage (must appear visually as 7-8 lines when rendered)"
  "question": "A sharp inference question based strictly on the paragraph",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "skill": "inference",
 "explanation": "Identify the implicit inference being tested in the paragraph. Explain the reasoning required to reach the correct answer. Clarify why at least one incorrect option appears attractive but overgeneralizes, misreads tone, or introduces unsupported assumptions."
}

Rules:
- Paragraph and question MUST be separate fields.
- Paragraph should NOT contain the question.
- Question must NOT repeat the full paragraph.
- Only inference-based.
- Options must be close and logically confusing. 

Explanation must:
- Identify the implicit inference being tested.
- Mention the assumption required.
- Explain why at least one trap option overgeneralizes or misreads tone.

 Vocab: 10 questions  
CAT relevant abstract words
Each question MUST follow this exact structure:

{
  "question": "What does the word 'X' most closely mean?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
   "skill": "vocabulary",
   "explanation": "Explain the core conceptual meaning of the vocabulary word. Clarify why the correct option matches the intended nuance and contextual usage. Also explain why at least one incorrect option is close in meaning but semantically inaccurate or contextually inappropriate."
}

Rules:
- Question must clearly include the vocabulary word.
- Options must be conceptually close.
- Avoid obvious eliminations.
- One correct answer only.
Explanation must:
- Define the word in abstract conceptual terms.
- Explain why the correct option matches tone and usage.
- Explain why at least one incorrect option is close but semantically inaccurate.

RC1:
- Passage MUST be 450–550 words (strictly enforce length).
- Passage must be divided into 4–6 well-structured paragraphs.
- Each paragraph should represent a logical shift in argument.
- Topic must be abstract / philosophical / socio-economic / literary theory.
- Avoid storytelling style.

- 4 deep inference questions.
- At least 2 must be author-attitude or primary-purpose.
- At least 1 must be a trap-based inference.
- Questions must NOT be factual.

Explanation must:
- Refer to the author’s primary argument or structural shift.
- Explain the reasoning behind the correct inference.
- Identify the logical trap in at least one incorrect option (scope shift, tone exaggeration, reversal, etc.).
- Avoid quoting entire passage.

Each RC1 question MUST follow this structure:

{
  "question": "Deep inference question based on passage",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "skill": "inference",
  "explanation": "Explain the author's primary argument or structural movement relevant to the question. Clarify the reasoning that leads to the correct inference. Identify at least one logical trap in an incorrect option (such as scope distortion, tone exaggeration, reversal, or partial reading). Avoid quoting the entire passage."
}

RC2:
- Same standards as RC1.
- Different domain from RC1.

Explanation must:
- Refer to the author’s primary argument or structural shift.
- Explain the reasoning behind the correct inference.
- Identify the logical trap in at least one incorrect option (scope shift, tone exaggeration, reversal, etc.).
- Avoid quoting entire passage.

Each RC2 question MUST follow this structure:

{
  "question": "Deep inference question based on passage",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "skill": "inference",
  "explanation": "Explain the author's primary argument or structural movement relevant to the question. Clarify the reasoning that leads to the correct inference. Identify at least one logical trap in an incorrect option (such as scope distortion, tone exaggeration, reversal, or partial reading). Avoid quoting the entire passage."
}

Micro: 5 questions

CRITICAL RULE:
- These questions MUST be completely independent.
- They MUST NOT refer to RC1 or RC2 passages.
- Each Micro question must include its own short paragraph (120–180 words).
- Each must be standalone.

Micro paragraphs must:
- Contain 2 competing viewpoints.
- Include implicit author position.
- Avoid single-idea paragraphs.

Explanation must:
- Identify the central idea or logical progression.
- Explain how the correct option preserves coherence.
- Explain why one incorrect option breaks logical flow or introduces distortion.

Each question must follow this structure:

{
  "paragraph": "Independent 120–180 word paragraph.",
  "question": "Task based only on this paragraph.",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
   "skill": "logic",
   "explanation": "Identify the central logical thread or argumentative progression in the paragraph. Explain how the correct option preserves coherence or logical structure. Also explain why at least one incorrect option disrupts flow, introduces distortion, or misrepresents the author’s implicit stance."
}

Types Required:
- 2 Para Summary (trap-heavy)
- 1 Para Completion
- 1 Odd Sentence Out
- 1 Logical Flow / Inference

Rules:
- Difficulty must match CAT 2022–2023.
- No factual questions.
- Options must be close in scope, tone, or logical emphasis.
- Do NOT reuse ideas from RC1 or RC2.


All explanations must be written in a teaching tone suitable for a serious CAT aspirant.
They must demonstrate expert-level reasoning.
Avoid generic statements.
====================================
IMPORTANT
====================================

- Return ONLY valid JSON.
- No markdown.
- No explanations.
- No trailing commas.
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 14000
  })

  const content = completion.choices[0].message.content

  try {
  const parsed = JSON.parse(content)

  // ===== FORCE RC MULTI-PARAGRAPH FORMAT =====
  function formatPassage(passage) {
    if (!passage) return passage

    if (!passage.includes("\n\n")) {
      const words = passage.split(" ")
      const chunks = []

      for (let i = 0; i < words.length; i += 100) {
        chunks.push(words.slice(i, i + 120).join(" "))
      }

      return chunks.join("\n\n")
    }

    return passage
  }

  parsed.rc1.passage = formatPassage(parsed.rc1.passage)
  parsed.rc2.passage = formatPassage(parsed.rc2.passage)

  // ===== ENSURE MICRO HAS PARAGRAPH FIELD =====
parsed.micro.questions = parsed.micro.questions.map(q => {
  if (!q.paragraph) {
    return {
      paragraph: "Read the following paragraph carefully before answering.",
      ...q
    }
  }
  return q
})

console.log("MICRO SAMPLE:", parsed.micro.questions[0])

function validateWorkout(parsed) {

  if (!parsed.speed?.questions || parsed.speed.questions.length !== 10)
    throw new Error("Speed undergenerated")

  if (!parsed.vocab?.questions || parsed.vocab.questions.length !== 10)
    throw new Error("Vocab undergenerated")

  if (!parsed.rc1?.questions || parsed.rc1.questions.length !== 4)
    throw new Error("RC1 undergenerated")

  if (!parsed.rc2?.questions || parsed.rc2.questions.length !== 4)
    throw new Error("RC2 undergenerated")

  if (!parsed.micro?.questions || parsed.micro.questions.length !== 5)
    throw new Error("Micro undergenerated")

  // 🔴 NEW VALIDATION FOR PASSAGE LENGTH

  function wordCount(text) {
    return text.split(/\s+/).length
  }

  if (!parsed.rc1?.passage || wordCount(parsed.rc1.passage) < 420)
    throw new Error("RC1 passage too short")

  if (!parsed.rc2?.passage || wordCount(parsed.rc2.passage) < 420)
    throw new Error("RC2 passage too short")

}


validateWorkout(parsed)

return parsed

} catch (err) {
  console.error("Workout generation failed:", err)
  console.error("OpenAI raw response:", content)
  throw new Error("Workout generation failed")
}

}