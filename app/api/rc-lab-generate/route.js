import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function GET() {

  try {

    // STEP 1 — Generate a CAT-style difficult passage

    const passageRes = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
Write a CAT-level RC passage.

Rules:
- Academic tone
- 120–150 words
- Abstract topic (economics, philosophy, sociology, science)
- Use complex but natural academic language
- Include contrasting viewpoints
`
        }
      ]
    })

    const passage = passageRes.choices[0].message.content

    // STEP 2 — Create question

    const questionRes = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
Create a difficult CAT RC question.

Rules:
- inference or main idea
- avoid obvious wording
`
        },
        {
          role: "user",
          content: passage
        }
      ]
    })

    const question = questionRes.choices[0].message.content

    // STEP 3 — Generate correct answer

    const correctRes = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
Generate the correct answer option.

Rules:
- subtle
- not obviously balanced
`
        },
        {
          role: "user",
          content: passage + "\n\nQuestion: " + question
        }
      ]
    })

    const correctAnswer = correctRes.choices[0].message.content

    // STEP 4 — Generate traps by distorting the correct answer

    const trapRes = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
Create three incorrect options by distorting the correct answer.

Trap types:
1 exaggeration
2 scope distortion
3 attractive paraphrase but logically incorrect

Rules:
- must sound plausible
- avoid obviously wrong statements
`
        },
        {
          role: "user",
          content: `
Passage:
${passage}

Question:
${question}

Correct answer:
${correctAnswer}
`
        }
      ]
    })

    const traps = trapRes.choices[0].message.content

    // STEP 5 — AI student simulator

    const judgeRes = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
Act as a strong CAT aspirant.

Evaluate whether the wrong options are too easy to eliminate.
If yes, explain why.
`
        },
        {
          role: "user",
          content: `
Passage:
${passage}

Question:
${question}

Correct:
${correctAnswer}

Wrong options:
${traps}
`
        }
      ]
    })

    const evaluation = judgeRes.choices[0].message.content

    return NextResponse.json({
      passage,
      question,
      correctAnswer,
      traps,
      evaluation
    })

  } catch (err) {

    return NextResponse.json({
      error: err.message
    })

  }

}