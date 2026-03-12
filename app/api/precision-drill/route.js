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
You are a senior CAT VARC examiner.

Create a precision training drill.

Weak skills to target:
${weakSkills.join(", ")}

SESSION STRUCTURE

8 micro drills

Each drill must contain:

paragraph (80-120 words)
question
options (4)
correctIndex
skill
explanation (80-120 words)

Then generate:

1 mini RC passage
length: 250-300 words

Create 2 inference questions on the passage.

Return JSON in this structure:

{
 "micro": [],
 "mini_rc": {
  "passage": "",
  "questions": []
 }
}

Return ONLY JSON.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
      max_tokens: 3500
    })

    const drill = JSON.parse(completion.choices[0].message.content)

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