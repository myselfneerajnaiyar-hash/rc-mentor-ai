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
- EACH passage must be between 400 and 500 words (strict)
- EACH passage must have 4–6 paragraphs
- Each paragraph must be 70–130 words
- Paragraphs must be logically connected and progressive
- Writing style must resemble actual CAT RCs:
  abstract, dense, argumentative, multi-layered
- Passages must involve:
  - competing ideas OR
  - tension between theory and implication OR
  - critique of a dominant assumption
- NO factual recall passages
- NO storytelling
- NO examples that directly give away answers
ARGUMENT STRUCTURE RULE

Each passage should contain at least one of the following:

* competing viewpoints
* critique of a dominant theory
* tension between empirical evidence and theory
* reinterpretation of an established concept

DIFFICULTY DISTRIBUTION:
- Passage 1 & 2: Medium (doable but indirect)
- Passage 3 & 4: Hard (abstract, inference-heavy, trap options)
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

TRAP DESIGN PRINCIPLE

Good CAT options are not obviously incorrect.
They typically fail because they:

* overextend the author's claim
* misapply the argument
* omit a critical qualification
* interpret tone incorrectly

REASONING DEPTH RULE

Questions must require reasoning rather than locating a sentence.

Avoid questions that can be answered by directly lifting information.

Good CAT questions typically require:

* combining ideas from multiple paragraphs
* identifying implicit assumptions
* interpreting author's tone or intention
* applying the passage idea to a new scenario

====================

OPTIONS & EXPLANATIONS
====================

OPTION CONSTRUCTION PROCESS

Step 1.
Write the CORRECT option first.
It must capture the author's reasoning precisely but concisely.

Step 2.
Create THREE distractor options by modifying the correct option using these transformations:

1. Distortion Trap
   Slightly alter the author's reasoning so that the claim becomes subtly inaccurate.

2. Partial Truth Trap
   Preserve part of the author's argument but remove an essential qualification.

3. Unsupported Inference Trap
   Present a conclusion that seems logically plausible but is not supported by the passage.

Step 3.
Ensure that ALL FOUR options appear equally plausible to a careful reader.

OPTION SIMILARITY RULE

All options must:

* be similar in length (10–18 words)
* use similar vocabulary and tone
* avoid obvious contradictions with the passage
* avoid absolute words like "always", "never", "completely" unless justified

The correct answer must NOT be noticeably longer, clearer, or more balanced than the distractors.

DISTRACTOR QUALITY CHECK

Before finalizing the options, internally verify that:

* At least TWO distractors could appear correct to a strong reader.
* A student must eliminate options through reasoning, not surface reading.
* No option is obviously irrelevant to the passage.

EXPLANATION RULES

Explanation must:

1. Begin with a 2–3 sentence explanation of the author's reasoning relevant to the question.
2. Explain why the correct option aligns with the passage's argument or tone.
3. For EACH incorrect option:
   - identify the trap type (overstatement / narrowing / reversal / unsupported inference)
   - explain why the option is incorrect based on the passage’s reasoning.

Never refer to options as Option 0 / Option 1.
Always refer to them as Option A, Option B, Option C, Option D.

Explanation length: 120–150 words minimum.
====================
VOCABULARY RULES
====================
- Extract 8–12 difficult, abstract, CAT-relevant words
- Words should appear naturally in the passages
- Provide concise meaning and usage context
`;


  let completion;
let attempts = 0;

while (!completion && attempts < 2) {
  try {
    completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content:
        "Return ONLY valid JSON. No markdown. No comments. No text outside JSON.",
    },
    { role: "user", content: prompt }
  ],
  temperature: 0.7,
  response_format: { type: "json_object" }
});
  } catch {
    attempts++;
  }
}

if (!completion) {
  return NextResponse.json(
    { error: "OpenAI request failed after retry." },
    { status: 500 }
  );
}

  const content = completion.choices[0].message.content;

  let data;
  try {
    data = JSON.parse(content);
 } catch (err) {
  console.error("RAW OPENAI OUTPUT:", content);
  console.error("JSON PARSE ERROR:", err);

  return NextResponse.json(
    {
      error: "Invalid JSON from OpenAI",
      message: err.message,
      raw: content?.slice(0, 2000) // prevent browser crash
    },
    { status: 500 }
  );
}

function shuffleQuestion(q) {

  if (!Array.isArray(q.options)) return q;

  const correct = q.options[q.correctIndex];

  const shuffled = [...q.options].sort(() => Math.random() - 0.5);

  const newIndex = shuffled.indexOf(correct);

  q.options = shuffled;
  q.correctIndex = newIndex;

  return q;
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
q.options.length === 4 &&
typeof q.correctIndex === "number" &&
q.correctIndex >= 0 &&
q.correctIndex <= 3
      )
    )
  ) {
    return NextResponse.json(
      { error: "Invalid CAT RC structure", raw: data },
      { status: 500 }
    );
  }

  data.passages = data.passages.map(p => {
  p.questions = p.questions.map(shuffleQuestion);
  return p;
});

  return NextResponse.json(data);
}
