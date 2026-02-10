import { NextResponse } from "next/server";
import OpenAI from "openai";

console.log("API KEY:", process.env.OPENAI_API_KEY);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function POST(req) {
  try {
    const { passage, questions, answers, times } = await req.json();

    // Derive meta-metrics for the mentor brain
    const qMeta = questions.map((q, i) => ({
      index: i,
      type: q.type || "unknown",
      correctIndex: q.correctIndex,
      studentAnswer: answers[i],
      timeSpent: times?.[i] ?? null,
      isCorrect: Number(answers[i]) === Number(q.correctIndex),
    }));

    const avgTime =
      qMeta.filter(q => q.timeSpent != null).reduce((s, q) => s + q.timeSpent, 0) /
      Math.max(1, qMeta.filter(q => q.timeSpent != null).length);

    const rushed = qMeta.filter(q => q.timeSpent != null && q.timeSpent < avgTime * 0.6);
    const overthought = qMeta.filter(q => q.timeSpent != null && q.timeSpent > avgTime * 1.6);

    const prompt = `
You are an expert CAT Reading Comprehension mentor.

You are given:
- A passage
- Questions with types (main-idea, inference, tone, detail, etc.)
- Student answers
- Time spent per question

Derived data:
Average time per question: ${avgTime.toFixed(1)} sec
Rushed questions: ${rushed.map(q => q.index).join(", ") || "None"}
Overthought questions: ${overthought.map(q => q.index).join(", ") || "None"}

For each question:
- Mark correct / wrong
- Explain why the correct option is right
- Explain why EACH wrong option is wrong
- If student is wrong, explain why their chosen option felt tempting

Then build a real mentor diagnosis:
- Identify reading style (rusher / overthinker / balanced / confused)
- Identify 2–3 root weaknesses (e.g., main idea drift, extreme-option bias, inference gaps)
- Use time patterns in your reasoning
- Give concrete drills

Return STRICT JSON ONLY:

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
      "temptation": "..."
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

TIME PER QUESTION:
${JSON.stringify(times, null, 2)}

QUESTION META:
${JSON.stringify(qMeta, null, 2)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise CAT mentor. You output strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content.trim();

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const enriched = {
      ...parsed,
      questionAnalysis: (parsed.questionAnalysis || []).map(q => ({
        ...q,
        type: questions[q.qIndex]?.type || "inference",
        timeSpent: times?.[q.qIndex] ?? null,
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
