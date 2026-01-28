import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { level } = await req.json();

    const topicPool = [
      "urbanization and social change",
      "technology and human attention",
      "education and social mobility",
      "climate and everyday behavior",
      "culture and identity",
      "work in the digital age",
      "science and public trust",
    ];

    const topic = topicPool[Math.floor(Math.random() * topicPool.length)];

    const prompt = `
Create one reading passage of about 400 words on the topic "${topic}".
Split it into exactly FOUR paragraphs of roughly equal length.

After each paragraph, create ONE very easy comprehension question
based only on that paragraph.

Each question must have:
- q: the question
- options: 4 simple options
- correct: index (0-3)

Return JSON strictly in this format:

{
  "paragraphs": [
    { "text": "...", "question": { "q": "...", "options": ["A","B","C","D"], "correct": 0 } },
    { "text": "...", "question": { ... } },
    { "text": "...", "question": { ... } },
    { "text": "...", "question": { ... } }
  ]
}

Keep language CAT-style but easy.
Questions should be factual and local to that paragraph.
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });

    const data = await res.json();
    const text = data.choices[0].message.content;

    const jsonStart = text.indexOf("{");
    const json = JSON.parse(text.slice(jsonStart));

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
