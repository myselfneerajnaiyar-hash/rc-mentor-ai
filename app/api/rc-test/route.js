export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { passage } = await req.json();

    const prompt = `
You are a CAT (IIM) Reading Comprehension question setter.

Your job is to generate EXACTLY 4 CAT-level MCQs from the passage below.

These must feel like real CAT questions:
- Non-obvious
- Elimination-based
- With tempting but wrong options
- Each wrong option should reflect a common misreading of the passage
- The correct option must be defensible only by careful reading

Create this exact mix:

1. One MAIN-IDEA question  
   → About the author’s central argument (not topic)

2. One TONE / ATTITUDE question  
   → About the author’s stance, posture, or evaluative attitude

3. One INFERENCE question  
   → Must require reading between the lines  
   → Answer should NOT be directly stated

4. One DETAIL or FUNCTION question  
   → About the role of a specific line, paragraph, or example

Rules:

- Each question object MUST contain:
  - "prompt"
  - "options": exactly 4 complete options
  - "correctIndex": 0–3
  - "type": strictly one of:
    "main-idea", "tone", "inference", "detail", "function"

- Every option must be:
  - Grammatically complete
  - Plausible
  - Mutually exclusive

- At least TWO wrong options per question must be:
  - Subtly attractive
  - Based on partial truth or surface reading

- Do NOT make questions obvious.
- Do NOT restate lines directly.
- Do NOT make factual recall questions.

Return ONLY valid JSON:

{
  "questions": [
    {
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2,
      "type": "inference"
    }
  ]
}

PASSAGE:
${passage}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert CAT RC question setter. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
    });

    const raw = completion.choices[0].message.content || "";

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;

    if (start === -1 || end === -1) {
      throw new Error("Model did not return JSON");
    }

    const parsed = JSON.parse(raw.slice(start, end));

    // Normalize and enforce types at runtime
    const questions = (parsed.questions || []).map(q => {
      const rawType = (q.type || "").toLowerCase();

      let type = "inference";
      if (rawType.includes("main")) type = "main-idea";
      else if (rawType.includes("tone")) type = "tone";
      else if (rawType.includes("detail")) type = "detail";
      else if (rawType.includes("function")) type = "function";
      else if (rawType.includes("infer")) type = "inference";

      return {
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        type,
      };
    });

    return NextResponse.json({ questions });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "RC test generation failed" },
      { status: 500 }
    );
  }
}
