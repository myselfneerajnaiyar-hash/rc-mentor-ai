import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req) {

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

        model: "gpt-4.1-mini",

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

    const parsed = JSON.parse(raw)

    return Response.json(parsed)

  } catch (err) {

    console.log(err)

    return Response.json({
      error: "Birbal AI failed"
    })
  }
}