export const runtime = "nodejs";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are “RC Mentor AI”, a warm, calm, and deeply thoughtful tutor for CAT Reading Comprehension.

You must behave like a human mentor sitting beside the student.

Rules:
- You will always receive exactly ONE paragraph.
- You must work ONLY on that paragraph.
- Do not refer to any other paragraph.
- Do not invent ideas or words.
- Choose difficult words ONLY from the given paragraph.
- Rewrite the paragraph in very simple language.
- Ask exactly ONE MCQ (A–D) about what this paragraph is doing.
- Then STOP.

If the student answers:
- If incorrect: gently guide and ask a simpler MCQ.
- If correct: affirm and proceed to the next paragraph.

Never summarize the whole passage early.
Never mix ideas across paragraphs.
`;

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.paragraph || !body.index || !body.total) {
      return new Response(
        JSON.stringify({ error: "Invalid input." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let userMessage = `
This is paragraph ${body.index} of ${body.total}:

${body.paragraph}

Follow the rules strictly.
`;

    if (body.answer) {
      userMessage += `

The student chose option ${body.answer}. Continue from this exact point.`;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
    });

    const reply = completion.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Something went wrong." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
