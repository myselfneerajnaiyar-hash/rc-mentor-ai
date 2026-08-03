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

  if (!workout) {
    console.log("FAIL: workout null");
    return false;
  }

  if (!Array.isArray(workout.speed?.questions) || workout.speed.questions.length !== 10) {
    console.log("FAIL: speed count");
    return false;
  }

  if (!Array.isArray(workout.vocab?.questions) || workout.vocab.questions.length !== 10) {
    console.log("FAIL: vocab count =", workout.vocab?.questions?.length);
    return false;
  }

  if (!Array.isArray(workout.micro?.questions) || workout.micro.questions.length !== 5) {
    console.log("FAIL: micro count");
    return false;
  }

  if (!Array.isArray(workout.rc1?.questions) || workout.rc1.questions.length < 4) {
    console.log("FAIL: rc1");
    return false;
  }

  if (!Array.isArray(workout.rc2?.questions) || workout.rc2.questions.length < 4) {
    console.log("FAIL: rc2");
    return false;
  }

 for (const section of ["speed","vocab","micro","rc1","rc2"]) {

  for (let i = 0; i < workout[section].questions.length; i++) {

    const q = workout[section].questions[i];

    // ✅ Grammar question must exist
    if (section === "micro" && !q.question) {
      console.log(`FAIL: micro[${i}] question missing`);
      console.log(q);
      return false;
    }

    if (!Array.isArray(q.options)) {
      console.log(`FAIL: ${section}[${i}] options missing`);
      console.log(q);
      return false;
    }

    if (q.options.length !== 4) {
      console.log(`FAIL: ${section}[${i}] options length = ${q.options.length}`);
      console.log(q);
      return false;
    }

  }
}

  console.log("VALIDATION PASSED");
  return true;
}

async function getTodaysVocab() {

  const { data, error } = await supabase
    .from("master_vocab")
    .select("id, word, meaning, synonyms, antonyms")
    .order("last_used", {
      ascending: true,
      nullsFirst: true
    })
    .limit(10);

  if (error) throw error;

  return data;

}

async function markVocabUsed(items) {

  const today = new Date().toISOString().split("T")[0];

  const ids = items.map(x => x.id);

  const { error } = await supabase
    .from("master_vocab")
    .update({
      last_used: today
    })
    .in("id", ids);

  if (error) throw error;

}

async function getTodaysIdioms() {

  const { data, error } = await supabase
    .from("master_idioms")
    .select("*")
    .order("last_used", {
      ascending: true,
      nullsFirst: true
    })
    .limit(2);

  if (error) throw error;

  return data;

}

async function markIdiomsUsed(items) {

  const today = new Date().toISOString().split("T")[0];

  const ids = items.map(x => x.id);

  const { error } = await supabase
    .from("master_idioms")
    .update({
      last_used: today
    })
    .in("id", ids);

  if (error) throw error;

}

async function getTodaysFillOpenings() {

  const { data, error } = await supabase
    .from("master_fill_openings")
    .select("*")
    .order("last_used", {
      ascending: true,
      nullsFirst: true
    })
    .limit(2);

  if (error) throw error;

  return data;

}

async function markFillUsed(items) {

  const today = new Date().toISOString().split("T")[0];

  const ids = items.map(x => x.id);

  const { error } = await supabase
    .from("master_fill_openings")
    .update({
      last_used: today
    })
    .in("id", ids);

  if (error) throw error;

}

async function getTodaysTopics() {

  const { data, error } = await supabase
    .from("master_topics")
    .select("*")
    .order("last_used", {
      ascending: true,
      nullsFirst: true
    })
    .limit(1)
    .single();

  if (error) throw error;

  return data;

}

async function markTopicsUsed(id) {

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("master_topics")
    .update({
      last_used: today
    })
    .eq("id", id);

  if (error) throw error;

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

function extractVocabWord(q) {

  const text = q.question || "";

  let m = text.match(/'([^']+)'/);

  if (m) return m[1].trim().toLowerCase();

  m = text.match(/"([^"]+)"/);

  if (m) return m[1].trim().toLowerCase();

  if (
    Array.isArray(q.options) &&
    typeof q.correctIndex === "number"
  ) {
    return q.options[q.correctIndex]
      .split(" ")[0]
      .replace(/[.,;:!?]/g,"")
      .trim()
      .toLowerCase();
  }

  return null;

}

function grammarConcept(q){

  const e=(q.explanation||"").toLowerCase();

  if(e.includes("modifier")) return "modifier placement";

  if(e.includes("comparison")) return "comparison";

  if(e.includes("parallel")) return "parallelism";

  if(e.includes("pronoun")) return "pronoun reference";

  if(e.includes("idiom")) return "idiom";

  if(e.includes("ambigu")) return "ambiguity";

  return "meaning precision";

}

function fixIncorrectUsageQuestion(q) {
  if (!q.question) return q;

  const text = q.question;

  // Already fine
  if (
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every(o => o.length > 10)
  ) {
    return q;
  }

  const matches = text.match(/([A-D]\))([\s\S]*?)(?=(?:[A-D]\))|$)/g);

  if (matches && matches.length === 4) {
    q.options = matches.map(m => m.replace(/^[A-D]\)\s*/, "").trim());

    q.question = text.split("A)")[0].trim();

    return q;
  }

  return q;
}






function buildMemoryPrompt(memory) {

return `

############################

PREVIOUSLY USED VOCABULARY

${memory.usedVocab.join("\n")}

############################

PREVIOUSLY USED RC TOPICS

${memory.usedRcTopics.join("\n")}

############################

PREVIOUSLY USED SPEED TOPICS

${memory.usedSpeedTopics.join("\n")}

############################

PREVIOUSLY USED GRAMMAR CONCEPTS

${memory.usedGrammarConcepts.join("\n")}

############################

ABSOLUTE RULES

Do NOT reuse ANY vocabulary word listed above.

Do NOT reuse ANY RC topic listed above.

Do NOT reuse ANY speed-reading topic listed above.

Do NOT reuse ANY grammar concept listed above.

If there is any conflict,

generate a completely different workout.

`;

}

// 🔥 GENERATE WORKOUT (YOUR LOGIC REUSED)
async function generateWorkout() {

const { data: memoryRows, error } = await supabase
  .from("workout_memory")
  .select("*")
  .order("last_used", { ascending: false })
  .limit(500);

if (error) throw error;

const memory = {
  usedVocab: [],
  usedRcTopics: [],
  usedSpeedTopics: [],
  usedGrammarConcepts: []
};

(memoryRows || []).forEach(row => {
  if (row.type === "vocab") memory.usedVocab.push(row.value);
  if (row.type === "rc") memory.usedRcTopics.push(row.value);
  if (row.type === "speed") memory.usedSpeedTopics.push(row.value);
  if (row.type === "grammar") memory.usedGrammarConcepts.push(row.value);
});

console.log({
  vocab: memory.usedVocab.length,
  rc: memory.usedRcTopics.length,
  speed: memory.usedSpeedTopics.length,
  grammar: memory.usedGrammarConcepts.length
});

  
const todaysTopics = await getTodaysTopics();

const todaysVocab = await getTodaysVocab();

const todaysWords = todaysVocab.map(x => x.word);

const todaysIdioms = await getTodaysIdioms(memory);

const todaysFillOpenings = await getTodaysFillOpenings();
  

console.log("Today's vocab:", todaysWords);
console.log("Today's idioms:", todaysIdioms);

console.log("Today's fill openings:", todaysFillOpenings);
console.log("Today's RC1:", todaysTopics.rc1_topic);
console.log("Today's RC2:", todaysTopics.rc2_topic);
console.log("Today's Speed:", todaysTopics.speed_topics);

const topicInstruction = `
MANDATORY TOPICS

RC1 MUST use ONLY this topic:

${todaysTopics.rc1_topic}

RC2 MUST use ONLY this topic:

${todaysTopics.rc2_topic}

Generate EXACTLY 10 Speed Reading passages.

Use these topics exactly once:

${todaysTopics.speed_topics
  .map((topic, index) => `${index + 1}. ${topic}`)
  .join("\n")}

ABSOLUTE RULES

- Do NOT change the RC topics.
- Do NOT invent new RC topics.
- Every Speed passage must use exactly one topic from the list.
- Every Speed topic must be used exactly once.
- Do NOT introduce additional Speed topics.
`;

const prompt = `
${buildMemoryPrompt(memory)}
${topicInstruction}

You are a senior CAT VARC examiner who has designed questions for the CAT exam.
Your task is NOT to reward surface comprehension.

Your task is to punish shallow interpretation.

Your job is NOT to generate easy comprehension questions.

PHASE 1 – PLAN

Before writing the workout, internally create a topic map.

Rules:

* RC1 uses one domain.
* RC2 uses another unrelated domain.
* Each Speed passage must use a different discipline.

None may overlap with

RC

Vocabulary

Grammar.
* Every vocabulary question must come from a different discipline.

Examples

medicine

history

music

architecture

finance

law

sports

ecology

astronomy

psychology

No discipline may repeat.
* Every Grammar question uses a different context.

No scientific object, historical event, animal, technology,
institution, profession, natural phenomenon or case study may
appear more than once anywhere in the workout.

Forbidden:
- volcano appearing twice
- bird appearing twice
- migration appearing twice
- anthropology appearing twice
- renewable materials appearing twice
- navigation appearing twice
- peer review appearing twice

If any topic repeats,
rewrite it before producing JSON.

Never output this planning step.

PHASE 2 – DIVERSITY CHECK

Create a list of every noun/topic used.

Examples:

bird
volcano
migration
peer review
navigation
renewable materials
urban anthropology

Every noun may appear ONLY ONCE in the entire workout.

If any noun appears twice,

rewrite the later question.

This applies across ALL sections.

RC
Speed
Vocabulary
Grammar

must all use different examples.


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

EXPLANATIONS ARE WRITTEN BEFORE THE OPTIONS ARE SHUFFLED.

Therefore:

Never refer to:

- the first option
- the second option
- the third option
- the fourth option
- Option A
- Option B
- Option C
- Option D
- the correct option

Always refer ONLY to the actual content.

Example:

Correct:

The sentence describing gradual accumulation best reflects the meaning of "accretion."

Wrong:

The first option is correct.

Never refer to option numbers such as Option 0, Option 1, Option A or Option B.

Explain the answer by referring to the content of the option, not its position.

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

GRAMMAR EXPLANATION RULE

For grammar questions, explain:

- the precise grammatical or logical principle being tested,
- why the chosen sentence preserves the intended meaning,
- why the strongest distractor appears acceptable at first reading but subtly changes the meaning or introduces a grammatical flaw.

Do NOT simply state that one sentence is grammatically correct.

Teach the underlying concept exactly as an experienced CAT/GMAT mentor would.

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

SECTION 2 VOCABULARY

Generate exactly 10 vocabulary questions.

TODAY'S VOCABULARY WORDS

${todaysWords.join("\n")}

ABSOLUTE RULES

Use ONLY the vocabulary words listed above.

Do NOT generate any other vocabulary word.

Each vocabulary word may be used only once.

The two selected idioms/phrasal verbs are NOT vocabulary words.

Do NOT use them in Synonym, Antonym, Incorrect Usage or Fill in the Blank questions.

Use them ONLY in the Idiom / Phrasal Verb section.

If you generate a vocabulary word outside this list,
the workout is invalid.

Never use words from previous workouts.

Distribution (STRICT)

Use Today's Vocabulary Words:

- 2 Incorrect Usage
- 2 Synonyms
- 2 Antonyms
- 2 Fill in the Blank

Use Today's Idioms / Phrasal Verbs:

- 2 Idiom / Phrasal Verb questions

Do NOT generate Contextual Meaning questions.

Do NOT refer to any passage.

Do NOT use:
- according to the passage
- according to the paragraph
- the author implies
- the passage suggests
- the passage indicates

Every vocabulary question must use exactly ONE word from Today's Vocabulary Words.

Question Types:

1. Incorrect Usage
Question:
"Identify the INCORRECT usage of the word 'X'."

Options:
4 complete sentences.

2. Synonym

Question:
"Choose the word closest in meaning to 'X'."

Options:
4 single-word choices.

3. Antonym

Question:
"Choose the word opposite in meaning to 'X'."

Options:
4 single-word choices.

4. Fill in the Blank

TODAY'S FILL OPENINGS

1.
${todaysFillOpenings[0].opening}

Category:
${todaysFillOpenings[0].category}

2.
${todaysFillOpenings[1].opening}

Category:
${todaysFillOpenings[1].category}

ABSOLUTE RULES

Generate EXACTLY TWO Fill in the Blank questions.

Each question must contain:

* one complete grammatical sentence

* exactly ONE blank written as ____

* the supplied opening unchanged

* exactly ONE correct vocabulary word

Example

Opening:

The historian argued that

Question:

The historian argued that the gradual ____ of evidence eventually transformed scholarly opinion.

Options

accretion
animus
quiescent
protean

Rules

The options MUST be four SINGLE WORDS.

Never use phrases.

Never use clauses.

Never use sentences.

The blank must be answerable by inserting ONE word.

The final sentence must sound natural after inserting the correct answer.

NATURALNESS CHECK

Before returning the question, mentally insert the correct vocabulary word into the blank and read the sentence as complete English.

The sentence must sound like something that could naturally appear in a quality newspaper, magazine, academic essay, or editorial.

Reject sentences that sound forced, awkward, artificially constructed, or written merely to accommodate the target word.

The correct answer must fit BOTH grammatically and semantically.

The distractors should appear plausible but should produce subtle errors of meaning rather than obvious grammatical mistakes.

The distractors should all be believable in context.

EXPLANATION RULE

Do NOT mention option numbers or positions.

Explain why the correct vocabulary word fits the surrounding sentence naturally.

Briefly explain why the closest distractor appears tempting but fails because of meaning or usage.

----------------------------------------

5. Idiom / Phrasal Verb

TODAY'S IDIOMS / PHRASAL VERBS

1.
Phrase:
${todaysIdioms[0].phrase}

Meaning:
${todaysIdioms[0].meaning}

Type:
${todaysIdioms[0].type}

2.
Phrase:
${todaysIdioms[1].phrase}

Meaning:
${todaysIdioms[1].meaning}

Type:
${todaysIdioms[1].type}

ABSOLUTE RULES

Generate EXACTLY TWO questions.

Use ONLY the two phrases above.

Do NOT invent any new idiom.

Do NOT invent any new phrasal verb.

Do NOT convert ordinary vocabulary words into idioms.

Each question must ask about the supplied phrase.

The correct answer must exactly match the supplied meaning.

Create three plausible distractors.

Every question MUST contain:

question
options
correctIndex
skill="vocabulary"
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

SECTION 4 MICRO SKILL

Generate exactly FIVE GMAT-style Sentence Correction questions.

Difficulty may vary.

At least TWO questions should be CAT/GMAT level.

The remaining questions may be moderate in difficulty provided they are completely correct, unambiguous, and professionally written.

Never sacrifice correctness, clarity, or natural English merely to increase difficulty.

Each question MUST have:

instruction
originalSentence
options (4 complete sentences)
correctIndex
skill="grammar"
explanation

Rules:

The instruction MUST always be one of:

- Choose the BEST revision.
- Which version expresses the intended meaning most precisely?
- Select the most effective sentence.
- Which sentence is grammatically and logically superior?

The originalSentence must always be displayed separately.

ALL four options must be COMPLETE SENTENCES.

Never split the original sentence into fragments.

Never create continuation options.

Never generate blanks.

Never hide the sentence inside an option.

Every option should independently replace the original sentence.

Each question must test ONLY ONE concept.

Use these concepts:

modifier placement
comparison
parallelism
pronoun reference
logical predication
meaning precision
idiomatic usage

No concept may repeat.

FINAL MICRO VALIDATION

Before returning any grammar question:

Reject the question if the primary error is:

- subject verb agreement
- neither/nor agreement
- either/or agreement
- basic tense selection
- simple parallelism
- obvious pronoun error

Replace it with a harder question.

For each grammar question:

Identify internally:

1. Primary concept tested
2. Whether all options appear grammatically acceptable
3. Whether meaning, not grammar, determines the answer

FINAL VALIDATION

Before returning JSON verify:

✓ no repeated nouns

✓ no repeated institutions

✓ no repeated animals

✓ no repeated scientific phenomena

✓ no repeated professions

✓ no repeated historical events

✓ grammar contains instructions

✓ grammar options are complete sentences

✓ vocabulary contexts unique

✓ speed topics unique

✓ RC topics unique

If ANY rule fails,

rewrite ONLY those questions.

Do not output until every check passe

FINAL VOCAB VALIDATION

For every Incorrect Usage question:

1. The question must NOT contain "A)", "B)", "C)", or "D)".
2. The question must NOT contain more than one example sentence.
3. The options array must contain exactly four complete sentences.
4. Every option must begin with a capital letter and end with a period.
5. If the question contains the answer choices instead of the options array, regenerate that question.

If not,
regenerate the question.
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
    temperature: 0.8,
    max_tokens: 8000
  });

  let workout;

try {
  const raw = completion.choices[0].message.content;

  if (!raw) {
    throw new Error("Empty response from OpenAI");
  }

  workout = JSON.parse(raw);

  if (workout.micro?.questions) {

  workout.micro.questions = workout.micro.questions.map(q => ({

    question:
      q.question ||
      q.instruction ||
      "Choose the best revision of the following sentence.",

    originalSentence:
      q.originalSentence ||
      "",

    options:
      Array.isArray(q.options)
        ? q.options
        : ["Option A","Option B","Option C","Option D"],

    correctIndex:
      typeof q.correctIndex === "number"
        ? q.correctIndex
        : 0,

    skill: "grammar",

    explanation:
      q.explanation || ""

  }));

}
  if (workout.vocab?.questions) {
  workout.vocab.questions =
    workout.vocab.questions.map(fixIncorrectUsageQuestion);
    console.log(
  "Vocab after repair:",
  workout.vocab.questions.length
);
}
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



// 🔥 VOCAB BACKUP VALIDATION
// if (workout.vocab.questions.length < 10) {
//   throw new Error("Bad vocab generation detected");
// }

workout.topicId = todaysTopics.id;
workout.vocabItems = todaysVocab;
workout.idiomItems = todaysIdioms;
workout.fillItems = todaysFillOpenings;

return workout;
}

// 🔥 MAIN

async function saveMemory(workout) {

  const today = new Date().toISOString().split("T")[0];
  const rows = [];

  // ---------- VOCAB ----------

(workout.vocab?.questions || []).forEach(q => {

  const word = extractVocabWord(q);

  if(word){

    rows.push({
      type:"vocab",
      value:word,
      last_used:today
    });

  }

});

  // ---------- RC ----------
 [workout.rc1, workout.rc2].forEach(rc => {

  if(rc?.questions?.length){

    rows.push({

      type:"rc",

      value:rc.questions[0].question
            .split(" ")
            .slice(0,8)
            .join(" ")
            .toLowerCase(),

      last_used:today

    });

  }

});

  // ---------- SPEED ----------
  (workout.speed?.questions || []).forEach(q=>{

  if(q.question){

    rows.push({

      type:"speed",

      value:q.question
          .split(" ")
          .slice(0,8)
          .join(" ")
          .toLowerCase(),

      last_used:today

    });

  }

});
(workout.micro?.questions || []).forEach((q, i) => {

  rows.push({
    type: "grammar",
    value: `${grammarConcept(q)}-${i}`,
    last_used: today
  });
});

  // ---------- GRAMMAR ----------

 const counts = {};

rows.forEach(r => {
  const key = `${r.type}-${r.value}`;
  counts[key] = (counts[key] || 0) + 1;
});

Object.entries(counts)
  .filter(([_, count]) => count > 1)
  .forEach(([key, count]) => {
    console.log("DUPLICATE:", key, count);
  });
  const uniqueRows = [

...new Map(

rows.map(r=>[`${r.type}-${r.value}`,r])

).values()

];

console.log("Rows:", rows.length);
console.log("Unique:", uniqueRows.length);
  const { error } = await supabase
    .from("workout_memory")
    .upsert(uniqueRows, {
      onConflict: "type,value"
    });

  if (error) {
    console.error(error);
    throw error;
  }


  console.log("Memory rows saved:", uniqueRows.length);

}

async function run() {

  const DAYS_TO_GENERATE = 5;

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

   let workout = null;
let validWorkout = null;
let attempts = 0;

    while (attempts < 3) {
      try {
        console.log(`👉 Attempt ${attempts + 1}`);
        workout = await generateWorkout();



       if (validateWorkout(workout)) {

  console.log("✅ Valid workout generated");

  validWorkout = workout;

  break;

}

console.log("❌ Invalid workout, retrying...");

      } catch (err) {
  console.log("❌ Generation failed:", err.message || err)
}

      attempts++;
    }

if (!validWorkout) {
  console.log("❌ Failed after 3 attempts. Skipping:", workoutDate);
  continue;
}

    await supabase
      .from("daily_workout_templates")
      .insert({
        workout_date: workoutDate,
        mode: "normal",
        content: validWorkout
      });
     await saveMemory(validWorkout);

await markTopicsUsed(validWorkout.topicId);

await markVocabUsed(validWorkout.vocabItems);

await markIdiomsUsed(validWorkout.idiomItems);

await markFillUsed(validWorkout.fillItems);

    console.log("💾 Saved:", workoutDate);

    // ✅ RATE LIMIT SAFETY
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("🎉 All workouts generated");
}
run();