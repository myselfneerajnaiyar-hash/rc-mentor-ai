import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    if (!paragraph || !paragraph.trim()) {
      return new Response(
        JSON.stringify({ error: "No paragraph provided" }),
        { status: 400 }
      );
    }

    const prompt = `
You are an RC mentor for CAT-level students.

You will be given ONE paragraph only.

Rules:
1. Do NOT rewrite or copy the paragraph again.
2. Base everything ONLY on the given paragraph.
3. Do NOT use information from outside this paragraph.
4. Do NOT mention other parts of the passage.
5. Output must be in this exact structure:

Simple Explanation:
(Explain the paragraph in very easy language, in 5–7 short lines.)

Key Ideas:
- Bullet 1
- Bullet 2
- Bullet 3

Difficult Words:
word – simple meaning
word – simple meaning

One RC-style Question:
A) option
B) option
C) option
D) option

Correct Answer: (letter) – short reason

Paragraph:
"""${paragraph}"""
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise reading comprehension tutor." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content;

    return new Response(JSON.stringify({ result: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
