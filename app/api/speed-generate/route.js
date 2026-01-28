import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { difficulty = "moderate", targetWPM = 220 } = await req.json();

    const systemPrompt = `
You are a CAT-level reading trainer.

Generate ONE compact but intellectually dense passage for speed reading practice.

Rules:
- Length: 220–280 words
- Style: CAT-like non-fiction (philosophy, sociology, economics, psychology, culture, science & society)
- No storytelling, no fiction.
- Use layered argumentation.
- Include 1–2 subtle shifts in stance.
- Avoid repetition.
- Difficulty: ${difficulty}

After the passage, generate exactly 3 comprehension questions:
1. Main idea
2. Inference
3. Author's tone or purpose

Each question must have:
- prompt
- 4 options (A–D)
- correctIndex (0–3)

Return JSON in this format:

{
  "passage": "...",
  "questions": [
    {
      "prompt": "...",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 2
    }
  ]
}
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a new speed-reading drill." },
        ],
      }),
    });

    const data = await res.json();
    const raw = data.choices[0].message.content;

    // Try to safely parse JSON from model output
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: extract JSON block
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid AI output");
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Speed API error:", e);
    return NextResponse.json(
      { error: "Failed to generate speed drill" },
      { status: 500 }
    );
  }
}
