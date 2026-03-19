export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req) {

  try {

    // -----------------------------
    // API CALL 1 — REASONING BUILDER
    // -----------------------------

    const reasoningPrompt = `
You are a CAT VARC expert.

Create 6 complex reasoning paragraphs (80–110 words).

Each paragraph must contain a clear logical structure such as:

* a widely held belief followed by a critique
* an observed phenomenon followed by explanation
* a claim followed by an important qualification

Avoid symmetrical "both sides equally valid" conclusions.

For each paragraph also identify the author's reasoning.

Return JSON:

{
 "items":[
  {
   "paragraph":"",
   "author_claim":"",
   "reasoning":""
  }
 ]
}

Return ONLY valid JSON.
`

    const reasoningCompletion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "Return valid JSON only." },
        { role: "user", content: reasoningPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const reasoningData = JSON.parse(
      reasoningCompletion.choices[0].message.content
    )

    const paragraphs = reasoningData.items

    // -----------------------------
    // API CALL 2 — QUESTION GENERATOR
    // -----------------------------

    const questionPrompt = `
You are a CAT VARC question setter.

Using the paragraphs below, generate questions.

Question distribution:
3 inference
2 main idea
1 tone

Rules:

* Questions must test reasoning, not factual recall.
* Correct answer must capture the author's reasoning.
* Create 3 distractors.

Distractor design:

1 strong trap → very close to correct answer but subtly incorrect
1 scope shift trap → broadens or narrows the author's claim
1 weaker trap → exaggerates or oversimplifies the argument

Avoid extreme wording like:

always
never
entirely
solely
inevitably

At least TWO incorrect options must remain plausible after first reading.

Return JSON:

{
 "micro":[
  {
   "paragraph":"",
   "question":"",
   "options":[],
   "correctIndex":0,
   "skill":""
  }
 ]
}

Paragraph data:

${JSON.stringify(paragraphs)}
`

    const questionCompletion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "Return valid JSON only." },
        { role: "user", content: questionPrompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    })

    const drill = JSON.parse(
      questionCompletion.choices[0].message.content
    )

    // -----------------------------
    // SHUFFLE OPTIONS
    // -----------------------------

    function shuffleQuestion(q) {

      const correctOption = q.options[q.correctIndex]

      const shuffled = [...q.options].sort(() => Math.random() - 0.5)

      const newIndex = shuffled.indexOf(correctOption)

      q.options = shuffled
      q.correctIndex = newIndex

      return q
    }

    drill.micro = drill.micro.map(shuffleQuestion)

    return NextResponse.json(drill)

  } catch (err) {

    console.error("Shadow drill error:", err)

    return NextResponse.json(
      { error: "Shadow drill failed" },
      { status: 500 }
    )

  }
}