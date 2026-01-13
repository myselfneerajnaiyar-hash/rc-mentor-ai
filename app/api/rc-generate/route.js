import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { themeHint } = await req.json();

    const prompt = `
You are generating a CAT-level Reading Comprehension passage.

Theme inspiration:
"${themeHint}"

STRICT STRUCTURAL RULES:
- The passage MUST have exactly 4 paragraphs.
- Each paragraph must be 90–130 words.
- Each paragraph must play a distinct role:
  1. Introduce the core concept or debate
  2. Deepen it with reasoning or example
  3. Add complexity, counterpoint, or tension
  4. Conclude with implications or evaluation
- Separate paragraphs using a blank line.
- Do NOT merge ideas into one block.

After the passage, generate 4–5 CAT-style MCQs based on the FULL passage:
- At least one main-idea question
- One tone/attitude question
- One inference question
- One application or implication question

Each question must have:
- prompt
- 4 options
- correctIndex

Return STRICT JSON in this format only:

{
  "passage": "Para 1...\\n\\nPara 2...\\n\\nPara 3...\\n\\nPara 4...",
  "questions": [
    {
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2
    }
  ]
}

Do not include any extra commentary outside the JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert CAT RC content creator." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    });

    const text = completion.choices[0].message.content;

    // Safety: extract JSON even if model adds stray text
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    const json = JSON.parse(text.slice(start, end));

    return NextResponse.json(json);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not generate RC" },
      { status: 500 }
    );
  }
}
