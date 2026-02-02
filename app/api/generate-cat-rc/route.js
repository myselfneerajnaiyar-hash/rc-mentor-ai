import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { difficulty = "CAT", passages = 1 } = await req.json();
const prompt = `
You are a senior CAT VARC paper setter and examiner.

Generate a FULL CAT Reading Comprehension sectional.

====================
STRICT OUTPUT RULES
====================
- Return ONLY valid JSON
- No markdown
- No comments
- No text outside JSON
- Do NOT include passage titles
- Do NOT label paragraphs
- Use formal CAT exam language

====================
SCHEMA (MUST MATCH)
====================
{
  "passages": [
    {
      "genre": "string",
      "difficulty": "medium | hard",
      "text": "string",
      "questions": [
        {
          "id": "string",
          "questionType": "string",
          "questionText": "string",
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
      "meaning": "string",
      "context": "string"
    }
  ]
}

====================
GENRE RULES
====================
Choose EXACTLY 4 DISTINCT genres from this pool:
- Philosophy
- Psychology
- Sociology
- Economics
- Political Theory
- History
- Cultural Studies
- Anthropology
- Linguistics
- Science & Epistemology
- Technology & Society
- Environmental Studies
- Ethics
- Art & Aesthetics
- Evolutionary Biology
- Cognitive Science
- Education Theory
- Law & Society
- Urban Studies
- Media Studies

====================
PASSAGE RULES
====================
- Exactly 4 passages
- Each passage must have 4–6 paragraphs
- Paragraphs must be logically connected
- Writing style must resemble CAT RCs (abstract, dense, argumentative)
- No factual recall passages

DIFFICULTY DISTRIBUTION:
- Passage 1 & 2: Medium (doable but indirect)
- Passage 3 & 4: Hard (abstract, inference-heavy, trap options)

====================
QUESTION RULES
====================
- EXACTLY 4 questions per passage
- Use a MIX of question types from this pool:
  - Central idea / primary purpose
  - Author’s tone or attitude
  - Inference
  - Implicit assumption
  - Strengthen / weaken argument
  - Logical implication
  - Meaning in context
  - Paragraph function
  - Application of idea
  - Analogy / parallel reasoning
  - Distinguishing viewpoints
  - Best summary
- Do NOT repeat the same question type within a passage
- Questions must require reasoning, not line lifting

====================
OPTIONS & EXPLANATION RULES
====================
- Each question must have exactly 4 options
- Options must be close, subtle, and CAT-style traps
- correctIndex must be between 0 and 3
- Explanation must:
  - Clearly justify why the correct option is correct
  - Briefly explain why each incorrect option is wrong

====================
VOCABULARY RULES
====================
- Extract 8–12 difficult words across passages
- Words must be CAT-relevant (academic / abstract)
- Provide concise meanings and usage context
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
