import OpenAI from "openai";
import { NextResponse } from "next/server";

import {
  GRAMMAR_ONTOLOGY,
  GRAMMAR_TRAP_TYPES,
  GRAMMAR_QUESTION_TYPES,
  GRAMMAR_DIFFICULTIES,
} from "@/lib/grammarOntology";

import {
  GRAMMAR_DIFFICULTY_BLUEPRINT,
  GRAMMAR_QUALITY_RULES,
} from "@/lib/grammarDifficultyBlueprint";

import {
  getGrammarArchetypes,
} from "@/lib/grammarArchetypes";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    const { topicId, difficulty, count = 10 } = body;

    if (!topicId || !difficulty) {
      return NextResponse.json(
        {
          error: "topicId and difficulty are required",
        },
        { status: 400 }
      );
    }

  if (!GRAMMAR_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json(
        {
          error: "Difficulty must be easy, moderate, or hard",
        },
        { status: 400 }
      );
    }

    const topic = GRAMMAR_ONTOLOGY[topicId];

    if (!topic) {
      return NextResponse.json(
        {
          error: `Unknown grammar topic: ${topicId}`,
        },
        { status: 400 }
      );
    }

    const difficultyBlueprint =
      GRAMMAR_DIFFICULTY_BLUEPRINT[difficulty];

    const allowedSkills = topic.skills || [];
    const allowedTrapTypes = GRAMMAR_TRAP_TYPES;
    const availableArchetypes = getGrammarArchetypes(
  topicId,
  difficulty
);

const selectedArchetypes =
  availableArchetypes.length > 0
    ? Array.from(
        { length: count },
        (_, index) =>
          availableArchetypes[
            index % availableArchetypes.length
          ]
      )
    : [];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",

      temperature: 0.5,

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",

          content: `
You are an elite competitive-exam English grammar question designer and diagnostician.

You are creating questions for Auctor Grammar Lab.

These questions may be used by students preparing for exams such as:
- CUET
- IPMAT
- CLAT
- SSC
- Banking exams
- MBA entrance exams
- other competitive examinations involving English grammar

Your job is NOT to create cheap school-level grammar questions.

Your job is to create questions that:
- test genuine grammatical understanding
- contain realistic distractors
- expose specific misconceptions
- support detailed student diagnosis
- remain unambiguous
- have exactly one defensible correct answer

==================================================
TOPIC
==================================================

Topic ID:
${topicId}

Topic definition:
${JSON.stringify(topic, null, 2)}

You must test ONLY this topic.

Do not drift into unrelated grammar topics unless a secondary grammatical concept is genuinely necessary for the question.

==================================================
DIFFICULTY
==================================================

Requested difficulty:
${difficulty}

Difficulty blueprint:

${JSON.stringify(difficultyBlueprint, null, 2)}

You MUST obey this blueprint.

A question labelled hard must actually satisfy the hard construction rules.

Do not make a question hard merely by:
- using obscure vocabulary
- making the sentence unnecessarily long
- using rare words
- creating confusing wording

Difficulty must come from grammatical reasoning.

==================================================
QUALITY RULES
==================================================

Universal quality rules:

${JSON.stringify(GRAMMAR_QUALITY_RULES.universal, null, 2)}

${
  difficulty === "hard"
    ? `
Hard-question rejection rules:

${JSON.stringify(
  GRAMMAR_QUALITY_RULES.hardQuestionRejectionRules,
  null,
  2
)}
`
    : ""
}

Before returning any question, internally ask:

1. Does this test genuine grammar rather than vocabulary?
2. Are at least two options genuinely plausible?
3. Is there exactly one defensible answer?
4. Does the question require the level of reasoning demanded by the selected difficulty?
5. Is the strongest distractor based on a real misconception?
6. Would the explanation teach the student something meaningful?

If any answer is NO, reject that question internally and create another one.

==================================================
ALLOWED SKILLS
==================================================

primary_skill MUST be chosen ONLY from:

${JSON.stringify(allowedSkills)}

secondary_skill must either:
- be chosen from the same allowed list
- or be null if no genuine secondary skill exists

Never invent a skill.

==================================================
ALLOWED TRAP TYPES
==================================================

trap_type MUST be chosen ONLY from:

${JSON.stringify(allowedTrapTypes)}

Never invent a trap type.

==================================================
ALLOWED QUESTION TYPES
==================================================

question_type MUST be chosen ONLY from:

${JSON.stringify(GRAMMAR_QUESTION_TYPES)}

Never invent a question type.

Choose the question type that genuinely fits the grammatical concept being tested.

==================================================
QUESTION VARIETY
==================================================

Do not generate 10 copies of the same question pattern.

Across the ${count} questions, vary the format where appropriate.

Possible formats include:
- fill in the blank
- error detection
- sentence correction
- best revision
- identify grammatical function
- choose the grammatically correct sentence
- contextual usage
- multiple-statement analysis

However, use only formats that genuinely suit the selected topic.

Do not force artificial variety.

==================================================
MANDATORY QUESTION ARCHETYPES
==================================================

${
  selectedArchetypes.length > 0
    ? `
You are NOT free to invent arbitrary question structures.

For each question, you MUST use the corresponding archetype below.

${JSON.stringify(selectedArchetypes, null, 2)}

Question 1 must use archetype 1.
Question 2 must use archetype 2.
Question 3 must use archetype 3.
And so on.

The gold examples are demonstrations of reasoning quality and structure.

DO NOT copy their wording, sentences, answer choices, or exact grammatical material.

Each generated question must include an additional field:

"archetype_id": ""

The archetype_id must exactly match the id of the archetype assigned to that question.

For HARD questions:

- Do not create arbitrary fill-in-the-blank word-form questions.
- Do not use four morphological forms of the same root as options unless the assigned archetype explicitly requires it.
- Reject questions solvable through elementary local frames such as:
  - to + base verb
  - modal + base verb
  - article + noun
  - adjective + noun
  - basic singular/plural agreement
- Do not confuse stylistic preference with grammatical correctness.
- Do not claim a question is difficult merely because the explanation is sophisticated.
`
    : `
No specialised archetypes are configured for this topic and difficulty.
Use the general difficulty blueprint.
`
}

==================================================
DISTRACTOR QUALITY
==================================================

Every wrong option must exist for a reason.

A wrong option should represent one of:
- a common rule confusion
- mechanical rule application
- exception blindness
- proximity attraction
- meaning misinterpretation
- structural misreading
- false analogy
- overgeneralization
- another allowed trap from the ontology

Never create nonsense distractors merely to fill four options.

For every option explain:
- why it may look possible
- why it is correct or wrong

==================================================
EXPLANATION QUALITY
==================================================

Do not write explanations like:

"Option B is correct because it follows the grammar rule."

Instead explain:
- the exact rule
- how it applies here
- what feature of the sentence matters
- why the strongest wrong option tempts students
- exactly why that option fails

The diagnosis should make the student think:

"Yes, that is exactly why I got fooled."

Use simple, sharp English.

Do not use unnecessary academic jargon.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

No markdown.
No commentary.

Return exactly:

{
  "questions": [
    {
      "topic_id": "${topicId}",
      "difficulty": "${difficulty}",
      "archetype_id": "",

      "question_type": "",
      "question_text": "",

      "options": {
        "A": "",
        "B": "",
        "C": "",
        "D": ""
      },

      "correct_answer": "",

      "explanation": {
        "core_rule": "",
        "why_correct": "",
        "strongest_distractor": "",
        "why_distractor_is_tempting": "",
        "why_distractor_fails": ""
      },

      "diagnosis": {
        "primary_skill": "",
        "secondary_skill": null,
        "trap_type": "",
        "misconception": "",
        "why_students_fail": "",
        "thinking_error": "",
        "ideal_thinking_process": "",
        "future_lesson": ""
      },

      "option_analysis": {
        "A": {
          "status": "",
          "why_it_looks_possible": "",
          "why_it_is_correct_or_wrong": ""
        },
        "B": {
          "status": "",
          "why_it_looks_possible": "",
          "why_it_is_correct_or_wrong": ""
        },
        "C": {
          "status": "",
          "why_it_looks_possible": "",
          "why_it_is_correct_or_wrong": ""
        },
        "D": {
          "status": "",
          "why_it_looks_possible": "",
          "why_it_is_correct_or_wrong": ""
        }
      },

      "quality": {
        "difficulty_reason": "",
        "reasoning_steps": [],
        "ambiguity_check": "",
        "quality_score": 0
      }
    }
  ]
}

==================================================
FINAL VALIDATION
==================================================

Return exactly ${count} questions.

For every question:

- exactly 4 options
- exactly 1 correct answer
- correct_answer must be A, B, C, or D
- primary_skill must come from the supplied allowed list
- secondary_skill must come from the supplied allowed list or be null
- trap_type must come from the supplied allowed trap list
- quality_score must be an integer from 1 to 10

Do not return a question with quality_score below 8.

For HARD questions especially:
If the question is solvable by simple word-form recognition, basic recall, or looking only at the blank without understanding the sentence, reject it and regenerate internally.

Return valid JSON only.
`,
        },

        {
          role: "user",

          content: JSON.stringify({
            task: "Generate grammar questions",
            topicId,
            difficulty,
            count,
          }),
        },
      ],
    });

    const raw = completion.choices[0].message.content;

    if (!raw) {
      return NextResponse.json(
        {
          error: "Empty AI response",
        },
        { status: 500 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.error("GRAMMAR JSON PARSE FAILED");
      console.error(raw);

      return NextResponse.json(
        {
          error: "Invalid JSON returned by OpenAI",
          raw,
        },
        { status: 500 }
      );
    }

   

    const questions = parsed.questions || [];

// ==================================================
// INDEPENDENT QUALITY AUDIT
// ==================================================

const auditCompletion = await openai.chat.completions.create({
  model: "gpt-4.1",

  temperature: 0.1,

  response_format: {
    type: "json_object",
  },

  messages: [
    {
      role: "system",

      content: `
You are an independent senior grammar-question auditor for Auctor Grammar Lab.

You did NOT create these questions.

Your job is to aggressively detect:
- fake difficulty
- weak distractors
- incorrect grammar explanations
- ambiguous answers
- inflated quality scores
- shallow diagnosis
- questions that test vocabulary instead of grammar
- questions labelled hard that are actually easy

Do not be generous.

A question passes only if it genuinely deserves its stated difficulty.

TOPIC:
${topicId}

ALLOWED SKILLS:
${JSON.stringify(allowedSkills)}

REQUESTED DIFFICULTY:
${difficulty}

DIFFICULTY BLUEPRINT:
${JSON.stringify(difficultyBlueprint, null, 2)}

QUALITY RULES:
${JSON.stringify(GRAMMAR_QUALITY_RULES.universal, null, 2)}

${
  difficulty === "hard"
    ? `
HARD QUESTION REJECTION RULES:

${JSON.stringify(
  GRAMMAR_QUALITY_RULES.hardQuestionRejectionRules,
  null,
  2
)}
`
    : ""
}

CRITICAL HARD-DIFFICULTY RULE:

If a hard question can be answered through:
- obvious word-form recognition
- basic singular/plural recognition
- looking only at the blank and nearby word
- one elementary grammar rule
- eliminating two or three nonsense options immediately

then it MUST fail.

For example, a question such as:

"Despite the team's repeated __ to solve the problem..."

with options like:

attempts / attempting / attempted / attempt

must NOT pass as hard merely because the explanation claims it requires grammatical reasoning.

Also audit the explanation itself.

Check whether:
- the stated rule is actually true
- the explanation identifies the real reason for the answer
- the diagnosis matches the actual student error
- the primary skill is genuinely what the question tests
- the trap type is genuinely present

Return ONLY valid JSON:

{
  "audits": [
    {
      "question_index": 0,
      "pass": true,
      "actual_difficulty": "easy",
      "quality_score": 0,
      "fatal_flaws": [],
      "difficulty_analysis": "",
      "grammar_accuracy_analysis": "",
      "distractor_analysis": "",
      "diagnosis_analysis": "",
      "verdict": ""
    }
  ]
}

Return exactly one audit for every question.

quality_score must be an integer from 1 to 10.

For a question to pass:
- quality_score must be at least 8
- it must genuinely satisfy the requested difficulty
- it must have no fatal grammar error
- it must have exactly one defensible answer
- its diagnosis must accurately describe the reasoning required

Be strict.
`,
    },

    {
      role: "user",

      content: JSON.stringify({
        topicId,
        difficulty,
        questions,
      }),
    },
  ],
});

const auditRaw = auditCompletion.choices[0].message.content;

if (!auditRaw) {
  return NextResponse.json(
    {
      error: "Empty quality audit response",
    },
    { status: 500 }
  );
}

let auditParsed;

try {
  auditParsed = JSON.parse(auditRaw);
} catch (error) {
  console.error("GRAMMAR AUDIT JSON PARSE FAILED");
  console.error(auditRaw);

  return NextResponse.json(
    {
      error: "Invalid JSON returned by grammar quality auditor",
      raw: auditRaw,
    },
    { status: 500 }
  );
}

const audits = auditParsed.audits || [];

console.log("GRAMMAR QUALITY AUDITS:");
console.log(JSON.stringify(audits, null, 2));

const failedAudits = audits.filter(
  (audit) =>
    audit.pass !== true ||
    Number(audit.quality_score) < 8 ||
    audit.actual_difficulty !== difficulty
);

if (failedAudits.length > 0) {
  return NextResponse.json(
    {
      success: false,
      error: "Some generated questions failed independent quality audit",
      failedAudits,
      allAudits: audits,
      generatedQuestions: questions,
    },
    { status: 422 }
  );
}

    if (questions.length !== count) {
      return NextResponse.json(
        {
          error: `Expected ${count} questions but received ${questions.length}`,
          questions,
        },
        { status: 500 }
      );
    }

  const invalidQuestion = questions.find((q) => {
  const optionKeys = Object.keys(q.options || {});

  return (
    q.topic_id !== topicId ||
    q.difficulty !== difficulty ||

    (
      selectedArchetypes.length > 0 &&
      !selectedArchetypes.some(
        (archetype) =>
          archetype.id === q.archetype_id
      )
    ) ||

    !GRAMMAR_QUESTION_TYPES.includes(q.question_type) ||
    optionKeys.length !== 4 ||
    !["A", "B", "C", "D"].includes(q.correct_answer) ||
    !allowedSkills.includes(q.diagnosis?.primary_skill) ||
    !(
      q.diagnosis?.secondary_skill === null ||
      allowedSkills.includes(q.diagnosis?.secondary_skill)
    ) ||
    !allowedTrapTypes.includes(q.diagnosis?.trap_type) ||
    !Number.isInteger(Number(q.quality?.quality_score)) ||
    Number(q.quality?.quality_score) < 8 ||
    Number(q.quality?.quality_score) > 10
  );
});

    if (invalidQuestion) {
      return NextResponse.json(
        {
          error: "AI returned a question that failed validation",
          failedQuestion: invalidQuestion,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      topicId,
      difficulty,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("GRAMMAR GENERATION ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "Grammar question generation failed",
      },
      { status: 500 }
    );
  }
}