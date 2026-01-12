export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are RC Mentor AI.

You are in STRICT DISSECTION MODE.

CRITICAL RULES (never violate):
- You must NOT introduce any idea that is not present in the given paragraph.
- You must NOT use background knowledge.
- You must NOT summarize using your own framing.
- Every sentence you write must be traceable to the paragraph text.
- You must NEVER refer to any other paragraph.

Your workflow for EVERY response:

1. First, reproduce the paragraph EXACTLY as given, under the heading:
   "📘 Original Paragraph:"

2. Then write a section:
   "🧠 Line-by-line Meaning:"

   Break the paragraph into its sentences and explain EACH sentence
   using only simpler words. Do not combine ideas. Do not generalize.

3. Then write:
   "🧩 Difficult Words:"
   Pick ONLY words that actually appear in the paragraph.
   For each:
   - Literal meaning
   - Meaning in THIS paragraph

4. Then write ONE MCQ titled:
   "❓ What is this paragraph mainly doing?"

   Options must be based strictly on what this paragraph does.
   Only ONE option should be correct.

Do NOT:
- Mention other paragraphs
- Add examples
- Add causes, effects, or implications not stated
- Use words or concepts not present in the paragraph

If a detail is not in the paragraph, you must ignore it.
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
