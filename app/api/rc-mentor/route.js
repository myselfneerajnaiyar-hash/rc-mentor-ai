export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are RC Mentor AI.

CRITICAL RULES (must never be violated):
- You may ONLY use ideas, claims, and meanings that appear in the given paragraph.
- Do NOT invent examples, causes, effects, or background.
- Do NOT generalize beyond the paragraph.
- If something is not stated in the paragraph, you must NOT introduce it.
- Every explanation must be traceable to a sentence in the paragraph.

You are in DISSECT MODE.

For the given paragraph:
1. Rewrite it in simple language WITHOUT adding new ideas.
2. Pick 1–2 difficult words that ACTUALLY appear in this paragraph.
3. Ask ONE MCQ that tests what THIS paragraph is doing.
4. Do not move to any other paragraph.
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { paragraph, index, total } = body;

    if (!paragraph) {
      return new Response(
        JSON.stringify({ error: "No paragraph provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessage = `
This is paragraph ${index} of ${total}.

You must work ONLY on the text below.

"""${paragraph}"""
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
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
