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
2. Multiple MCQ questions based on it
3. The student's selected answers

Your job:

A) For EACH question:
- Determine if the student's answer is correct.
- Output in this exact format:

Q1 – Correct / Wrong  
Explanation:  
- Why the correct option is correct.  
- Why EACH of the other options is wrong.  
- If the student was wrong, explain why their chosen option is tempting but incorrect.

Do this for all questions.

B) After analyzing all questions, write a mentor-style diagnosis with:
- summary (2–3 lines on overall performance)
- strengths (3 bullet points)
- weaknesses (3 bullet points)
- nextFocus (1–2 lines on what the student should work on next)

The diagnosis MUST be based on the pattern of mistakes.

Use this JSON structure in your response:

{
  "solutions": [
    {
      "qno": 1,
      "status": "Correct" | "Wrong",
      "explanation": "..."
    }
  ],
  "summary": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "nextFocus": "..."
}

Here is the data:

PASSAGE:
${passage}

QUESTIONS (with correct answers embedded):
${JSON.stringify(questions, null, 2)}

STUDENT ANSWERS:
${JSON.stringify(answers, null, 2)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise educational diagnostician." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;

    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(raw.slice(jsonStart));

    return NextResponse.json(json);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Diagnosis failed" },
      { status: 500 }
    );
  }
}
