import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { level = "easy" } = await req.json();

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
    const raw = data?.choices?.[0]?.message?.content || "";

    const match = raw.match(/\{[\s\S]*\}/);

    // Safe fallback so UI never breaks
    if (!match) {
      return NextResponse.json({
        paragraphs: [
          "Reading speed improves when the brain learns to process meaning in clusters rather than word by word. Skilled readers do not rush blindly; they anticipate structure, skim strategically, and confirm understanding quickly. With practice, comprehension becomes faster, not weaker. The goal of speed reading is not haste, but efficiency—absorbing ideas with clarity while reducing unnecessary pauses.",
          "Good readers form mental maps as they move through text. They identify topic sentences, track shifts in argument, and ignore decorative details. This allows them to move faster without losing coherence. Speed emerges from pattern recognition rather than mechanical acceleration.",
          "When readers slow down unnecessarily, they often lose the thread of meaning. Ironically, moderate speed can enhance focus by preventing wandering attention. The mind stays engaged because it must continuously predict and verify ideas.",
          "Speed training therefore aims to align eye movement, attention, and comprehension. It is not about racing across pages but about building fluency. As fluency improves, both confidence and retention rise together."
        ],
        questions: [
          {
            q: "What is the goal of speed reading?",
            options: [
              "To rush through text",
              "To ignore meaning",
              "To read efficiently with understanding",
              "To skip structure"
            ],
            correct: 2
          },
          {
            q: "How do good readers move faster?",
            options: [
              "By memorizing every word",
              "By recognizing structure and patterns",
              "By skipping paragraphs",
              "By reading aloud"
            ],
            correct: 1
          },
          {
            q: "Why can slow reading reduce comprehension?",
            options: [
              "It tires the eyes",
              "It increases page count",
              "It breaks attention and flow",
              "It makes words longer"
            ],
            correct: 2
          },
          {
            q: "What does speed training primarily build?",
            options: [
              "Haste",
              "Fluency",
              "Memory tricks",
              "Vocabulary"
            ],
            correct: 1
          }
        ]
      });
    }

    try {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        error: "JSON parse failed",
        raw: match[0]
      });
    }
  } catch (e) {
    return NextResponse.json({
      error: "Route failed",
      message: String(e)
    }, { status: 500 });
  }
}
