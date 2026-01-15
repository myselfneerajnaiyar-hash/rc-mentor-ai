import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { passage, questions, answers } = await req.json();

    const prompt = `
You are an expert CAT Reading Comprehension mentor.

You are given:
1. A passage
2. MCQ questions based on it (each has options and correctIndex)
3. The student's selected answers (index-wise)

Your job:

For EACH question:
- Decide if the student is Correct or Wrong.
- Explain:
  - Why the correct option is correct.
  - Why EACH wrong option is wrong.
  - If the student was wrong, explain why their chosen option feels tempting but is incorrect.

After all questions, give:
- summary (2–3 lines)
- strengths (3 bullets)
- weaknesses (3 bullets)
- nextFocus (1–2 lines)

Return STRICT JSON ONLY in this format (no extra text):

{
  "questionAnalysis": [
    {
      "qIndex": 0,
      "status": "correct" | "wrong",
      "correctExplanation": "...",
      "whyWrong": {
        "0": "...",
        "1": "...",
        "2": "...",
        "3": "..."
      },
      "temptation": "Explain why the student's chosen option felt attractive (if wrong, else empty string)"
    }
  ],
  "summary": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "nextFocus": "..."
}

PASSAGE:
${passage}

QUESTIONS:
${JSON.stringify(questions, null, 2)}

STUDENT ANSWERS:
${JSON.stringify(answers, null, 2)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise educational diagnostician. You output strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content.trim();

    // Safety: extract first JSON object if model adds noise
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

// 🔧 Inject type from original questions
const enriched = {
  ...parsed,
  questionAnalysis: (parsed.questionAnalysis || []).map(q => ({
    ...q,
    type: questions[q.qIndex]?.type || "inference",
  })),
};

return NextResponse.json(enriched);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Diagnosis failed" },
      { status: 500 }
    );
  }
}
