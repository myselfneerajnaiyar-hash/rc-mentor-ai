import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const skills = [
  "main-idea",
  "detail",
  "inference",
  "tone",
  "purpose",
  "assumption",
  "next-paragraph",
  "function",
  "author-agreement"
]

const DRILLS_PER_COMBO = 10

function getSkillPairs() {
  const pairs = []

  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      pairs.push([skills[i], skills[j]])
    }
  }

  return pairs
}

async function generateDrill(skill1, skill2) {

  const prompt = `
You are a senior CAT VARC examiner designing high-quality reasoning drills.

Target skills:
${skill1}, ${skill2}

PASSAGE QUALITY REQUIREMENTS

Passages must resemble real CAT Reading Comprehension passages.

Acceptable domains include:
- philosophy
- psychology
- sociology
- economics
- anthropology
- political theory
- science history
- cultural studies
- technology ethics

Avoid simple factual topics like:
- animals
- geography
- environmental awareness
- school textbook facts

Passages must contain ideas, arguments, interpretations or debates.

QUESTION DESIGN

Questions must test reasoning such as:

- inference
- author agreement
- tone
- function
- assumption
- next paragraph prediction
- argumentative structure

Do NOT generate grammar questions.

OPTION DESIGN

Each question must have:

1 correct answer
3 trap answers.

Trap answers should mimic CAT traps:

- extreme interpretation
- outside scope
- partially correct but distorted
- reverse logic

Avoid obviously wrong options.

LENGTH RULES

Micro passage length: 80–120 words  
Mini RC passage length: 250–300 words

SESSION STRUCTURE

Generate:

8 micro drills.

Distribution:
4 questions testing ${skill1}
4 questions testing ${skill2}

Each micro drill must contain:

paragraph  
question  
options (4)  
correctIndex  
skill  

explanation:
{
  reasoning: "",
  why_correct: "",
  traps: [
    {
      optionIndex: 0,
      trap_type: "",
      reason: ""
    }
  ]
}

Then generate:

1 mini RC passage (250–300 words)

Create 2 questions testing:
${skill1} or ${skill2}

RETURN JSON EXACTLY IN THIS FORMAT

{
 "micro": [],
 "mini_rc": {
   "passage": "",
   "questions": []
 }
}

Return ONLY valid JSON.
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content: `
You are a strict JSON generator.

Rules:
- Return ONLY valid JSON
- No markdown
- No comments
- Ensure all JSON is valid
`
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
    max_tokens: 4000
  })

  const raw = completion.choices[0].message.content

  try {
    const drill = JSON.parse(raw)

    if (!Array.isArray(drill.micro)) return null
    if (!drill.mini_rc || !Array.isArray(drill.mini_rc.questions)) return null

    return drill

  } catch (err) {

    console.log("Invalid JSON returned")
    return null
  }
}

async function run() {

  const pairs = getSkillPairs()

  for (const [skill1, skill2] of pairs) {

    console.log("Generating drills for", skill1, "+", skill2)

    for (let i = 0; i < DRILLS_PER_COMBO; i++) {

      const drill = await generateDrill(skill1, skill2)

      if (!drill) {
        console.log("Skipped invalid drill")
        i--
        continue
      }

      await supabase
        .from("precision_drills")
        .insert({
          skill_1: skill1,
          skill_2: skill2,
          drill_data: drill
        })

      console.log("Saved drill", i + 1)

      await new Promise(r => setTimeout(r, 1500))
    }

  }

  console.log("All drills generated")
}

run()