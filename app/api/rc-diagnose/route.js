import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { passage, questions, answers } = await req.json();

    if (!passage || !questions || !answers) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const prompt = `
You are a CAT Reading Comprehension mentor.

A student attempted a test on the following passage:

PASSAGE:
${passage}

QUESTIONS (with correctIndex already embedded):
${JSON.stringify(questions, null, 2)}

STUDENT ANSWERS (index -> chosen option):
${JSON.stringify(answers, null, 2)}

Your task:

1. For EACH question:
   - Say whether the student was correct or wrong.
   - Mention:
     - The student's answer (option text)
     - The correct answer (option text)
   - Explain:
     - Why the correct option is correct.
     - Why EACH incorrect option is wrong or misleading.

2. After the per-question analysis, give:
   - A brief overall summary of the student's RC ability.
   - 3 bullet-point strengths.
   - 3 bullet-point weaknesses.
   - One clear "Next Focus" recommendation.

Return STRICT JSON in this format:

{
  "perQuestionReview": [
    {
      "question": "...",
      "yourAnswer": 1,
      "correctAnswer": 1,
      "status": "correct",
      "explanation": {
        "correctWhy": "...",
        "othersWhyWrong": {
          "0": "...",
          "2": "...",
          "3": "..."
        }
      }
    }
  ],
  "summary": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "nextFocus": "..."
}

Do NOT include anything outside JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert CAT RC mentor." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Diagnosis failed" },
      { status: 500 }
    );
  }
}
