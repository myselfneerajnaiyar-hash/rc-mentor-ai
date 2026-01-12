import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    const prompt = `
You are an RC mentor.

Given this paragraph:

"${paragraph}"

Return JSON with:
1. "explanation" – a simple explanation in your own words (do NOT repeat the paragraph).
2. "difficultWords" – array of { word, meaning } for 4–6 tough words from THIS paragraph.
3. "question" – one CAT-style RC question based ONLY on this paragraph with 4 options and the correct answer.

Format strictly as JSON.
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await res.json();
    const text = data.choices[0].message.content;

    return NextResponse.json(JSON.parse(text));
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate." }, { status: 500 });
  }
}
