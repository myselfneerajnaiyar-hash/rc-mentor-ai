import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { passage } = await req.json();

    const prompt = `
You are a CAT RC question setter.

From the passage below, create exactly 4 CAT-level MCQs.

Rules:
- Each question must have:
  - "prompt"
  - "options": an array of EXACTLY 4 meaningful answer choices
  - "correctIndex": 0–3
  - "type": one of "main-idea", "tone", "inference", "detail", "function", "application"
- All options must be complete, plausible, and mutually exclusive.
- Do NOT leave any option blank.
- Questions should test:
  - central idea
  - inference
  - tone
  - author's purpose / implication

Return ONLY valid JSON in this format:

{
  "questions": [
    {
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2,
      "type": "inference"
    }
  ]
}

PASSAGE:
${passage}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise CAT RC question setter." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content;

    const jsonStart = raw.indexOf("{");
    const parsed = JSON.parse(raw.slice(jsonStart));

    // Hard guard: remove any broken questions
    const cleaned = (parsed.questions || []).filter(
      q => q.options && q.options.length === 4
    );

    return NextResponse.json({ questions: cleaned });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "RC test generation failed" },
      { status: 500 }
    );
  }
}
