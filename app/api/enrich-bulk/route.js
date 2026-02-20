import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { words, userId } = await req.json();

    if (!words || !userId || words.length === 0) {
      return NextResponse.json({ success: false });
    }

    for (const word of words) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Return strictly valid JSON. No markdown."
          },
          {
            role: "user",
            content: `
Provide meaning, partOfSpeech, word root (if known), 2 synonyms, 2 antonyms, and one usage sentence.

Word: ${word}

Return JSON:
{
  "meaning": "",
  "partOfSpeech": "",
  "root": "",
  "synonyms": [],
  "antonyms": [],
  "usage": ""
}
`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const data = JSON.parse(completion.choices[0].message.content);

      await supabase
        .from("user_words")
        .update({
          meaning: data.meaning || null,
          part_of_speech: data.partOfSpeech || null,
          root: data.root || null,
          usage: data.usage || null,
          synonyms: (data.synonyms || []).join(", "),
          antonyms: (data.antonyms || []).join(", "),
        })
        .eq("word", word)
        .eq("user_id", userId);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false });
  }
}