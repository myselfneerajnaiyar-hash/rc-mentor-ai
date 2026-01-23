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

There are 12 canonical CAT DNA question types:

1. main-idea  
2. tone  
3. inference  
4. detail  
5. function  
6. author-agreement (what the author would agree/disagree with)  
7. purpose  
8. assumption  
9. strengthen  
10. weaken  
11. application (apply idea to a new situation)  
12. next-paragraph (what the author is likely to discuss next)

Rules:

- Generate EXACTLY 4 questions.
- Choose a MIX of types based on the passage’s nature.
- Do NOT repeat the same type more than once.
- Every question must feel CAT-authentic.

For every question:
- Exactly ONE option must be correct.
- At least TWO wrong options must be:
  - Partially true
  - Aligned with some line or idea in the passage
  - But incorrect in scope, emphasis, or implication
- These two must feel equally tempting on a first read.
- The final wrong option may be obviously wrong.
- The correct option must be defensible only by careful reading.

Each question object MUST contain:
- "prompt"
- "options": exactly 4 complete options
- "correctIndex": 0–3
- "type": one of the 12 types listed above (use kebab-case)

Do NOT:
- Restate lines directly
- Make factual recall questions
- Make obvious questions

If a question can be answered without eliminating at least one tempting option, rewrite it.

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

    const questions = (parsed.questions || []).map(q => {
      const rawType = (q.type || "").toLowerCase();

      const map = {
        "main": "main-idea",
        "tone": "tone",
        "infer": "inference",
        "detail": "detail",
        "function": "function",
        "agree": "author-agreement",
        "purpose": "purpose",
        "assumption": "assumption",
        "strengthen": "strengthen",
        "weaken": "weaken",
        "application": "application",
        "next": "next-paragraph",
      };

      let type = "inference";
      for (const k in map) {
        if (rawType.includes(k)) {
          type = map[k];
          break;
        }
      }

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
