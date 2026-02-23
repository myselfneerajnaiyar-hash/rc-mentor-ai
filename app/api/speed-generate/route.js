import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { level = "easy", wpm = 180 } = await req.json();

    // 🔥 Adaptive Mapping
    let mappedLevel = "easy";

    if (level === "upgrade") {
      if (wpm < 200) mappedLevel = "moderate+";
      else if (wpm < 240) mappedLevel = "hard";
      else mappedLevel = "elite";
    }

    if (level === "maintain") {
      mappedLevel = "moderate";
    }

    if (level === "stabilize") {
      mappedLevel = "easy+";
    }

    const levelPrompts = {
      easy: `
Write a very simple, concrete passage.
Short sentences.
Everyday vocabulary.
Direct factual questions.
`,

      "easy+": `
Write a mildly analytical passage.
Clear structure.
Light abstraction.
Questions test basic inference.
`,

      moderate: `
Write an academic-style passage similar to lower CAT level.
Moderate abstraction.
Questions test reasoning and main idea.
`,

      "moderate+": `
Write a dense analytical passage.
Layered reasoning.
Subtle transitions.
Questions test inference and argument flow.
`,

      hard: `
Write a complex conceptual passage.
Advanced vocabulary.
Longer sentences.
Implicit assumptions.
Questions must test inference, tone and structure.
`,

      elite: `
Write an elite CAT-level passage.
Abstract reasoning.
Dense logical structure.
Advanced academic vocabulary.
Questions must test tone, logical flaws, and deep inference.
`
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

    const pickedGenre =
      genres[Math.floor(Math.random() * genres.length)];

    const systemPrompt = `
You are generating an adaptive speed-reading drill.

Target WPM: ${wpm}
Difficulty Level: ${mappedLevel}
Genre: ${pickedGenre}

${levelPrompts[mappedLevel]}

Rules:
- The passage MUST match the genre: ${pickedGenre}.
- Write exactly 4 paragraphs (~100 words each).
- The paragraphs must flow as one continuous article.
- Question difficulty MUST match the difficulty level.
- For hard and elite levels, test inference, tone, logic, and argument structure.
- Do NOT make questions trivial.

Return ONLY valid JSON in this format:
{
  "paragraphs": ["p1", "p2", "p3", "p4"],
  "questions": [
    {
      "q": "Question on para 1",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correct": 0
    },
    {
      "q": "Question on para 2",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correct": 1
    },
    {
      "q": "Question on para 3",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correct": 2
    },
    {
      "q": "Question on para 4",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correct": 3
    }
  ]
}
`;

    const r = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: systemPrompt }],
          temperature: 0.7
        })
      }
    );

    const data = await r.json();
    const raw =
      data?.choices?.[0]?.message?.content || "";

    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json({
        error: "Invalid AI response",
        raw
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