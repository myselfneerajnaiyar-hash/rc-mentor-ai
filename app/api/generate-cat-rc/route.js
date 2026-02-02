import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { difficulty = "CAT", passages = 1 } = await req.json();
const prompt = `
You are a senior CAT VARC paper setter.

Generate a FULL CAT RC sectional.

STRICT INSTRUCTIONS:
- Return ONLY valid JSON
- No markdown
- No commentary outside JSON
- Follow the schema exactly

STRUCTURE REQUIREMENTS:
- Generate EXACTLY 4 passages
- Each passage must be from a DIFFERENT genre:
  1. Philosophy
  2. Social Sciences
  3. Science / Technology
  4. Literature / Culture / Economics

PASSAGE REQUIREMENTS:
- NO titles
- NO headings
- Each passage must contain 4 to 6 paragraphs
- Paragraphs must be clearly separated using line breaks
- Writing style must be dense, abstract, and CAT-authentic

DIFFICULTY MIX:
- Passage 1 & 2: Moderately difficult (doable but not direct)
- Passage 3 & 4: Very difficult (abstract, layered, confusing on first read)

QUESTION REQUIREMENTS:
- EXACTLY 4 questions per passage
- Question types must be mixed:
  - Main idea
  - Inference
  - Author’s attitude / tone
  - Application / function
- NO direct factual questions
- Options must be closely worded and overlapping
- Only ONE option must be best
- CorrectIndex must be between 0 and 3

EXPLANATIONS:
- Explanation must explain:
  - Why the correct option is best
  - Why EACH wrong option is incorrect

VOCABULARY:
- Extract 6–10 difficult words across all passages
- Vocabulary must come from the passages only

SCHEMA:
{
  "passages": [
    {
      "id": "string",
      "text": "string",
      "questions": [
        {
          "id": "string",
          "stem": "string",
          "options": ["string", "string", "string", "string"],
          "correctIndex": number,
          "explanation": "string"
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "word": "string",
      "meaning": "string"
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

 const content = completion.choices[0].message.content;

let data;
try {
  data = JSON.parse(content);
} catch (err) {
  return NextResponse.json(
    { error: "Invalid JSON from OpenAI", raw: content },
    { status: 500 }
  );
}

return NextResponse.json(data);
}
