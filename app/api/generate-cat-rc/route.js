import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { difficulty = "CAT", passages = 1 } = await req.json();
const prompt = `
You are an exam content generator for CAT VARC.

Return ONLY valid JSON. No markdown. No explanations outside JSON.

Generate EXACTLY ${passages} passages.

Schema:
{
  "passages": [
    {
      "id": "string",
      "title": "string",
      "text": "string",
      "questions": [
        {
          "id": "string",
          "stem": "string",
          "options": ["string", "string", "string", "string"],
          "correctIndex": number,
          "explanation": "string"
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "word": "string",
      "meaning": "string"
    }
  ]
}

Rules:
- Generate EXACTLY ${passages} passages
- Each passage MUST have exactly 4 questions
- CAT-level difficulty
- Abstract / philosophy / science / society topics
- correctIndex must be 0–3
- Explanation must justify why correct and why others are wrong
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

 const content = completion.choices[0].message.content;

let data;
try {
  data = JSON.parse(content);
} catch (err) {
  return NextResponse.json(
    { error: "Invalid JSON from OpenAI", raw: content },
    { status: 500 }
  );
}

return NextResponse.json(data);
}
