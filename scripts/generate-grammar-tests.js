import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOPIC = {
  id: "nouns",
  name: "Nouns",
};

const DIFFICULTIES = ["easy", "moderate", "hard"];

async function generateTest(topic, difficulty) {
  console.log(`\nGenerating ${topic.name} — ${difficulty}...`);

  const prompt = `
You are an expert English grammar assessment designer for competitive exams.

Create exactly 10 multiple-choice grammar questions.

TOPIC: ${topic.name}
DIFFICULTY: ${difficulty}

The test must assess genuine understanding of ${topic.name}, not superficial memorisation.

DIFFICULTY REQUIREMENTS:

EASY:
- Direct application of fundamental grammar rules.
- Clear sentence structures.
- Test basic identification and correct usage.
- Distractors should be plausible but not deceptive.

MODERATE:
- Use exam-style traps and contextual application.
- Include exceptions, ambiguous-looking constructions and common learner errors.
- Distractors must represent realistic misconceptions.
- Avoid obvious wrong options.

HARD:
- Use subtle grammatical distinctions, exceptions and complex constructions.
- Questions should require careful grammatical reasoning.
- Distractors must be highly plausible.
- Avoid obscure trivia merely for the sake of difficulty.

QUESTION VARIETY:
Use a meaningful mix of question formats appropriate to the topic, such as:
- identify the grammatically correct sentence
- identify the incorrect usage
- fill in the blank
- sentence correction
- error detection
- contextual usage

Do not force every format if it is unnatural for the topic.

QUALITY RULES:
- Exactly 10 questions.
- Exactly 4 options per question.
- Only one correct answer.
- Options must be strings labelled A, B, C and D.
- Avoid duplicate concepts and near-duplicate questions within the same test.
- Do not use trick questions with genuinely debatable answers.
- Every explanation must clearly state why the correct answer is right.
- Explanations should also briefly explain the underlying grammar rule.
- Assign a precise subskill to every question.
- Assign a trap_type describing the misconception tested.

Return ONLY valid JSON. No markdown. No commentary.

Use exactly this structure:

{
  "questions": [
    {
      "question_number": 1,
      "question_type": "sentence_correction",
      "question_text": "Question here",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correct_answer": "A",
      "explanation": "Clear explanation here.",
      "subskill": "specific grammatical subskill",
      "trap_type": "specific misconception or trap"
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You create rigorous, unambiguous English grammar assessments with plausible distractors and accurate explanations.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content;
  const parsed = JSON.parse(raw);

  if (!parsed.questions || parsed.questions.length !== 10) {
    throw new Error(
      `Expected exactly 10 questions, received ${parsed.questions?.length}`
    );
  }

  return parsed.questions;
}

async function saveTest(topic, difficulty, testNumber, questions) {
  const { data: test, error: testError } = await supabase
    .from("grammar_tests")
    .insert({
      topic_id: topic.id,
      topic_name: topic.name,
      difficulty,
      test_number: testNumber,
      question_count: questions.length,
    })
    .select()
    .single();

  if (testError) {
    throw testError;
  }

  const questionRows = questions.map((question, index) => ({
    test_id: test.id,
    question_number: index + 1,
    question_type: question.question_type,
    question_text: question.question_text,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    subskill: question.subskill,
    trap_type: question.trap_type,
  }));

  const { error: questionsError } = await supabase
    .from("grammar_questions")
    .insert(questionRows);

  if (questionsError) {
    // Remove incomplete test if question insertion fails.
    await supabase.from("grammar_tests").delete().eq("id", test.id);
    throw questionsError;
  }

  console.log(
    `Saved: ${topic.name} | ${difficulty} | Test ${testNumber} | ${questions.length} questions`
  );
}

async function main() {
  console.log("Starting Grammar Test Generator");
  console.log("--------------------------------");

  for (const difficulty of DIFFICULTIES) {
    try {
      const questions = await generateTest(TOPIC, difficulty);

      await saveTest(
        TOPIC,
        difficulty,
        1,
        questions
      );
    } catch (error) {
      console.error(
        `Failed: ${TOPIC.name} | ${difficulty}`,
        error
      );
    }
  }

  console.log("\nGeneration finished.");
}

main();