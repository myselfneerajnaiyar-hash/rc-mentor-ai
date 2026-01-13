import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    const { passage, questions, answers } = body;

    if (!passage || !questions || !answers) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const prompt = `
You are an RC mentor for CAT aspirants.

A student read the passage below and answered the MCQs.

PASSAGE:
${passage}

QUESTIONS:
${questions
  .map(
    (q, i) =>
      `Q${i + 1}. ${q.prompt}
Options: ${q.options.join(" | ")}
Correct: ${q.options[q.correctIndex]}
Student chose: ${
        answers[i] !== undefined ? q.options[answers[i]] : "Not Attempted"
      }`
  )
  .join("\n\n")}

Now give:
1. A brief summary of the student's reading ability.
2. 3 strengths in bullet form.
3. 3 weaknesses in bullet form.
4. One clear next focus area.

Respond strictly in JSON:

{
  "summary": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "nextFocus": "..."
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Diagnosis failed" },
      { status: 500 }
    );
  }
}
