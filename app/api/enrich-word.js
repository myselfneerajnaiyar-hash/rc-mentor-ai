import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const { word, meaning } = await req.json();

  const prompt = `
For the word "${word}" meaning "${meaning}", return JSON with:
- partOfSpeech
- usage (one natural sentence)
- synonyms (array of 3)
- antonyms (array of 2)
- root (short etymology)

Respond ONLY in valid JSON.
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const text = completion.choices[0].message.content;

  return NextResponse.json(JSON.parse(text));
}
