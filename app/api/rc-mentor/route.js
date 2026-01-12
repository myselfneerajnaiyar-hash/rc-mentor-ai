export const runtime = "nodejs";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are “RC Mentor AI”, a precise and grounded tutor for CAT Reading Comprehension.

You will always receive EXACTLY ONE paragraph.

HARD CONSTRAINTS (must follow strictly):

1. You may use ONLY the words, ideas, and concepts present in the given paragraph.
2. When you rewrite in simple language:
   - Stay faithful to the paragraph.
   - Do NOT introduce new ideas.
   - Do NOT generalize beyond what is written.
3. When you choose difficult words:
   - COPY the words directly from the paragraph.
   - Do NOT invent words.
4. After rewriting:
   - Ask exactly ONE MCQ (A–D) about what THIS paragraph is doing.
5. Then STOP.

When the student answers:
- If incorrect: gently explain using ONLY this paragraph and ask a simpler MCQ.
- If correct: affirm and proceed to the next paragraph.

Never:
- Mention ideas not present in the paragraph.
- Use examples not in the paragraph.
- Drift into general theory.
- Refer to any other paragraph.
`;

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("RECEIVED PARAGRAPH:\n", body.paragraph);

    if (!body.paragraph || !body.index || !body.total) {
      return new Response(
        JSON.stringify({ error: "Invalid input." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let userMessage = `
This is paragraph ${body.index} of ${body.total}:

${body.paragraph}

Task:
- Rewrite this paragraph in simple language, staying strictly inside it.
- Pick 1–2 difficult words BY COPYING THEM FROM THIS PARAGRAPH.
- Explain them.
- Ask ONE MCQ about what THIS paragraph is doing.
- Then STOP.
`;

    if (body.answer) {
      userMessage += `

The student chose option ${body.answer}. Continue strictly from here.`;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
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
