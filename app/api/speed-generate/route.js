import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { level = "easy" } = await req.json();

    const levelPrompts = {
      easy: "Write a very simple, concrete passage using short sentences and everyday examples.",
      "easy+": "Write a passage with mild abstraction and clear structure.",
      moderate: "Write an academic-style RC passage similar to CAT level.",
      "moderate+": "Write a dense analytical passage with layered reasoning.",
      hard: "Write a complex conceptual passage with depth.",
      elite: "Write an elite CAT-level RC passage with abstract reasoning and tight logic."
    };

    const genres = [
      "science & technology",
      "history & civilization",
      "psychology & behavior",
      "economics & society",
      "nature & environment",
      "culture & arts",
      "business & innovation",
      "sports & human performance"
    ];

    const pickedGenre = genres[Math.floor(Math.random() * genres.length)];

    const systemPrompt = `
You are generating a speed-reading drill.

Difficulty: ${level}
Genre: ${pickedGenre}

${levelPrompts[level] || levelPrompts.easy}

Rules:
- The passage MUST match the genre: ${pickedGenre}.
- Avoid philosophy/cognition themes unless the genre is psychology.
- Write exactly 4 paragraphs (~100 words each, total ~400 words).
- Each paragraph should flow as part of one article.
- After each paragraph, create 1 EASY comprehension question.

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

    // Hard fallback so UI never breaks
    if (!match) {
      return NextResponse.json({
        paragraphs: [
          "Solar energy has moved from rooftops to entire cities. Advances in photovoltaic cells have reduced costs while increasing efficiency. What once required government subsidies now competes directly with fossil fuels. Countries with abundant sunlight are rapidly expanding solar farms, turning deserts and unused land into power hubs.",
          "Battery technology has followed a similar curve. Early storage systems were expensive and short-lived. Today, lithium-based solutions and emerging solid-state designs allow energy to be stored for hours or even days. This solves the core challenge of renewable power: intermittency.",
          "Urban planning is also adapting. Buildings are being designed to generate, store, and distribute their own electricity. Smart grids balance demand across neighborhoods, reducing wastage and outages. Energy is no longer just produced centrally—it flows dynamically.",
          "The future grid will be decentralized, adaptive, and clean. Instead of a single source feeding millions, millions of micro-sources will feed each other. This shift is not only technological but cultural, redefining how societies think about power."
        ],
        questions: [
          {
            q: "What has changed about solar energy?",
            options: [
              "It is more decorative",
              "It is cheaper and more efficient",
              "It only works in cities",
              "It needs more subsidies"
            ],
            correct: 1
          },
          {
            q: "What problem do batteries solve?",
            options: [
              "Energy theft",
              "Grid design",
              "Power intermittency",
              "Urban planning"
            ],
            correct: 2
          },
          {
            q: "How are buildings changing?",
            options: [
              "They are becoming taller",
              "They generate and manage energy",
              "They use more glass",
              "They reduce windows"
            ],
            correct: 1
          },
          {
            q: "What defines the future grid?",
            options: [
              "Centralization",
              "Manual control",
              "Decentralized flow",
              "Single power plants"
            ],
            correct: 2
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
    return NextResponse.json(
      { error: "Route failed", message: String(e) },
      { status: 500 }
    );
  }
}
