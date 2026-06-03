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

const TOPIC_POOL = [
  "medieval trade networks",
  "phenomenology",
  "urban anthropology",
  "linguistic relativism",
  "behavioral economics",
  "postcolonial architecture",
  "ecological ethics",
  "history of cartography",
  "aesthetic philosophy",
  "memory studies",
  "cognitive science",
  "political theology",
  "literary criticism",
  "classical liberalism",
  "feminist historiography",
  "science of expertise",
  "music cognition",
  "history of museums",
  "epistemology",
  "cultural semiotics",
  "migration sociology",
  "philosophy of language",
  "bureaucratic systems",
  "history of measurement",
  "attention economy",
  "moral psychology"
];

function pickTopics() {
  return [...TOPIC_POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
}


// 🔥 GENERATE WORKOUT (YOUR LOGIC REUSED)
async function generateWorkout() {

  const selectedTopics = pickTopics();

const topicInstruction = `
MANDATORY TOPICS FOR TODAY:

${selectedTopics.join("\n")}

STRICT RULES:

DO NOT use:
- AI
- social media
- remote work
- startup culture
- productivity culture
- generic climate change discussion

unless explicitly present in the mandatory topics list.

Topic repetition is forbidden.
`;

const prompt = `
${topicInstruction}

You are a senior CAT VARC examiner who has designed questions for the CAT exam.
Your task is NOT to reward surface comprehension.

Your task is to punish shallow interpretation.

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

DISTRACTOR GENERATION PROTOCOL

Step 1.
Write the correct answer.

Step 2.
Identify the most likely intelligent misinterpretation a strong CAT student would make after reading the passage quickly.

Step 3.
Create Distractor 1 from that exact misinterpretation.

Step 4.
Create Distractor 2 by subtly broadening or overextending the author's claim.

Step 5.
Create Distractor 3 by confusing:
- the author's own stance
with
- a viewpoint merely described in the passage.

IMPORTANT:

Wrong options must feel highly plausible.

At least TWO options should survive elimination after the first reading.

Students should experience genuine uncertainty between:
- the nuanced correct answer
- a tempting near-correct option.

Avoid obviously wrong options.

Incorrect options must NOT directly contradict the passage.

Wrong answers should fail because of:
- subtle overreach
- qualification distortion
- misplaced emphasis
- scope shift
- author-view confusion

NOT because they are factually absurd.

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

CORRECT ANSWER DISGUISE RULE

The correct option must NOT consistently appear:

- more balanced
- more intellectually sophisticated
- more comprehensive
- more moderate
- more elegant

Sometimes the correct answer should:
- sound narrower
- appear less polished
- emphasize a specific mechanism
- contain mild asymmetry

The correct answer should win through precision of reasoning, not tonal superiority.

DISTRACTOR QUALITY CHECK

Before finalizing each question:

* At least TWO distractors should appear plausible to a strong reader.  
* A student should need reasoning to eliminate options.  
* No option should be obviously irrelevant.

DISTRACTOR SUBTLETY RULE

Avoid making distractors obviously incorrect through:
- extreme quantifiers
- exaggerated certainty
- universal claims
- overt contradiction

Wrong options should usually fail because of:
- slight causal distortion
- qualification removal
- misplaced emphasis
- hidden scope expansion
- author-position confusion

not because they sound unreasonable.

Every question must contain:

question  
options (4)  
correctIndex (0-3)  
skill  
explanation (80-120 words)

EXPLANATION QUALITY RULE

Explanations must feel natural, analytical, and human.

Avoid rigid templates like:

- "Correct Answer Explanation"
- "Trap Explanation"
- "Why Other Options Are Incorrect"

Instead, explain organically:

- why the correct answer fits the author's reasoning
- why the strongest distractor appears attractive
- what subtle logical distortion makes it incorrect
- how careful reading resolves the ambiguity

Explanations should resemble how an elite CAT mentor teaches nuanced elimination strategies.

The explanation should actively teach:

- inference
- qualification sensitivity
- scope control
- tone interpretation
- logical precision

IMPORTANT:

Avoid repetitive wording patterns across explanations.

Each explanation should vary naturally in style and structure.

Length:
100-180 words.

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

SPEED DRILL VARIETY RULE

Vary writing texture across passages.

Some passages should feel:

- abstract-philosophical
- historical-analytical
- editorial
- scientific-academic
- sociological
- argumentative
- mildly narrative-academic

Sentence rhythm and structure must vary.

Avoid making all passages:

- equally dense
- equally abstract
- structurally identical

Some passages should use:

- shorter sharp sentences
- layered long-form argumentation
- ironic framing
- contrast-heavy prose
- evidence-driven exposition
----------------------------------

----------------------------------

SECTION 2 VOCABULARY IN CONTEXT

Generate 10 advanced CAT-style vocabulary questions.

VOCAB FORMAT RULE

Each vocabulary question must be FULLY SELF-CONTAINED.

There is NO external passage for vocabulary questions.

DO NOT use phrases like:
- "according to the passage"
- "according to the paragraph"
- "the author suggests"
- "the passage implies"
- "as discussed above"

Every vocabulary question must independently contain:
- a sentence
- a quoted phrase
- a mini-context
- a fill in the blank
- a contextual usage example
- or a standalone scenario

Students must be able to answer WITHOUT reading any separate passage.

VALID EXAMPLES:

"The committee described the proposal as 'pragmatic' because it:"
"In the sentence below, what does 'equivocation' most nearly mean?"
"Which word best completes the sentence?"
"The historian's tone can best be described as..."

INVALID EXAMPLES:

"According to the passage..."
"The author implies..."
"In the paragraph above..."

CRITICAL:

These must NOT feel like dictionary questions.

Avoid repetitive GRE-style testing.

The goal is to test:

- semantic precision
- contextual understanding
- tone sensitivity
- nuanced word usage
- distinction between near-synonyms

ABSOLUTELY AVOID:

- simple synonym questions
- simple antonym questions
- predictable GRE words repeated frequently
- obvious vocabulary testing patterns

VOCABULARY DIFFICULTY RULE

Vocabulary questions should test:

- nuanced contextual meaning
- academic usage
- intellectual discourse vocabulary
- philosophy/social science terminology
- editorial language
- abstract conceptual language

Avoid overused CAT coaching words such as:

- ephemeral
- laconic
- verbose
- mundane
- obvious GRE clichés

Prefer words like:

- reification
- teleology
- punctilious
- equivocation
- epistemic
- hermeneutic
- perfunctory
- dialectical
- recondite
- discursive
- canonical
- heuristic
- provisional
- capacious

At least 50% of vocabulary questions should require contextual interpretation rather than direct synonym recall.

QUESTION TYPES TO PRIORITIZE

1. CONTEXTUAL WORD USAGE

Example style:

"The committee described the proposal as 'pragmatic' primarily because it:"

- balanced idealism with feasibility
- rejected all compromise
- relied entirely on abstract theory
- ignored institutional limitations

2. NUANCED FILL IN THE BLANK

The blank must require:

- tone understanding
- logical consistency
- semantic precision

NOT mere memorization.

3. CLOSE WORD DISTINCTION

Test subtle differences between:

- skeptical vs cynical
- pragmatic vs opportunistic
- ambiguous vs paradoxical
- abstract vs obscure

4. TONE-DRIVEN VOCABULARY

Students should infer:

- emotional implication
- intellectual stance
- rhetorical force

5. CONTEXTUAL ELIMINATION

At least TWO options should initially appear plausible.
RC OPTION NUANCE RULE

Incorrect options should NOT be obviously false.

Instead, they should:

- contain partial truth
- preserve passage language while distorting implication
- subtly remove qualifications
- overextend contextual claims
- shift author tone slightly
- confuse description with endorsement
- introduce tiny scope exaggerations

The best distractor should feel 85-90% correct initially.

Students should struggle between:

- a nuanced correct answer
- a dangerously attractive near-correct answer

Avoid:

- direct contradiction
- exaggerated absurdity
- obviously unrelated options

The correct answer should depend on:

- nuance
- connotation
- contextual appropriateness

VOCAB DIFFICULTY RULE

Questions should feel:

- CAT-like
- editorial-like
- intellectually contextual

NOT like:

- GRE flashcards
- dictionary drills
- memorized word lists

WORD REPETITION RULE

Never overuse commonly repeated AI vocabulary such as:

- inscrutable
- ephemeral
- quixotic
- laconic
- esoteric
- transient
- tenuous

Maintain a rolling diversity of vocabulary and contexts.

OPTION DESIGN RULE

Wrong options must fail because:

- they mismatch tone
- they distort nuance
- they are contextually inappropriate
- they are semantically adjacent but not precise

EXPLANATION RULE

Each explanation must:

- explain the meaning of the correct option
- explain WHY it fits THIS context
- explain why the strongest distractor is tempting
- explain subtle differences between close words
- teach vocabulary naturally through reasoning

Explanations should feel like a top CAT mentor teaching nuanced interpretation.

Avoid repetitive explanation templates.

FORMAT:

question
options
correctIndex
skill = vocabulary
explanation

SECTION 3 READING COMPREHENSION

Generate TWO passages.

Each passage:

4-5 paragraphs  
each paragraph 90-120 words  
total 450-550 words

PASSAGE TEXTURE RULE

Avoid making all passages sound like academic summaries.

Vary rhetorical texture significantly.

Some passages should resemble:

- magazine essays
- editorials
- reflective intellectual prose
- argumentative criticism
- historical narrative analysis
- contemporary cultural commentary
- scientific interpretation essays

Vary:

- sentence length
- paragraph rhythm
- rhetorical style
- amount of abstraction
- authorial voice

Some passages may:

- begin with anecdotal observations
- contain ironic framing
- use provocative contrasts
- introduce conceptual tension gradually
- sound stylistically elegant rather than purely academic

Avoid repetitive openings such as:

- "Recent scholarship suggests..."
- "Historians argue..."
- "Critics maintain..."
- "The prevailing narrative..."

The prose should feel authored, not templated.

HUMAN PROSE IMPERFECTION RULE

Avoid making passages feel uniformly optimized or mechanically elegant.

Real CAT passages often contain:
- asymmetrical paragraph lengths
- occasional rhetorical wandering
- strategically placed examples
- uneven abstraction density
- subtle tonal pivots
- mildly awkward transitions
- sentences of varying rhythm and sharpness

Some paragraphs may:
- begin concretely before turning abstract
- briefly digress before returning to the main argument
- introduce illustrative cases without fully resolving them

The passage should feel written by a human intellectual voice, not by a perfectly optimized academic generator.

STYLE RANDOMIZATION RULE

For each RC passage, randomly adopt ONE of these writing textures:

- reflective intellectual essay
- magazine feature analysis
- editorial criticism
- historical reinterpretation
- sociological commentary
- scientific-cultural synthesis
- argumentative literary prose
- contemporary policy reflection

Ensure passage voice differs substantially across passages.

RHYTHM VARIATION RULE

Some passages should:

- use abrupt transitions
- contain shorter punchy sentences
- include occasional rhetorical questions
- introduce examples before abstractions
- delay the main thesis
- contain mild irony or skepticism
- use uneven paragraph density
- alternate between concrete and abstract language

Avoid making all passages sound uniformly polished, balanced, or academically symmetrical.

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

QUESTION STEM VARIETY RULE

Avoid repetitive question stems.

Do NOT repeatedly use:

- "What is the main idea?"
- "What is implied?"
- "What is the author's tone?"

Instead vary framing naturally.

Examples:

- "Which of the following best captures the author's central concern?"
- "The passage most strongly suggests that..."
- "The author would most likely agree with which of the following?"
- "Which statement best reflects the role of the second paragraph?"
- "The discussion of X primarily serves to..."
- "Which of the following would weaken the author's argument?"
- "The passage indicates that..."
- "The author introduces X primarily in order to..."

Question stems should feel organic and non-templated.

RC OPTION DESIGN RULE

For reading comprehension questions:

* At least two options must appear plausible after the first reading.
* Distractors should reflect common misinterpretations of the passage.
* Avoid options that contradict the passage directly.
* Avoid options that are obviously unrelated.
In difficult RC questions, at least TWO options should appear defensible after careful reading.

- Wrong options should preserve substantial partial truth.
- Distractors should differ through:
  - qualification shifts
  - causal distortion
  - scope broadening
  - subtle stance reversal
  - misplaced emphasis
  - exaggerated certainty
  - incorrect generalization

  CORRECT ANSWER CAMOUFLAGE RULE

The correct option must NOT consistently sound:
- more balanced
- more sophisticated
- more moderate
- more intellectually careful

Sometimes the correct answer should appear:
- slightly narrow
- unexpectedly concrete
- less elegant than distractors

Difficulty should emerge from reasoning precision, not from obvious tonal superiority.
Avoid obviously wrong choices.

Options should feel semantically crowded and difficult to separate quickly.

Students should experience uncertainty between:

- a nuanced correct interpretation
- a highly plausible near-correct interpretation.

The correct answer should win only because:
- it preserves a subtle qualification
- it avoids a small distortion
- it captures the author's stance more precisely



Incorrect options should typically fail because they:

- overextend the author's claim
- remove an important qualification
- convert possibility into certainty
- confuse explanation with endorsement
- mistake criticism for rejection
- broaden a contextual claim into a universal claim
- confuse the author's stance with a referenced viewpoint
- preserve partial truth while distorting the conclusion



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

MICRO OPTION COLLISION RULE

In summary questions:

- all four options must capture at least 60% of paragraph meaning
- differences should arise from:
  - misplaced emphasis
  - hidden causality distortion
  - qualification shifts
  - slight ideological overreach
  - narrowing vs broadening

Avoid:
- obviously incomplete summaries
- obviously extreme interpretations
- one clearly comprehensive option

MICRO QUESTION DIFFICULTY RULE

Summary options must:
- all appear conceptually relevant
- differ only in scope, emphasis, or qualification
- avoid obvious ideological extremes

Incorrect summary options should preserve 70-80% of the paragraph's meaning while subtly distorting:
- emphasis
- causality
- author stance
- degree of certainty

MICRO COLLISION INTENSIFIER

In para-summary questions:

All four options must:
- appear capable of summarizing the paragraph
- preserve major ideas from the passage
- avoid blatant incompleteness

Differences should arise through:
- hidden emphasis shifts
- subtle causality changes
- degree distortion
- ideological framing
- broader vs narrower interpretation

Students should struggle between at least TWO summaries after careful reading.

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
Do NOT use markdown.
Do NOT use code fences.
Do NOT include trailing commas.
All explanations must be plain strings.

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
    temperature: 0.9,
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

// 🔥 REMOVE BAD VOCAB QUESTIONS
if (workout.vocab?.questions) {

  workout.vocab.questions = workout.vocab.questions.filter(q => {

    const text = (q.question || "").toLowerCase();

    return !(
      text.includes("according to the passage") ||
      text.includes("according to the paragraph") ||
      text.includes("the author implies") ||
      text.includes("the passage suggests") ||
      text.includes("the passage implies")
    );

  });

}

// 🔥 VOCAB BACKUP VALIDATION
if (workout.vocab.questions.length < 10) {
  throw new Error("Bad vocab generation detected");
}

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