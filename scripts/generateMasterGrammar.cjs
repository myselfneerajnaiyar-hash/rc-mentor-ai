require("dotenv").config({ path: ".env.local" });

const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

// ------------------------------------
// INIT
// ------------------------------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ------------------------------------
// VALIDATION
// ------------------------------------

function validateQuestions(data) {

  if (!Array.isArray(data.questions)) {
    console.log("FAIL: questions missing");
    return false;
  }

  if (data.questions.length !== 20) {
    console.log("FAIL: expected 20 questions");
    return false;
  }

  const concepts = new Set();

  for (let i = 0; i < data.questions.length; i++) {

    const q = data.questions[i];

    if (!q.instruction) {
      console.log("FAIL: instruction", i);
      return false;
    }

    if (!q.originalSentence) {
      console.log("FAIL: originalSentence", i);
      return false;
    }

    if (!Array.isArray(q.options)) {
      console.log("FAIL: options", i);
      return false;
    }

    if (q.options.length !== 4) {
      console.log("FAIL: options length", i);
      return false;
    }

    if (
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex > 3
    ) {
      console.log("FAIL: correctIndex", i);
      return false;
    }

    if (!q.explanation) {
      console.log("FAIL: explanation", i);
      return false;
    }

    if (!q.concept) {
      console.log("FAIL: concept", i);
      return false;
    }

    concepts.add(q.concept);

    for (const option of q.options) {

      if (typeof option !== "string") {
        console.log("FAIL: option string", i);
        return false;
      }

      if (option.length < 15) {
        console.log("FAIL: option too short", i);
        return false;
      }

    }

  }

  console.log("Validation Passed");
  console.log("Concepts Used:", [...concepts]);

  return true;

}

// ------------------------------------
// GENERATE
// ------------------------------------

async function generateGrammarBatch() {

const prompt = `

You are one of the world's best CAT and GMAT Sentence Correction experts.

Generate EXACTLY 20 Sentence Correction questions.

Return ONLY JSON.

FORMAT

{
  "questions":[]
}

Every question MUST contain:

concept
instruction
originalSentence
options
correctIndex
explanation

--------------------------------

Allowed concepts ONLY

- modifier placement
- comparison
- parallelism
- pronoun reference
- logical predication
- meaning precision
- idiomatic usage

Do NOT use any other concept.

--------------------------------

STRICTLY FORBIDDEN

- subject verb agreement
- articles
- punctuation
- spelling
- capitalization
- tense
- either/or
- neither/nor
- commas
- apostrophes

--------------------------------

Instructions must be one of:

Choose the BEST revision.

Select the most effective sentence.

Which version expresses the intended meaning most precisely?

Which sentence is grammatically and logically superior?

--------------------------------

Rules

Every option must be a COMPLETE sentence.

Never use blanks.

Never split sentences.

Never create fragments.

Exactly ONE answer must be best.

Wrong answers should appear fluent.

Difficulty should resemble CAT and GMAT.

Students should hesitate between two options.

Avoid obvious errors.

--------------------------------

Explanation Rules

Explain:

- what concept is tested
- why the correct answer works
- why the strongest distractor looks attractive
- why it ultimately fails

Never mention:

Option A

Option B

Option C

Option D

first option

second option

third option

correct option

Refer only to sentence content.

100-180 words.

--------------------------------

Diversity Rules

Generate:

3 modifier placement

3 comparison

3 parallelism

3 pronoun reference

3 logical predication

3 meaning precision

2 idiomatic usage

Contexts must all differ.

No repeated professions.

No repeated animals.

No repeated scientific fields.

No repeated institutions.

No repeated historical events.

No repeated settings.

--------------------------------

Return ONLY valid JSON.

`;

const completion = await openai.chat.completions.create({

model: "gpt-4.1",

temperature: 0.8,

response_format: {
type: "json_object"
},

messages: [

{
role: "system",
content: "Return ONLY valid JSON."
},

{
role: "user",
content: prompt
}

]

});

const raw = completion.choices[0].message.content;

const data = JSON.parse(raw);

if (!validateQuestions(data)) {
throw new Error("Validation failed");
}

return data.questions;

}

// ------------------------------------
// SAVE
// ------------------------------------

async function saveQuestions(questions) {

  let inserted = 0;
  let skipped = 0;

  for (const q of questions) {

    // Check duplicate
    const { data: existing } = await supabase
      .from("master_grammar_questions")
      .select("id")
      .eq("original_sentence", q.originalSentence)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("master_grammar_questions")
      .insert({

        concept: q.concept,

        instruction: q.instruction,

        original_sentence: q.originalSentence,

        options: q.options,

        correct_index: q.correctIndex,

        explanation: q.explanation,

        difficulty: "CAT"

      });

    if (error) throw error;

    inserted++;

  }

  console.log("-----------------------------");
  console.log("Inserted :", inserted);
  console.log("Skipped  :", skipped);
  console.log("-----------------------------");

}

// ------------------------------------
// RUN
// ------------------------------------

async function run() {

  const BATCHES = 5;

  for (let i = 0; i < BATCHES; i++) {

    console.log("");
    console.log("=============================");
    console.log(`Batch ${i + 1}`);
    console.log("=============================");

    let success = false;

    for (let attempt = 1; attempt <= 3; attempt++) {

      try {

        console.log(`Attempt ${attempt}`);

        const questions =
          await generateGrammarBatch();

        await saveQuestions(questions);

        success = true;

        break;

      } catch (err) {

        console.log("Generation Failed");

        console.log(err.message);

      }

    }

    if (!success) {

      console.log("Skipping Batch");

    }

    // Rate-limit safety
    await new Promise(resolve => setTimeout(resolve, 1500));

  }

  console.log("");
  console.log("================================");
  console.log("Grammar Bank Generation Complete");
  console.log("================================");

}

run();