import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { word } = await req.json();

    if (!word) {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Return strictly valid JSON. No markdown. No backticks."
        },
        {
          role: "user",
          content: `
Provide meaning, partOfSpeech, word root (if known), 2 synonyms, 2 antonyms, and one usage sentence.
Word: ${word}

Return STRICT JSON only:
{
  "meaning": "",
  "partOfSpeech": "",
  "root": "",
  "synonyms": [],
  "antonyms": [],
  "usage": ""
}
`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const data = JSON.parse(
      completion.choices[0].message.content
    );

    return NextResponse.json(data);

  } catch (err) {
    console.log("Enrich error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}