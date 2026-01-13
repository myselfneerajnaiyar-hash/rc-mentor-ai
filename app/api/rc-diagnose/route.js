export const runtime = "nodejs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { passage, questions, studentAnswers } = body;

    if (!passage || !questions || !studentAnswers) {
      return new Response(
        JSON.stringify({ error: "Missing data for diagnosis." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formatted = questions.map((q, i) => {
      return `
Q${i + 1}: ${q.prompt}
Options:
${q.options.map((o, j) => `${j}. ${o}`).join("\n")}
Correct: ${q.correctIndex}
Student chose: ${studentAnswers[i] ?? "No answer"}
`;
    }).join("\n");

    const prompt = `
You are an expert CAT RC mentor.

You are given:
- A passage
- CAT-style questions on that passage
- Correct answers
- A student's answers

Your task:
1. Analyse the student's mistakes.
2. Identify which RC skills are weak (choose from: Main Idea, Inference, Tone, Author's Intent, Detail, Logic).
3. Detect the thinking pattern behind the mistakes.
4. Give ONE clear reading habit the student should build.
5. Suggest what the student should focus on next.

Return STRICT JSON in this format:

{
  "diagnosis": "mentor-style summary",
  "weakSkills": ["Tone", "Inference"],
  "pattern": "thinking pattern you observe",
  "advice": "one concrete reading habit",
  "nextFocus": ["Tone-based questions", "Inference questions"]
}

Do not include anything outside JSON.

PASSAGE:
${passage}

QUESTIONS & RESPONSES:
${formatted}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a CAT RC mentor who diagnoses reading behavior." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content.trim();

    // Try to parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback if model adds text around JSON
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: "Invalid AI output" };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Diagnosis failed." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
