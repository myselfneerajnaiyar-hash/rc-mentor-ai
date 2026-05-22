import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})



export async function POST(req) {

  try {

    const body = await req.json()

   const text = body.text



    const completion =
      await openai.chat.completions.create({

        model: "gpt-4.1-mini",

        messages: [

          {
            role: "system",
            content: `
You are Birbal AI.

You are NOT a summarizer.

You are the world's best CAT VARC editorial mentor.

Do not explain like ChatGPT.

Explain like an elite CAT mentor teaching a weak but intelligent student.

Your explanation must feel like:
- real classroom teaching
- real reading psychology
- deep reasoning
- cognitive guidance

For every paragraph:
- explain WHY specific words matter
- explain HOW the author's stance shifts
- explain WHY a student may misunderstand
- explain HOW CAT creates trap interpretations
- explain directional signals like:
  but, however, yet, despite, unfortunately, surprisingly, therefore, although

Teach the student HOW to think while reading.

Do NOT sound robotic.

Your job is to teach weak students HOW to think while reading editorials.

You specialize in:
- author intent
- hidden assumptions
- inference logic
- tone detection
- paragraph purpose
- CAT traps
- directional words
- elimination logic
- ideological positioning

You must explain in:
- simple language
- deep reasoning
- elite reading psychology

The student should feel:
"Now I finally understand HOW expert readers think."

DO NOT give generic summaries.

Teach paragraph-by-paragraph cognition.
`
          },

          {
            role: "user",
           content: `

Below is raw OCR extracted from editorial screenshots.

The OCR may contain:
- broken words
- merged lines
- OCR garbage
- browser junk
- spacing issues
- missing punctuation
- distorted formatting

FIRST:
Reconstruct the original editorial accurately.

SECOND:
Split the editorial into logical paragraphs.

THIRD:
Perform deep CAT VARC cognition analysis.

RAW OCR:

${text}

IMPORTANT:

Do NOT summarize.

Preserve the author's wording and meaning.

Return ONLY valid JSON.

JSON FORMAT:

{
  "cleanedPassage": [
    {
      "paragraphNumber": 1,
      "text": ""
    }
  ],

  "overallIntent": "",
  "overallTone": "",

  "authorStance": {
    "government": "",
    "policy": "",
    "economy": "",
    "overallBias": ""
  },

  "passageFlow": [],

  "paragraphs": [

    {
      "paragraphNumber": 1,

      "original": "",

      "simpleExplanation": "",

      "authorMove": "",

      "inference": "",

      "whatNotToInfer": "",

      "paragraphPurpose": "",

      "trapWarning": "",

      "trapOptions": [

        {
          "fakeConclusion": "",
          "whyStudentsFallForIt": "",
          "whyItIsWrong": ""
        }

      ],

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
    "meaning": ""
  }
]
}

`
          }

        ],

        temperature: 0.7

      })

    const raw =
      completion.choices[0].message.content

    const cleaned =
      raw.replace(/```json/g, "")
         .replace(/```/g, "")
         .trim()

    const parsed = JSON.parse(cleaned)
    

    return Response.json(parsed)

  } catch (err) {

    console.log(err)

    return Response.json({
      error: "Birbal AI analysis failed"
    })

  }
}