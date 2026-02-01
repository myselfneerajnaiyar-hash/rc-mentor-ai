import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { difficulty = "CAT", passages = 1 } = await req.json();

  const prompt = `
Generate ${passages} CAT-level Reading Comprehension passage(s).

For each passage:
- 250–350 words
- Abstract, analytical tone (CAT VARC level)
- Topics: philosophy, sociology, science, history, economics

For EACH passage generate:
- passage_id
- title
- text
- 4 questions

Each question must have:
- stem
- 4 options
- correctIndex (0-3)
- detailed explanation

Also return:
- vocabulary: list of difficult words with meanings
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return NextResponse.json({
    raw: completion.choices[0].message.content,
  });
}
