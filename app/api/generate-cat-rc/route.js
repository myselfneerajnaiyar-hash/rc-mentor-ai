import { NextResponse } from "next/server";

export async function POST() {
  try {
    const prompt = `
You are a CAT exam RC expert.

Generate ONE CAT-level Reading Comprehension test.

PASSAGE:
- 350–450 words
- Abstract academic tone
- Topic: philosophy, sociology, linguistics, science & society
- Clear argument + counterargument

QUESTIONS:
- Exactly 4 questions
- Types: primary purpose, inference, tone, implication
- 4 options each
- One correct option

VOCAB:
- Extract 5 difficult words with meaning

Return STRICT JSON only in this format:

{
  "passages": [
    {
      "title": "Passage 1",
      "text": "full passage text",
      "questions": [
        {
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 1,
          "explanation": "Detailed CAT-style explanation"
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "word": "example",
      "meaning": "meaning",
      "context": "sentence"
    }
  ]
}
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
      }
    );

    const data = await response.json();
    const content = data.choices[0].message.content;

    return NextResponse.json(JSON.parse(content));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "CAT RC generation failed" },
      { status: 500 }
    );
  }
}
