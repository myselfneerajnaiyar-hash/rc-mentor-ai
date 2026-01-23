export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALL_TYPES = [
  "main-idea",
  "tone",
  "inference",
  "detail",
  "function",
  "assumption",
  "strengthen",
  "weaken",
  "application",
  "analogy",
  "author-agreement",
  "logical-continuation",
];

function normalizeType(raw) {
  const t = (raw || "").toLowerCase();

  if (t.includes("main")) return "main-idea";
  if (t.includes("tone") || t.includes("attitude")) return "tone";
  if (t.includes("infer")) return "inference";
  if (t.includes("detail")) return "detail";
  if (t.includes("function") || t.includes("role")) return "function";
  if (t.includes("assump")) return "assumption";
  if (t.includes("strength")) return "strengthen";
  if (t.includes("weaken")) return "weaken";
  if (t.includes("apply") || t.includes("application")) return "application";
  if (t.includes("analogy") || t.includes("parallel")) return "analogy";
  if (t.includes("agree") || t.includes("disagree")) return "author-agreement";
  if (t.includes("next") || t.includes("continue")) return "logical-continuation";

  return "inference";
}

export async function POST(req) {
  try {
    const { passage, mode = "normal", bias = {} } = await req.json();

    let mixInstruction = `
Choose 4 question types based on the DNA of this passage.
Ensure variety. Do not repeat a type.
Pick from this universe:

${ALL_TYPES.join(", ")}
`;

    if (mode === "adaptive" && bias?.weakestTypes?.length) {
      mixInstruction = `
You are in ADAPTIVE mode.

The student is weak in:
${bias.weakestTypes.join(", ")}

You MUST:
- Include at least 2 questions from weakestTypes
- Include 1 adjacent cognitive type
- Include 1 neutral CAT type

Still generate EXACTLY 4 questions.
Do not repeat a type.
`;
    }

    const prompt = `
You are a CAT (IIM) Reading Comprehension question setter.

Your job is to generate EXACTLY 4 CAT-level MCQs from the passage below.

These must feel like real CAT questions:
- Non-obvious
- Elimination-based
- With tempting but wrong options

For every question:
- Exactly ONE option must be clearly correct.
- At least TWO wrong options must be:
  - Partially true
  - Aligned with some line in the passage
  - But incorrect in scope, emphasis, or implication
- These two must feel equally tempting on a first read.
- The final wrong option can be obviously wrong.
- The correct option must be defensible only by careful reading.

${mixInstruction}

Rules:

- Each question object MUST contain:
  - "prompt"
  - "options": exactly 4 complete options
  - "correctIndex": 0–3
  - "type": one of:
    ${ALL_TYPES.join(", ")}

- Every option must be:
  - Grammatically complete
  - Plausible
  - Mutually exclusive

- Do NOT restate lines.
- Do NOT make factual recall questions.
- If a question can be answered without eliminating at least one tempting option, rewrite it.

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
        {
          role: "system",
          content: "You are an expert CAT RC question setter. Output valid JSON only.",
        },
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

    const questions = (parsed.questions || []).slice(0, 4).map(q => {
      const type = normalizeType(q.type);

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
