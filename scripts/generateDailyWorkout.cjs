require("dotenv").config({ path: ".env.local" });

const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

// ✅ INIT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔥 VALIDATION (VERY IMPORTANT)
function validateWorkout(workout) {

  if (!workout) return false;

  if (!Array.isArray(workout.speed?.questions) || workout.speed.questions.length !== 10) return false;
  if (!Array.isArray(workout.vocab?.questions) || workout.vocab.questions.length !== 10) return false;
  if (!Array.isArray(workout.micro?.questions) || workout.micro.questions.length !== 5) return false;
  if (!Array.isArray(workout.rc1?.questions) || workout.rc1.questions.length < 4) return false;
  if (!Array.isArray(workout.rc2?.questions) || workout.rc2.questions.length < 4) return false;

  for (let section of ["speed", "vocab", "micro", "rc1", "rc2"]) {

    const questions = workout[section]?.questions || [];

    for (let q of questions) {

      if (!Array.isArray(q.options) || q.options.length !== 4) return false;

    }
  }

  return true;
}

// 🔥 SHUFFLE
function shuffleQuestion(q) {
  if (!Array.isArray(q.options)) return q;

  const options = [...q.options];
  const correctValue = options[q.correctIndex];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  q.options = options;
  q.correctIndex = options.indexOf(correctValue);

  return q;
}

// 🔥 PARAGRAPH FORMAT
function cleanParagraphs(text) {
  if (!text) return text

  // Normalize line breaks
  let cleaned = text.replace(/\r\n/g, "\n")

  // Remove excessive spaces
  cleaned = cleaned.replace(/\s+/g, " ")

  // Split using sentence endings
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned]

  let paragraphs = []
  let current = ""

  sentences.forEach(sentence => {
    if ((current + sentence).length > 500) {
      paragraphs.push(current.trim())
      current = sentence
    } else {
      current += " " + sentence
    }
  })

  if (current) paragraphs.push(current.trim())

  return paragraphs.join("\n\n")
}

// 🔥 GENERATE WORKOUT (YOUR LOGIC REUSED)
async function generateWorkout() {

 const prompt = `

You are a senior CAT VARC examiner who has designed questions for the CAT exam.

Your job is NOT to generate easy comprehension questions.

Your job is to design questions that test:

- inference
- implicit argument structure
- subtle author stance
- logical implications
- contrast between ideas
- reasoning from tone

The difficulty level must match CAT 2021–2023 VARC.

Questions must NOT be directly answerable by copying lines from the passage.

Students must interpret meaning.

Generate a COMPLETE CAT VARC DAILY WORKOUT.

ABSOLUTELY FORBIDDEN:

- mathematics
- quantitative aptitude
- number series
- puzzles
- truth teller liar puzzles
- logical reasoning sets
- analytical reasoning
- number patterns

Allowed domains ONLY:

1 Reading comprehension  
2 Vocabulary in context  
3 Paragraph reasoning  

Every question must contain a THINKING TRAP.

Examples of traps:

- extreme interpretation
- partial truth
- reversal of author's stance
- tempting paraphrase
- confusing tone vs opinion
- option consistent with passage but NOT answering the question

At least one incorrect option must look very attractive.

OPTION CONSTRUCTION STANDARD

To ensure CAT-level difficulty, options must be constructed using the following process.

Step 1.
Write the CORRECT option first.

Step 2.
Create THREE distractor options by modifying the correct option using the following transformations:

* Distortion Trap  
Slightly alter the author's reasoning so that the statement becomes subtly inaccurate.

* Partial Truth Trap  
Preserve part of the author's argument but remove an important qualification.

* Unsupported Inference Trap  
Present a conclusion that seems logically plausible but is not supported by the passage.

OPTION BALANCE RULE

Options must be natural English sentences.

Do NOT include:
- skill labels (e.g. rapid_reading, vocabulary)
- internal tags
- code-like words

All options must:

* be similar in length (10–18 words)  
* use similar tone and vocabulary  
* avoid obviously wrong statements  
* avoid extreme wording like "always", "never", "completely" unless used deliberately as a trap  

The correct option must NOT be noticeably longer, clearer, or more balanced than the distractors.

DISTRACTOR QUALITY CHECK

Before finalizing each question:

* At least TWO distractors should appear plausible to a strong reader.  
* A student should need reasoning to eliminate options.  
* No option should be obviously irrelevant.

Every question must contain:

question  
options (4)  
correctIndex (0-3)  
skill  
explanation (80-120 words)

Explanation format MUST follow this structure:

Correct Answer Explanation:
Explain clearly why the correct option matches the author's reasoning.

Trap Explanation:
Identify the specific trap type used in the most attractive incorrect option
(distortion / partial truth / unsupported inference) and explain why it fails.

Why Other Options Are Incorrect:
Briefly explain why the remaining options fail logically.

----------------------------------

SECTION 1 SPEED READING

Generate 10 questions.

Each must include:

paragraph (90-120 words)  
question  
options  
correctIndex  
skill = rapid_reading  
explanation  

----------------------------------

----------------------------------

SECTION 2 VOCABULARY

Generate 10 standalone vocabulary questions.

These questions MUST NOT refer to any passage.

They must be independent vocabulary questions.

Allowed types:

1 Synonym question
Example:
"What is the closest meaning of the word 'laconic'?"

2 Antonym question
Example:
"Which word is the opposite of 'ephemeral'?"

3 Fill in the blank
Example:
"The CEO remained __ despite harsh criticism."
Options test vocabulary knowledge.

Rules:

- DO NOT write "in the passage"
- DO NOT refer to any passage
- DO NOT mention context paragraphs
- Each question must be standalone

Format:

question  
options (4)  
correctIndex  
skill = vocabulary  
explanation
----------------------------------

SECTION 3 READING COMPREHENSION

Generate TWO passages.

Each passage:

4-5 paragraphs  
each paragraph 90-120 words  
total 450-550 words

PASSAGE LOGIC STRUCTURE

Each passage must follow a reasoning progression similar to real CAT passages.

Paragraph structure guideline:

Paragraph 1  
Introduce a widely accepted assumption, theory, or belief.

Paragraph 2  
Present an alternative perspective, criticism, or complication.

Paragraph 3  
Deepen the tension by introducing evidence, implications, or counterarguments.

Paragraph 4  
Offer a nuanced evaluation, partial reconciliation, or unresolved tension.

Ensure passages are formatted into clear paragraphs separated by double line breaks (\n\n).
Do NOT output a single block of text.

The passage must NOT be a simple explanation of a topic.
It must revolve around an argument, critique, or conceptual tension.

VIEWPOINT DISTINCTION RULE

Passages should sometimes reference ideas from different thinkers, schools, or perspectives.

However, the author’s own stance must remain subtly distinguishable from the views described.

Questions may test whether the reader can distinguish:

* the author's position  
* positions described in the passage  
* positions the author critiques

Each RC must include the following question types:

1 Main Idea question  
1 Inference question  
1 Tone or Author Attitude question  
1 Logical Implication question  

Avoid factual questions.
Avoid direct line-based questions.
Topics allowed:

philosophy  
economics  
sociology  
psychology  
literary theory 
history
art and culture
architecture
environment and ecology
political science

Passages must resemble CAT passages.

Characteristics:

- dense argumentation
- abstract concepts
- multiple viewpoints
- contrast between ideas
- nuanced reasoning
- academic tone

Avoid storytelling.
Avoid narrative style.
Avoid simple explanatory passages.

ANSWER HIDING RULE

The passage must NEVER explicitly state the answer to any question.

Questions must require:

* interpretation of the author's reasoning  
* combining ideas from multiple paragraphs  
* identifying implicit assumptions  
* distinguishing between author stance and referenced viewpoints

Each passage must contain 4 questions.

RC OPTION DESIGN RULE

For reading comprehension questions:

* At least two options must appear plausible after the first reading.
* Distractors should reflect common misinterpretations of the passage.
* Avoid options that contradict the passage directly.
* Avoid options that are obviously unrelated.

Incorrect options should typically fail because they:

* overextend the author's claim  
* ignore an important qualification  
* misinterpret the author's tone  
* confuse the author's view with a view mentioned in the passage

Before finalizing the question set, check:

- Can a student answer by scanning the passage? If yes, make it harder.
- Are options too obvious? If yes, make distractors closer.
- Does at least one option create interpretation drift? If not, add one.

----------------------------------
----------------------------------

----------------------------------

SECTION 4 MICRO REASONING

Generate 5 questions.

Allowed types ONLY:

1. Paragraph Summary
2. Paragraph Completion
3. Critical Reasoning (Assumption / Inference)

Formatting rules:

PARAGRAPH SUMMARY

Provide a paragraph (120–160 words).

Question must be:

"Which of the following options best summarizes the paragraph?"

Provide 4 options.

----------------------------------

PARAGRAPH COMPLETION

Provide a paragraph ending with a logical gap.

Question must be:

"Which of the following sentences best completes the paragraph?"

Provide 4 options.

----------------------------------

CRITICAL REASONING

Provide a short argument (90–120 words).

Question must be either:

"Which of the following is an assumption required by the argument?"

OR

"Which of the following can be logically inferred from the argument?"

Provide 4 options.

----------------------------------

IMPORTANT RULES

Every question MUST contain:

question
options (array of 4 strings)
correctIndex
skill
explanation

Do NOT include labels like:
"Para Summary", "Para Completion", etc.

Return only the paragraph/argument text followed by the question.

----------------------------------
----------------------------------

Return ONLY valid JSON.

Format:

{
"speed":{"questions":[]},
"vocab":{"questions":[]},
"rc1":{"passage":"","questions":[]},
"rc2":{"passage":"","questions":[]},
"micro":{"questions":[]}
}

`

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0.6,
    max_tokens: 8000
  });

  let workout;

try {
  const raw = completion.choices[0].message.content;

  if (!raw) {
    throw new Error("Empty response from OpenAI");
  }

  workout = JSON.parse(raw);
  console.log("STRUCTURE CHECK:", Object.keys(workout || {}))

} catch (e) {
  console.log("❌ JSON PARSE FAILED");
  console.log("RAW RESPONSE:", completion.choices[0].message.content);
  throw e;
}

  // 🔥 SAFETY STRUCTURE
  if (!workout.speed) workout.speed = { questions: [] };
  if (!workout.vocab) workout.vocab = { questions: [] };
  if (!workout.rc1) workout.rc1 = { passage: "", questions: [] };
  if (!workout.rc2) workout.rc2 = { passage: "", questions: [] };
  if (!workout.micro) workout.micro = { questions: [] };

  // 🔥 FIX MICRO
  if (workout.micro?.questions) {
    workout.micro.questions = workout.micro.questions.map(q => ({
      ...q,
      options: q.options || ["Option A", "Option B", "Option C", "Option D"],
      correctIndex:
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3
          ? q.correctIndex
          : 0
    }));
  }

  // 🔥 FORMAT PASSAGES
  workout.rc1.passage = cleanParagraphs(workout.rc1.passage)
workout.rc2.passage = cleanParagraphs(workout.rc2.passage)

console.log("DETAILED CHECK:", {
  speed: workout.speed?.questions?.length,
  vocab: workout.vocab?.questions?.length,
  rc1: workout.rc1?.questions?.length,
  rc2: workout.rc2?.questions?.length,
  micro: workout.micro?.questions?.length,
});

  // 🔥 SHUFFLE ALL
 ["speed", "vocab", "micro", "rc1", "rc2"].forEach(section => {

  if (!workout[section]) {
    workout[section] = { questions: [] };
  }

  if (!Array.isArray(workout[section].questions)) {
    workout[section].questions = [];
  }

  workout[section].questions =
    workout[section].questions.map(shuffleQuestion);

});

  return workout;
}

// 🔥 MAIN

async function run() {

  const DAYS_TO_GENERATE = 30;

  for (let i = 0; i < DAYS_TO_GENERATE; i++) {

    const date = new Date();
    date.setDate(date.getDate() + i);

    const workoutDate = date.toISOString().split("T")[0];

    console.log(`\n📅 Generating workout for: ${workoutDate}`);

    // ✅ SKIP IF EXISTS
    const { data: existing } = await supabase
      .from("daily_workout_templates")
      .select("id")
      .eq("workout_date", workoutDate)
      .single();

    if (existing) {
      console.log("⚠️ Already exists, skipping:", workoutDate);
      continue;
    }

    let workout;
    let attempts = 0;

    while (attempts < 3) {
      try {
        console.log(`👉 Attempt ${attempts + 1}`);
        workout = await generateWorkout();



        if (validateWorkout(workout)) {
          console.log("✅ Valid workout generated");
          break;
        } else {
          console.log("❌ Invalid workout, retrying...");
        }

      } catch (err) {
  console.log("❌ Generation failed:", err.message || err)
}

      attempts++;
    }

    if (!workout) {
      console.log("❌ Skipping date due to failure:", workoutDate);
      continue;
    }

    await supabase
      .from("daily_workout_templates")
      .insert({
        workout_date: workoutDate,
        mode: "normal",
        content: workout
      });

    console.log("💾 Saved:", workoutDate);

    // ✅ RATE LIMIT SAFETY
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("🎉 All workouts generated");
}
run();