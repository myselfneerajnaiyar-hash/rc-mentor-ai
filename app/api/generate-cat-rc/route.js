import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  const prompt = `
You are a senior CAT VARC examiner designing an ACTUAL CAT Reading Comprehension sectional.

This is NOT practice content.
This must replicate real CAT RC difficulty, ambiguity, and reasoning depth.

====================
ABSOLUTE OUTPUT RULES
====================
- Return ONLY valid JSON
- No markdown
- No comments
- No explanations outside JSON
- Do NOT include passage titles
- Do NOT label paragraphs
- Use dense, formal CAT-style academic prose
- If ANY field is missing, regenerate internally before responding

====================
STRICT JSON SCHEMA
====================
{
  "passages": [
    {
      "id": "string",
      "genre": "string",
      "difficulty": "medium | hard",
      "text": "string",
      "questions": [
        {
          "id": "string",
          "type": "string",
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
      "meaning": "string",
      "context": "string"
    }
  ]
}

====================
GENRE CONSTRAINTS
====================
Choose EXACTLY 4 DISTINCT genres from this list (no repetition):

1. Philosophy
2. Psychology
3. Sociology
4. Anthropology
5. Political Theory
6. Ethics
7. Aesthetics
8. Cultural Studies
9. Linguistics
10. Epistemology
11. Environmental Studies
12. Technology & Society
13. Economics (theoretical)
14. History of Ideas
15. Science & Philosophy
16. Media Studies
17. Gender Studies
18. Urban Studies
19. Behavioral Science
20. Cognitive Science
21. Globalization Studies
22. Education Theory
23. Law & Society
24. Comparative Culture

====================
PASSAGE RULES
====================
- EXACTLY 4 passages
- Each passage must have 4–6 coherent paragraphs
- Abstract, argumentative, layered writing
- Multiple viewpoints OR internal tension
- No storytelling, no factual summaries

DIFFICULTY DISTRIBUTION:
- Passage 1 & 2 → medium (doable but indirect)
- Passage 3 & 4 → hard (abstract, inference-heavy, trap options)

====================
QUESTION RULES
====================
- EXACTLY 4 questions per passage (16 total)
- Use ONLY these CAT-style question types:
  1. Main Idea / Central Theme
  2. Primary Purpose
  3. Inference
  4. Author’s Tone or Attitude
  5. Implicit Assumption
  6. Strengthen the Argument
  7. Weaken the Argument
  8. Logical Implication
  9. Paragraph Function
  10. Application of the Idea
  11. Distinguishing Viewpoints
  12. Best Summary

- DO NOT repeat the same question type within a passage
- Questions must require reasoning, not line lifting

====================
OPTIONS & EXPLANATIONS
====================
- Each question must have EXACTLY 4 options
- Options must be close and elimination-based
- correctIndex must be between 0 and 3
- Explanation must:
  - Justify the correct option
  - Briefly state why EACH wrong option fails

====================
VOCABULARY RULES
====================
- Extract 8–12 difficult, abstract, CAT-relevant words
- Words should appear naturally in the passages
- Provide concise meaning and usage context
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

  // HARD SAFETY CHECK (prevents blank questions in UI)
  if (
    !data.passages ||
    !data.passages.every(p =>
      p.text &&
      p.questions &&
      p.questions.length === 4 &&
      p.questions.every(q =>
        q.stem &&
        Array.isArray(q.options) &&
        q.options.length === 4
      )
    )
  ) {
    return NextResponse.json(
      { error: "Invalid CAT RC structure", raw: data },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
