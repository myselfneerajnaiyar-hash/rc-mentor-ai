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
  "moral psychology",
  "theory of evolution",
  "ancient navigation systems",
  "urban farming",
  "behavioral economics",
  "history of cryptography",
  "microplastics in oceans",
  "language extinction",
  "dark matter research",
  "renewable energy storage",
  "coffee cultivation",
  "medieval trade routes",
  "architecture of temples",
  "history of vaccination",
  "animal migration",
  "forensic science",
  "origins of money",
  "psychology of habit formation",
  "space debris",
  "arctic exploration",
  "evolution of maps",
  "history of clocks",
  "sustainable fashion",
  "coral reef ecosystems",
  "artificial intelligence ethics",
  "crowdsourcing",
  "bird communication",
  "history of libraries",
  "cultural anthropology",
  "human memory",
  "urban planning",
  "ocean currents",
  "volcanic eruptions",
  "history of taxation",
  "science of sleep",
  "digital privacy",
  "renewable architecture",
  "bee colonies",
  "history of printing",
  "supply chain networks",
  "astronomical observatories",
  "desert ecosystems",
  "history of museums",
  "blockchain applications",
  "economic inequality",
  "language acquisition",
  "scientific peer review",
  "marine archaeology",
  "future of transportation",
  "cognitive biases",
  "history of tea",
  "polar ecosystems",
  "quantum computing",
  "history of democracy",
  "public health systems",
  "food preservation",
  "social media psychology",
  "agricultural innovation",
  "renewable fuels",
  "history of paper",
  "machine learning",
  "ancient engineering",
  "wildlife conservation",
  "urban migration",
  "history of astronomy",
  "human evolution",
  "economic bubbles",
  "robotics in industry",
  "renewable materials",
  "water scarcity",
  "history of language families",
  "cultural diffusion",
  "ethics of genetic engineering",
  "history of railways",
  "fungal networks",
  "scientific revolutions",
  "history of insurance",
  "future of work",
  "deep sea exploration",
  "collective intelligence",
  "history of calendars",
  "archaeological dating methods",
  "circular economy",
  "renewable agriculture",
  "history of measurement",
  "science communication",
  "internet governance",
  "animal intelligence",
  "history of exploration",
  "ecosystem restoration",
  "economic globalization",
  "history of education",
  "biomimicry",
  "history of currencies",
  "planetary geology",
  "human cooperation",
  "history of transportation",
  "scientific skepticism",
  "urban resilience",
  "future energy systems",
  "decision making under uncertainty",
  "history of scientific instruments",
   "history of glassmaking",
  "ancient irrigation systems",
  "evolution of banking",
  "science of color perception",
  "history of perfume",
  "renewable desalination",
  "behavior of crowds",
  "history of postal systems",
  "scientific fraud detection",
  "economics of piracy",

  "history of lighthouses",
  "science of taste",
  "future of nuclear fusion",
  "history of silk trade",
  "urban heat islands",
  "economics of attention",
  "history of public parks",
  "animal tool use",
  "carbon capture technology",
  "history of accounting",

  "psychology of risk taking",
  "history of census systems",
  "science of resilience",
  "future of food production",
  "history of maritime trade",
  "economics of auctions",
  "history of photography",
  "evolution of transportation hubs",
  "digital archiving",
  "science of decision fatigue",

  "history of bridges",
  "economics of luxury goods",
  "forest ecology",
  "history of scientific expeditions",
  "human adaptation to climate",
  "science of creativity",
  "history of universities",
  "future of smart cities",
  "economics of migration",
  "history of agriculture",

  "science of curiosity",
  "history of weather forecasting",
  "renewable construction materials",
  "economics of reputation",
  "history of navigation instruments",
  "animal camouflage",
  "future of satellite networks",
  "history of census records",
  "science of perception",
  "economics of innovation",

  "history of metallurgy",
  "urban biodiversity",
  "science of cooperation",
  "history of diplomacy",
  "economics of scarcity",
  "future of autonomous systems",
  "history of sanitation",
  "behavioral finance",
  "science of aging",
  "history of festivals",

  "economics of tourism",
  "history of weather instruments",
  "science of language evolution",
  "future of synthetic biology",
  "history of journalism",
  "economics of trust",
  "urban ecosystems",
  "science of navigation",
  "history of textiles",
  "future of digital currencies",

  "economics of creativity",
  "history of shipbuilding",
  "science of adaptation",
  "history of water management",
  "future of renewable grids",
  "economics of networks",
  "science of expertise",
  "history of marketplaces",
  "future of biotechnology",
  "animal social structures",

  "history of cartography",
  "science of collective behavior",
  "economics of information",
  "future of space habitats",
  "history of legal systems",
  "science of learning",
  "urban sustainability",
  "economics of platforms",
  "history of scientific societies",
  "future of climate engineering",

  "science of imagination",
  "history of trade guilds",
  "economics of patents",
  "future of ocean exploration",
  "history of public health",
  "science of synchronization",
  "economics of incentives",
  "history of innovation",
  "future of human-machine collaboration",
  "science of forecasting"

];

function pickTopics() {
  return [...TOPIC_POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
}


// 🔥 GENERATE WORKOUT (YOUR LOGIC REUSED)
async function generateWorkout() {

  const { data: previousWorkouts } = await supabase
  .from("daily_workout_templates")
  .select("content, workout_date")
  .order("workout_date", { ascending: false })
  .limit(60);

 


const recentContentSnippets = [];

(previousWorkouts || []).forEach(day => {

  const content = day.content || {};

  (content.vocab?.questions || []).forEach(q => {
    recentContentSnippets.push(
      `VOCAB: ${q.question} | ${(q.options || []).join(" | ")}`
    );
  });

  (content.speed?.questions || []).forEach(q => {
    recentContentSnippets.push(
      `SPEED: ${(q.paragraph || "").slice(0,150)}`
    );
  });

  if (content.rc1?.passage) {
    recentContentSnippets.push(
      `RC: ${content.rc1.passage.slice(0,300)}`
    );
  }

  if (content.rc2?.passage) {
    recentContentSnippets.push(
      `RC: ${content.rc2.passage.slice(0,300)}`
    );
  }

});

const memoryBlock = `

RECENT WORKOUT CONTENT

${recentContentSnippets.slice(0,300).join("\n")}

CRITICAL NOVELTY RULE

Everything generated today must be substantially different.

DO NOT REPEAT:

- vocabulary words
- vocabulary contexts
- RC themes
- RC arguments
- RC viewpoints
- RC examples
- speed reading passages
- explanation structures

Novelty is mandatory.

If any vocabulary word, RC theme, RC argument,
speed-reading passage theme, or grammar pattern
appears in the previous content,
generate a completely different one.

Rephrasing is NOT sufficient.

Semantic duplication is forbidden.

`;

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
${memoryBlock}
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

SECTION 2 VOCABULARY

Generate exactly 10 questions.

Distribution:

- 4 Fill in the Blank
- 3 Incorrect Usage
- 3 Contextual Meaning

QUESTION TYPES

FILL IN THE BLANK

Use advanced editorial vocabulary.

Students must infer the word from context.


INCORRECT USAGE

Present four sentences.

The target word appears in every sentence.

One sentence uses the word incorrectly.

Students must identify the incorrect usage.

CONTEXTUAL MEANING

One CAT-style contextual interpretation question.

VOCABULARY SOURCE

Use vocabulary commonly found in:

- Economist
- Aeon
- Atlantic
- New Yorker
- CAT passages
- GMAT verbal

Avoid excessive philosophy jargon.

Avoid repeating words from previous workouts.

FORMAT

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

SECTION 4 MICRO REASONING

IMPORTANT:

Although this section is called MICRO REASONING,
generate ONLY elite GMAT-style Sentence Correction questions.

Generate exactly 5 questions.

FORMAT

question
options (4)
correctIndex
skill="grammar"
explanation

DIFFICULTY

Target GMAT Focus 705-765 level.

A CAT 99.5 percentile student should find at least TWO options genuinely attractive.

QUESTION DESIGN

The question stem must contain a complete sentence.

The sentence should already be reasonably well written.

The task is NOT to spot obvious grammatical mistakes.

The task is to identify the version that preserves the intended meaning with maximum precision.

OPTION DESIGN

All four options must initially appear correct.

No option may contain:

- obvious subject-verb disagreement
- obvious pronoun mistakes
- obvious tense errors
- broken English
- awkward nonsense phrasing

A student should NOT be able to eliminate any option instantly.

The difference between options must depend on:

- logical meaning
- modifier placement
- comparison logic
- reference clarity
- ambiguity
- parallel structure
- idiomatic precision
- concision

DISTRACTOR RULE

Wrong options must fail because they:

- subtly change meaning
- introduce ambiguity
- weaken logical comparison
- create unclear reference
- distort the intended relationship between ideas

NOT because they are visibly ungrammatical.

The strongest distractor should appear almost correct.

MEANING FIRST RULE

ABSOLUTELY FORBIDDEN QUESTION TYPES

Do NOT generate questions primarily testing:

- neither/nor agreement
- either/or agreement
- not only/but also parallelism
- simple subject verb agreement
- obvious pronoun errors
- basic tense corrections

These are too easy.

If a question can be solved by applying a single school-grammar rule,
discard it and generate a harder one.

At least 4 of the 5 questions must require
meaning analysis rather than grammar detection.

GMAT STYLE EXAMPLE

Bad:

Neither the manager nor the employees were...

Good:

Unlike previous studies that treated migration as a response to scarcity,
the new research argues that migration patterns often emerge
from perceptions of opportunity rather than actual shortages.

All four options should appear grammatically acceptable.
The correct answer should be chosen because it preserves
the intended logical relationship most precisely.

The correct answer must be correct primarily because it preserves the intended meaning.

Grammar should support meaning.

Grammar should not be the sole deciding factor.

BAD QUESTION EXAMPLE

The company have launched...

GOOD QUESTION EXAMPLE

The company, along with several subsidiaries, has launched...

where multiple options appear plausible and the distinction depends on meaning and structure.

VARIETY RULE

Across the 5 questions, cover different concepts:

- modifier placement
- comparisons
- parallelism
- logical predication
- pronoun reference
- concision
- idiomatic usage
- meaning precision

Do not repeat the same concept more than twice.

EXPLANATION RULE

Explain:

- the underlying concept
- the intended meaning
- why the correct answer preserves meaning
- why the strongest distractor is tempting
- the subtle flaw that makes the distractor incorrect

The explanation should resemble how an elite GMAT instructor teaches.

QUESTION QUALITY CHECK

Before finalizing each question:

- Would a school student eliminate options immediately? If yes, rewrite.
- Are at least two options plausible? If no, rewrite.
- Does the question test meaning rather than obvious grammar? If no, rewrite.
- Is the strongest distractor very attractive? If no, rewrite.

MODEL AFTER

Official GMAT Focus Edition Sentence Correction questions.

Avoid:

- school grammar
- CAT coaching grammar
- SSC grammar
- fill-in-the-blank grammar
- error spotting

Generate only authentic GMAT-style meaning-based sentence correction questions.

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