import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { word, meaning } = await req.json();

    const prompt = `
You are a vocabulary coach.
Given a word and its meaning, return ONLY valid JSON with:
- partOfSpeech
- usage (one example sentence)
- synonyms (array)
- antonyms (array)
- root (etymology in 1 line)

Word: ${word}
Meaning: ${meaning}

Return ONLY JSON.
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.4,
      }),
    });

    const raw = await openaiRes.json();

    let text = "{}";
    try {
      text =
        raw.output?.[0]?.content?.find(c => c.type === "output_text")?.text ||
        "{}";
    } catch {}

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("API enrich error", e);
    return NextResponse.json({ error: "Failed to enrich" }, { status: 500 });
  }
}
