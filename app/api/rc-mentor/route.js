export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { paragraph, index, total, answer } = body;

    if (!paragraph) {
      return new Response(
        JSON.stringify({ error: "No paragraph provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const system = `
You are RC Mentor AI.

CRITICAL RULES:
- You MUST work ONLY on the text provided between <PARAGRAPH> tags.
- You are NOT allowed to introduce ideas, examples, or sentences that do not appear in that paragraph.
- Do NOT summarize what “usually happens” in such passages.
- Do NOT generalize.
- If a word or idea is not present in the paragraph, you must not mention it.
- Every rewrite must preserve the meaning of THIS paragraph only.

Your task for EACH paragraph:
1. Rewrite THIS paragraph in very simple language.
2. Pick 1–2 difficult words that actually appear in THIS paragraph.
3. Explain them (literal + contextual meaning).
4. Ask ONE MCQ only about what THIS paragraph is doing.

Never refer to any other paragraph.
Never assume what comes before or after.
`;

    const user = `
This is paragraph ${index} of ${total}.

<PARAGRAPH>
${paragraph}
</PARAGRAPH>
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
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
