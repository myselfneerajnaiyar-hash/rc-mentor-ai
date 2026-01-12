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
READ CAREFULLY. YOU MUST OBEY ALL RULES.

You are given Paragraph ${index} of ${total}.

You MUST do this in order:

1️⃣ First, copy the paragraph BELOW *exactly* as-is.
- Same words
- Same punctuation
- Same line breaks
- No corrections
- No paraphrasing

Print it under this heading:

📘 ORIGINAL PARAGRAPH
======================

2️⃣ Only AFTER that, do the analysis strictly based on what you just printed.

Use this structure:

🧠 Line-by-line Meaning:
- Break the paragraph into its actual sentences.
- Explain each sentence in simpler words.
- Do NOT add anything not present.

🧩 Difficult Words:
- Choose only words that appear in the paragraph.
- Give literal meaning.
- Give meaning in THIS paragraph.

❓ What is this paragraph mainly doing?
- 4 options
- Only 1 correct
- All options must be grounded in the paragraph.

You are FORBIDDEN to:
- Introduce new ideas
- Refer to any other paragraph
- Use background knowledge
- Invent examples
- Generalize

--- START PARAGRAPH ---
${paragraph}
--- END PARAGRAPH ---
`;
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
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
