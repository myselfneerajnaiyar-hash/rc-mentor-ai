import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    const prompt = `
You are an RC mentor.

Given the paragraph below, do NOT repeat it.

Only return:
1. A simple explanation in easy language (5–6 lines)
2. One CAT-style question based ONLY on this paragraph
3. Four options (A–D)
4. The correct answer

Paragraph:
"""${paragraph}"""
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content;

    return Response.json({ result });
  } catch (err) {
    return Response.json(
      { result: "API error: " + err.message },
      { status: 500 }
    );
  }
