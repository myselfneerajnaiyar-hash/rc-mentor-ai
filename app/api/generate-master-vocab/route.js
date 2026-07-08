import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  const prompt = `
Generate 300 high-frequency English vocabulary words useful for CAT, CLAT, GMAT, GRE and other competitive exams.

Return ONLY a JSON array.

Each object must have:

word
meaning
part_of_speech
usage
root
synonyms (comma separated)
antonyms (comma separated)
frequency (1-300)

Example:

[
{
"word":"aberration",
"meaning":"a deviation from what is normal",
"part_of_speech":"noun",
"usage":"The sudden drop in sales was an aberration.",
"root":"Latin aberrare",
"synonyms":"anomaly, deviation, irregularity",
"antonyms":"normality, regularity",
"frequency":300
}
]
`;

  const response = await client.chat.completions.create({
    model: "gpt-5.5",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return NextResponse.json(JSON.parse(response.choices[0].message.content));
}