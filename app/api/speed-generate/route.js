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
  const raw = data.choices?.[0]?.message?.content || "";

  // Try to extract the first JSON block from the response
  const match = raw.match(/\{[\s\S]*\}/);

 if (!match) {
  return NextResponse.json({
    text: "Reading speed improves when the brain learns to process meaning in clusters rather than word by word. Skilled readers do not rush blindly; they anticipate structure, skim strategically, and confirm understanding quickly. With practice, comprehension becomes faster, not weaker. The goal of speed reading is not haste, but efficiency—absorbing ideas with clarity while reducing unnecessary pauses.",
    questions: [
      {
        q: "What is the main idea of the paragraph?",
        options: [
          "Speed reading sacrifices understanding",
          "Good readers rush through text",
          "Speed reading focuses on efficient comprehension",
          "Fast reading ignores structure"
        ],
        correct: 2
      }
    ]
  });
}

  try {
    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: "JSON parse failed", raw: match[0] },
      { status: 500 }
    );
  }
}
