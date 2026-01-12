import OpenAI from "openai";

export const runtime = "edge";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const paragraph = body.paragraph || "";

    if (!paragraph.trim()) {
      return new Response(
        JSON.stringify({ result: "No paragraph received." }),
        { status: 200 }
      );
    }

    const prompt = `
You are an RC mentor for CAT students.

Given this paragraph, do NOT copy it again.
Explain it simply in 3–4 lines in plain language.

Paragraph:
${paragraph}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const result = completion.choices[0].message.content;

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ result: "Server error: " + err.message }),
      { status: 500 }
    );
  }
}
