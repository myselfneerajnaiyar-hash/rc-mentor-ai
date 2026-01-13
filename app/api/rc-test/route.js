export const runtime = "nodejs";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert CAT Reading Comprehension examiner.

You will be given a full RC passage.

Your task:
- Generate 4 CAT-style RC questions based strictly on the passage.
- Each question must test comprehension, inference, tone, or central idea.
- Avoid trivial or factual questions.
- Each question must have:
  - A clear prompt
  - 4 options
  - Only ONE correct option
  - An explanation for why the correct option is right

Return ONLY valid JSON in this format:

{
  "questions": [
    {
      "prompt": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct."
    }
  ]
}

Rules:
- Do not invent facts not in the passage.
- Base every question strictly on the passage.
- Match CAT-level difficulty.
- Do not include any extra text outside JSON.
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { passage } = body;

    if (!passage || typeof passage !== "string") {
      return new Response(
        JSON.stringify({ error: "No passage provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate RC questions for this passage:\n\n${passage}`,
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0].message.content;

    // Safety: ensure we return valid JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from model", raw }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Something went wrong." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
