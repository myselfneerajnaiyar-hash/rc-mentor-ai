import { NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    if (!paragraph || typeof paragraph !== "string") {
      return NextResponse.json(
        { error: "Invalid paragraph" },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are an expert CAT RC mentor.

Given ONE paragraph from a passage, you must return:

1) A clear, student-friendly explanation (2–3 lines).
2) 4–5 difficult words from the paragraph with contextual meanings.
3) One CAT-style MCQ based ONLY on this paragraph:
   - Focus on meaning, inference, implication, or idea.
   - 4 options.
   - Provide correctIndex (0–3).
4) A simpler MCQ on the same idea (for wrong attempts):
   - 4 options.
   - Provide correctIndex.

Return STRICT JSON in exactly this shape:

{
  "explanation": "...",
  "difficultWords": [
    { "word": "...", "meaning": "..." }
  ],
  "primaryQuestion": {
    "prompt": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0
  },
  "easierQuestion": {
    "prompt": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 1
  }
}

Do NOT add any extra text outside JSON.
`;

    const userPrompt = `Paragraph:\n${paragraph}`;

    const openaiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const t = await openaiRes.text();
      return NextResponse.json(
        { error: "OpenAI error", detail: t },
        { status: 500 }
      );
    }

    const json = await openaiRes.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty OpenAI response" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON from OpenAI", raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
