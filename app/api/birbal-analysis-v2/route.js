import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
    console.log("ROUTE HIT")

  try {

    const formData = await req.formData()

    const files = formData.getAll("files")

    const imageParts = await Promise.all(

      files.map(async (file) => {

        const bytes = await file.arrayBuffer()

        console.log(
  "FILE SIZE:",
  file.name,
  Math.round(file.size / 1024),
  "KB"
)

        const base64 = Buffer.from(bytes).toString("base64")

        return {
          type: "image_url",
          image_url: {
            url: `data:${file.type};base64,${base64}`,
          },
        }
      })
    )

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4.1",

        response_format: {
          type: "json_object"
        },

        messages: [

          {
            role: "system",
            content: `
You are Birbal AI.

You are the world's best CAT VARC editorial mentor.

Your job:
- read editorial screenshots directly
- preserve exact paragraph flow
- reconstruct text accurately
- detect author intent
- explain reading psychology
- explain CAT traps
- explain directional words
- explain inference logic

VERY IMPORTANT:

- Do NOT hallucinate text
- Do NOT invent paragraphs
- Preserve paragraph structure
- Keep original meaning intact
- Teach weak students HOW expert readers think

Be detailed, educational, inferential and nuanced.
Do not compress explanations into short summaries.
Every explanation should feel like a premium CAT mentor is teaching the student.
Vocabulary explanations should be rich and contextual.

"title" should be a smart editorial headline.

Rules:
- maximum 8 words
- should sound like a newspaper/editorial title
- should summarize the core issue intelligently
- never use generic titles

Return ONLY valid JSON.
`
          },

          {
            role: "user",

            content: [

              {
                type: "text",

                text: `
Analyze these editorial screenshots.

Return JSON:

{
  "title": "",

  "cleanedPassage": [
    {
      "paragraphNumber": 1,
      "text": ""
    }
  ],

  "centralDebate": "",

  "authorPositioning": {
    "coreIdea": "",
    "whatAuthorSupports": "",
    "whatAuthorQuestions": "",
    "hiddenAssumption": "",
    "readingDanger": ""
  },

 "passageFlow": [
  "STRICT RULE: Create EXACTLY ONE flow point per paragraph.

   Each flow point should deeply explain:
   - what the paragraph is doing
   - how the author's argument evolves
   - how the paragraph connects to previous ideas
   - why this movement matters in CAT reading

   Flow explanations should feel rich and intelligent,
   not short summaries."
],

  "paragraphs": [

  {
    "paragraphNumber": 1,

    "paragraphPsychology": {

      "actualMeaning": "",

      "authorIntent": "",

      "studentTrap": "",

      "catTestAngle": ""

    },

    "directionalWords": [

      {
        "word": "",
        "meaning": ""
      }

    ]
  }

],

 "vocabulary": [

  {
    "word": "",

    "partOfSpeech": "",

    "contextualMeaning": "",

    "simpleMeaning": "",

    "synonyms": [],

    "antonyms": [],

    "rootWord": "",

    "whyAuthorUsedIt": "",

    "applicationSentence": ""
  }

]
}
`
              },

              ...imageParts

            ]
          }

        ],

        temperature: 0.3

      })

  const raw =
  completion.choices[0].message.content

console.log("RAW OPENAI RESPONSE:")
console.log(raw)

if (!raw) {

  return Response.json({
    error: "Empty AI response"
  })
}

let parsed

try {

  parsed = JSON.parse(raw)

} catch (e) {

  console.log("JSON PARSE FAILED")
  console.log(e)

  return Response.json({
    error: "AI returned invalid JSON"
  })
}

if (!parsed.cleanedPassage) {

  return Response.json({
    error: "Missing cleanedPassage"
  })
}

/* GENERATE METADATA */

const fullText =
  parsed.cleanedPassage
    ?.map(p => p.text)
    .join(" ") || ""

const totalWords =
  fullText.trim().split(/\s+/).length

const readingTime =
  Math.ceil(totalWords / 180)

const avgWordLength =
  totalWords
    ? fullText.length / totalWords
    : 0

let readingDifficulty = "Easy"

if (avgWordLength > 5.8)
  readingDifficulty = "Medium"

if (avgWordLength > 6.3)
  readingDifficulty = "Hard"

if (avgWordLength > 7)
  readingDifficulty = "CAT Killer"

const inferenceDensity =
  parsed?.paragraphs?.length
    ? Math.min(
        100,
        parsed.paragraphs.length * 18
      )
    : 50

let trapProbability = "Low"

if (inferenceDensity > 40)
  trapProbability = "Medium"

if (inferenceDensity > 65)
  trapProbability = "High"

if (inferenceDensity > 85)
  trapProbability = "Deadly"


/* SAVE SESSION */

const { data: savedSession, error } =
  await supabase
    .from("editorial_history")

    .insert({
  analysis: parsed,

  extracted_text:
    parsed.cleanedPassage
      ?.map(p => p.text)
      .join(" "),

  title: parsed.title,

  readingDifficulty,

  readingTime,

  inferenceDensity,

  trapProbability
})
    .select()
    .single()

    console.log("SUPABASE SAVE RESULT")
console.log(savedSession)
console.log(error)

if (error) {

  console.log("SUPABASE ERROR:", error)

  return Response.json({
    error: error.message
  })
}

console.log("FINAL SESSION:", savedSession)
return Response.json({
  analysis: parsed,
  sessionId: savedSession.id || null
})

  } catch (err) {

    console.log(err)

    return Response.json({
      error: "Birbal AI failed"
    })
  }
}