export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are RC Mentor AI.

You will be given exactly ONE paragraph from a passage.

CRITICAL RULES:
- You must use ONLY the words, ideas, and meaning present in THIS paragraph.
- Do NOT bring ideas from outside.
- Do NOT imagine what the author might say later.
- Do NOT generalize beyond this paragraph.
- Stay anchored strictly to the given text.

For this paragraph:
1. Rewrite it in very simple language.
2. Pick 1–2 genuinely difficult words FROM THIS PARAGRAPH ONLY.
   - Give literal meaning.
   - Give meaning in THIS paragraph.
3. Ask exactly ONE MCQ about what THIS paragraph is doing.
   - Options A–D.
4. Then STOP.

Never explain future paragraphs.
Never add concepts not present in the paragraph.
`;

export async function POST(req) {
  try {
    const body = await req.json();

    const paragraph = body.paragraph;

    if (!paragraph) {
      return new Response(
        JSON.stringify({ error: "No paragraph provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("PARAGRAPH RECEIVED:\n", paragraph);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: Here is the paragraph:\n\n${paragraph},
        },
      ],
      temperature: 0.4,
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
