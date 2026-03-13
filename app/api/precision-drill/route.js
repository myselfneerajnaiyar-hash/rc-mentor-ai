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
    const limit = 1

    if (attemptCount >= limit) {

      return NextResponse.json({
        limitReached: true,
        message: "Precision limit reached"
      })

    }

    // ===== GENERATE DRILL =====
const prompt = `
You are a senior CAT VARC examiner designing difficult RC reasoning drills.

Weak skills to target:
${weakSkills.join(", ")}

IMPORTANT EXAM RULES

1. The correct answer must NEVER be explicitly stated in the passage.
2. The passage must contain ambiguity so that the student must infer the answer.
3. Do NOT include sentences that directly reveal the answer such as:
   - "the author's tone is..."
   - "this shows the author agrees..."
   - "this paragraph functions to..."
4. The passage should only contain evidence. The student must reason to reach the answer.

QUESTION DESIGN RULES

Questions must test real CAT reasoning patterns such as:
- inference
- author agreement
- function
- tone
- assumption
- next paragraph prediction

Do NOT generate grammar questions.

Do NOT create questions on:
- subject verb agreement
- sentence correction
- punctuation
- grammar errors

OPTION DESIGN (VERY IMPORTANT)

Each question must have:

1 correct answer
3 trap answers

Trap answers should mimic real CAT traps such as:
- extreme interpretation
- outside scope
- partially correct but distorted
- reverse logic

Avoid obviously wrong options.

 explanation object containing:

{
 "reasoning": "step-by-step explanation of how the correct answer is derived",
 "why_correct": "why the correct option matches the author's reasoning",
 "trap_analysis": [
   {
     "option": "A",
     "trap_type": "extreme statement / outside scope / distortion",
     "reason": "why students commonly fall for this trap"
   }
 ]
}


SESSION STRUCTURE

Generate 8 micro drills.

Each drill must contain:

paragraph
question
options (4)
correctIndex
skill

explanation: {
  reasoning: "",
  why_correct: "",
  traps: [
    {
      optionIndex: 0,
      trap_type: "",
      reason: ""
    }
  ]
}

Then generate:

1 mini RC passage (250–300 words)

Create 2 questions testing inference,tone or function.

Return JSON exactly in this format:

{
 "micro": [],
 "mini_rc": {
  "passage": "",
  "questions": []
 }
}

Return ONLY valid JSON.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 3500
    })

    let drill

try {

  const raw = completion.choices[0].message.content

  drill = JSON.parse(raw)

} catch (err) {

  console.error("AI returned invalid JSON:", completion.choices[0].message.content)

  return NextResponse.json(
    { error: "AI generation failed. Please retry." },
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