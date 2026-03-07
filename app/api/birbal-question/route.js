import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req) {

  try {

    const body = await req.json()

    const passage = body.passage || ""
const question = body.question || {}
const chat = body.chat || []

const prompt = question.prompt || ""
const options = question.options || []
const correctIndex = question.correctIndex ?? 0

    const completion = await openai.chat.completions.create({

      model: "gpt-4.1-mini",

      messages: [

        {
          role: "system",
          content: `
You are Birbal, a sharp and insightful CAT Reading Comprehension mentor.

Your job is to help students understand RC questions.

Explain things clearly and logically.

Use this structure:

1️⃣ Correct Logic  
Explain why the correct answer works.

2️⃣ Trap Logic  
Explain why the wrong option feels tempting.

3️⃣ Passage Proof  
Point to the reasoning or line in the passage.

4️⃣ Quick Lesson  
Give one small RC strategy tip.

Rules:
- Do NOT analyze student performance or accuracy.
- Focus only on this question.
- Be concise and clear.
`
        },

        {
          role: "system",
          content: `
PASSAGE
${passage}

QUESTION
${prompt}

OPTIONS
${options.length ? options.map((o,i)=>`${i}. ${o}`).join("\n") : "No options provided"}

CORRECT ANSWER
${correctIndex}
`
        },

        ...chat

      ]

    })

    const reply = completion.choices[0].message.content

    return NextResponse.json({ reply })

  }

  catch (err) {

    console.error("Birbal Question error:", err)

    return NextResponse.json({
      reply: "Birbal could not analyze this question."
    })

  }

}