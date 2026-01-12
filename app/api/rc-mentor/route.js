import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const paragraph = body.paragraph;

    if (!paragraph) {
      return NextResponse.json({ error: "No paragraph provided" }, { status: 400 });
    }

    const prompt = `
You are an RC mentor.

Given this paragraph:

"${paragraph}"

Return ONLY valid JSON in this exact structure:

{
  "explanation": "simple explanation in your own words",
  "difficultWords": [
    { "word": "word1", "meaning": "meaning1" },
    { "word": "word2", "meaning": "meaning2" }
  ],
  "question": "One CAT-style RC question with 4 options and the correct answer mentioned at the end"
}

Do NOT repeat the paragraph.
Do NOT add any extra text outside JSON.
`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: Bearer ${process.env.OPENAI_API_KEY},
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content;

    if (!raw) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON from AI", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: "Route crashed", details: String(err) },
      { status: 500 }
    );
  }
}
