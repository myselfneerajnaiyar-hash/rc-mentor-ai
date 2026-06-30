import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    console.log("🔥 Birbal API called");
  try {
    const {
      attempts = [],
      rcAttempts = [],
      vaAttempts = [],
    } = await req.json();

    const prompt = `
You are Birbal, India's smartest CAT VARC mentor.

You are analysing a student's complete performance history.

Your task is NOT to praise the student.
Be brutally honest but motivating.

Analyse:

1. Overall score trend
2. Accuracy trend
3. Reading speed trend
4. Attempt behaviour
5. Strongest RC skills
6. Weakest RC skills
7. Vocabulary performance
8. Critical reasoning performance
9. Reading habits
10. Give actionable recommendations.

Return ONLY valid JSON.

Schema:

{
  "summary": "...",

  "strengths": [
    "...",
    "..."
  ],

  "weaknesses": [
    "...",
    "..."
  ],

  "recommendations": [
    "...",
    "...",
    "..."
  ],

  "motivation": "...",

  "nextFocus": "..."
}

Keep every point concise.
Maximum 2 sentences per field.
No markdown.
No explanation outside JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            attempts,
            rcAttempts,
            vaAttempts,
          }),
        },
      ],
    });

    const result = JSON.parse(
      completion.choices[0].message.content
    );

    console.log(result)

    return Response.json(result);
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}