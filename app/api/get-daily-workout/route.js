export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {

  try {

    const today = new Date().toISOString().split("T")[0]

    // CHECK CACHE
    const { data: existingWorkout } = await supabase
      .from("daily_workout_templates")
      .select("*")
      .eq("workout_date", today)
      .single()

    if (existingWorkout) {
      return NextResponse.json(existingWorkout.content)
    }

    let workout

    try {

      workout = await generateWorkout()

    } catch (err) {

      console.error("Workout generation failed",err)

      workout = {
        speed:{questions:[]},
        vocab:{questions:[]},
        rc1:{passage:"",questions:[]},
        rc2:{passage:"",questions:[]},
        micro:{questions:[]}
      }

    }

   if(
workout?.speed?.questions?.length === 10 &&
workout?.vocab?.questions?.length === 10 &&
workout?.micro?.questions?.length === 5
){

await supabase
.from("daily_workout_templates")
.upsert({
workout_date: today,
mode: "normal",
content: workout
})

}

    return NextResponse.json(workout)

  } catch (err) {

    console.error("Daily Workout API error:", err)

    return NextResponse.json({
      speed:{questions:[]},
      vocab:{questions:[]},
      rc1:{passage:"",questions:[]},
      rc2:{passage:"",questions:[]},
      micro:{questions:[]}
    })

  }

}

async function generateWorkout(){

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
    { role: "system", content: "Return ONLY valid JSON. No markdown. No explanations." },
    { role: "user", content: prompt }
  ],

  temperature: 0.6,
  max_tokens: 8000
})


const workout = JSON.parse(completion.choices[0].message.content)

if(!workout.speed) workout.speed = {questions:[]}
if(!workout.vocab) workout.vocab = {questions:[]}
if(!workout.rc1) workout.rc1 = {passage:"",questions:[]}
if(!workout.rc2) workout.rc2 = {passage:"",questions:[]}
if(!workout.micro) workout.micro = {questions:[]}

if(workout.micro?.questions){
  workout.micro.questions = workout.micro.questions.map(q => ({
    ...q,
    options: q.options || ["Option A","Option B","Option C","Option D"],
    correctIndex:
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
        ? q.correctIndex
        : 0
  }))
}

if(workout.rc1) workout.rc1.passage = enforceParagraphs(workout.rc1.passage)
if(workout.rc2) workout.rc2.passage = enforceParagraphs(workout.rc2.passage)

if(workout.speed?.questions){

workout.speed.questions = workout.speed.questions.map(q => {

if(!q.paragraph){

q.paragraph = "Read the following paragraph carefully before answering."

}

return q

})

}

if(workout.speed?.questions){
  workout.speed.questions =
    workout.speed.questions.map(shuffleQuestion)
}

if(workout.vocab?.questions){
  workout.vocab.questions =
    workout.vocab.questions.map(shuffleQuestion)
}

if(workout.micro?.questions){
  workout.micro.questions =
    workout.micro.questions.map(shuffleQuestion)
}

if(workout.rc1?.questions){
  workout.rc1.questions =
    workout.rc1.questions.map(shuffleQuestion)
}

if(workout.rc2?.questions){
  workout.rc2.questions =
    workout.rc2.questions.map(shuffleQuestion)
}

return workout

}

function shuffleQuestion(q) {

  if (!Array.isArray(q.options)) return q;

  const options = [...q.options]
  const correctValue = options[q.correctIndex]

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  q.options = options
  q.correctIndex = options.indexOf(correctValue)

  return q
}

function enforceParagraphs(text){

if(!text) return text

if(!text.includes("\n\n")){

const words = text.split(" ")
const chunks = []

for(let i=0;i<words.length;i+=110){

chunks.push(words.slice(i,i+110).join(" "))

}

return chunks.join("\n\n")

}

return text

}