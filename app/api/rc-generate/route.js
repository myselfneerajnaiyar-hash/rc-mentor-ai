import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const difficultyMap = {
  beginner: {
    lang: "Use simple, clear language with short-to-medium sentences. Avoid heavy abstraction. Keep ideas concrete and familiar.",
    ques: "Questions should be straightforward and mostly direct. Avoid deep traps or multi-layered inference."
  },
  moderate: {
    lang: "Use simple, readable language and familiar concepts. Avoid dense academic phrasing.",
    ques: "Questions must be tricky and inference-based, with close options and subtle traps."
  },
  advanced: {
    lang: "Use dense, academic language with abstraction and layered arguments. Sentences may be long and complex.",
    ques: "Questions should be relatively direct and based on explicit reasoning in the passage. Avoid extreme traps."
  },
  pro: {
    lang: "Use dense, adversarial, academic prose with counter-intuitive claims and layered arguments that challenge assumptions.",
    ques: "Questions must be CAT-grade: inference-heavy, indirect, with deceptive options and fine distinctions."
  }
};

export async function POST(req) {
  try {
    const { genre, difficulty, lengthRange, bias,avoid } = await req.json();

    const { lang, ques } = difficultyMap[difficulty] || difficultyMap.pro;
    const [minWords, maxWords] = (lengthRange || "400-500").split("-");

    let biasText = "";
if (bias) {
  biasText = `
ADAPTIVE TRAINING DIRECTIVE:
The student has a weakness in "${bias.weakest}" type questions.
Their dominant error style is "${bias.style}".

Design this passage and its questions to:
- Include a higher proportion of "${bias.weakest}" questions.
- Subtly trigger "${bias.style}" mistakes through tempting distractors.
- Still feel like a realistic CAT RC set.
`;
}
    let avoidText = "";
if (avoid) {
  avoidText = `
THEME ROTATION RULE:
Avoid using themes, domains, or argumentative frames similar to: "${avoid}".
Force a sharp domain shift (e.g., biology, physics, anthropology, linguistics, architecture, AI, ecology, art history).
`;
}
    const prompt = `
You are generating a high-quality Reading Comprehension passage.
${biasText}
${avoidText}

GENRE: ${genre || "Mixed / General"}
TARGET LENGTH: ${minWords}-${maxWords} words total.

LANGUAGE DIRECTIVE:
${lang}

QUESTION DIRECTIVE:
${ques}

GLOBAL RULES:
- The passage must have exactly 4 paragraphs.
- Each paragraph should be proportionally balanced to meet the total word range.
- The passage must challenge a widely held assumption in this genre.
- It must be argumentative, not merely informative.
- Include at least one conceptual "turn" where the author complicates or qualifies their own stance.

STRUCTURE:
1. Introduce a common belief in this domain and hint at its limits.
2. Build the core argument with reasoning or example.
3. Add tension: counterpoint, paradox, or complication.
4. Conclude with implications or evaluation.

After the passage, generate exactly 4 MCQs:
- One main-idea question
- One tone/attitude question
- One inference question
- One detail/function question

Each question must have:
- prompt
- 4 options
- correctIndex

Return STRICT JSON only:

{
  "passage": "Para 1...\\n\\nPara 2...\\n\\nPara 3...\\n\\nPara 4...",
  "questions": [
    {
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 2
    }
  ]
}

Do not include any extra commentary outside the JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert RC content creator. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content || "";

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;

    if (start === -1 || end === -1) {
      throw new Error("Model did not return JSON");
    }

    const json = JSON.parse(text.slice(start, end));

    // Force stable CAT-style types in fixed order
    const orderedTypes = ["main-idea", "tone", "inference", "detail"];

    const questions = (json.questions || []).map((q, i) => ({
      ...q,
      type: orderedTypes[i] || "inference",
    }));

    return NextResponse.json({
      passage: json.passage,
      questions,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not generate RC" },
      { status: 500 }
    );
  }
}
