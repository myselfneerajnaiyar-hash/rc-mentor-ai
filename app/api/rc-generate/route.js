import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { themeHint } = await req.json();

    const prompt = `
Create a new CAT-level Reading Comprehension passage on a theme similar to this:
"${themeHint}"

Requirements:
- Length: 350–450 words
- Tone: academic / analytical
- Difficulty: CAT-level
- Topic should be conceptually similar, not the same

Then generate 4 MCQ questions like CAT RC:
- Main idea
- Tone/attitude
- Inference
- Application or implication

Return strictly in JSON like:

{
  "passage": "...",
  "questions": [
    {
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    const json = JSON.parse(text);

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: "Could not generate RC" },
      { status: 500 }
    );
  }
}
