import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { word } = await req.json();

    const prompt = `
You are a vocabulary coach for CAT-level English.

Given a word, return ONLY valid JSON with these fields:
- meaning (clear, concise definition)
- partOfSpeech
- usage (one natural example sentence)
- synonyms (array of 3–5)
- antonyms (array of 2–4)
- root (1-line etymology)

Word: ${word}

Return ONLY JSON. No explanation. No markdown.
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
        temperature: 0.3,
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
