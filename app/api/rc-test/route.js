export const dynamic = "force-dynamic";
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

From the passage below, create exactly 4 CAT-level MCQs in this exact mix:

1. One "main-idea" question – about the central argument of the passage  
2. One "tone" question – about the author's attitude or stance  
3. One "inference" question – requires reading between the lines  
4. One "detail" or "function" question – based on a specific line or role in the passage  

Each question’s content must match its declared "type".
For example:
- A "tone" question must ask about attitude, stance, or mood.
- A "main-idea" question must ask about the central argument.
- An "inference" question must require implied meaning.
- A "detail" or "function" question must refer to a specific part or role.

If any question does not genuinely match its "type", rewrite it before returning.

Rules:
- Each question MUST include:
- "prompt"
- "options": exactly 4 options
- "correctIndex": 0-3
- "type": strictly one of:
  "main-idea", "tone", "inference", "detail", "function", "application"

You are NOT allowed to return any question without "type".
If any question is missing "type", rewrite it before returning.
Every object inside "questions" must contain "type".
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

// Enforce type at runtime so frontend always gets it
const questions = (parsed.questions || []).map(q => {
  const raw = (q.type || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  let finalType = raw;

  if (raw.includes("main")) finalType = "main-idea";
  else if (raw.includes("tone")) finalType = "tone";
  else if (raw.includes("detail")) finalType = "detail";
  else if (raw.includes("function")) finalType = "function";
  else if (raw.includes("application")) finalType = "application";
  else if (!allowedTypes.includes(raw)) finalType = "inference";

  return {
    ...q,
    type: finalType,
  };
});
return NextResponse.json({ questions });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "RC test generation failed" },
      { status: 500 }
    );
  }
}
