import { NextResponse } from "next/server";

export async function POST(req) {
  const { level } = await req.json();

  const levelPrompts = {
    easy: "Write a very simple, concrete 400-word passage using short sentences and everyday examples.",
    "easy+": "Write a 400-word passage with mild abstraction and clear structure.",
    moderate: "Write a 400-word academic-style RC passage similar to CAT level.",
    "moderate+": "Write a dense 400-word analytical passage with layered reasoning.",
    hard: "Write a complex 400-word philosophical or sociological passage.",
    elite: "Write an elite CAT-level RC passage with abstract reasoning and tight logic."
  };

  const systemPrompt = `
${levelPrompts[level] || levelPrompts.easy}

Structure:
- Divide into exactly 4 paragraphs (~100 words each).
- After each paragraph, create 1 easy comprehension question.

Return ONLY valid JSON in this format:
{
  "paragraphs": ["p1", "p2", "p3", "p4"],
  "questions": [
    { "q": "Question on para 1", "options": ["A","B","C","D"], "correct": 0 },
    { "q": "Question on para 2", "options": ["A","B","C","D"], "correct": 1 },
    { "q": "Question on para 3", "options": ["A","B","C","D"], "correct": 2 },
    { "q": "Question on para 4", "options": ["A","B","C","D"], "correct": 3 }
  ]
}
`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: systemPrompt }],
      temperature: 0.7
    })
  });

  const data = await r.json();
  const text = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "AI response invalid" },
      { status: 500 }
    );
  }
}
