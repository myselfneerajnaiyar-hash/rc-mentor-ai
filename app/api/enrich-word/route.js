import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { word, meaning } = await req.json();

    const prompt = `
You are a vocabulary coach.
Given a word and its meaning, return a JSON with:
- partOfSpeech
- usage (one example sentence)
- synonyms (array)
- antonyms (array)
- root (etymology in 1 line)

Word: ${word}
Meaning: ${meaning}

Return ONLY valid JSON.
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: Bearer ${process.env.OPENAI_API_KEY},
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    const data = await openaiRes.json();
    const text = data.choices[0].message.content;

    return NextResponse.json(JSON.parse(text));
  } catch (e) {
    console.error("API enrich error", e);
    return NextResponse.json({ error: "Failed to enrich" }, { status: 500 });
  }
}
