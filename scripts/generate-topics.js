import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genres = [
  "Philosophy",
  "Psychology",
  "Economics",
  "Sociology",
  "History",
  "Political Theory",
  "Environmental Studies",
  "Technology & Society",
  "Ethics",
  "Literary Criticism",
  "Education",
  "Anthropology",
  "Behavioral Science",
  "Neuroscience",
  "Public Policy",
  "Culture Studies",
  "Media Studies",
  "Gender Studies",
  "Urban Studies",
  "Globalization",
  "Mixed (CAT-style)",
];

async function generateGenre(genre) {
  console.log(`\nGenerating topics for ${genre}...`);

  // Read existing topics
  const { data } = await supabase
    .from("rc_topics")
    .select("topic")
    .eq("genre", genre);

  const existingTopics =
    (data || []).map((x) => x.topic);

  const prompt =
genre === "Mixed (CAT-style)"
? `
You are designing a CAT Reading Comprehension curriculum.

Generate EXACTLY 10 NEW CAT-style RC topics.

Existing topics:

${existingTopics.join("\n")}

Rules:

- Do NOT repeat any existing topic.
- Cover multiple domains like philosophy, economics, sociology, anthropology, psychology, linguistics, AI, ecology, political theory, history, public policy, evolutionary biology, culture studies etc.
- Avoid textbook chapter names.
- Every topic should support a deep argumentative CAT RC passage.
- Prefer debates, paradoxes and conceptual discussions.
- Return ONLY valid JSON.

{
  "topics":[
    {
      "topic":"...",
      "prompt_seed":"..."
    }
  ]
}
`
: `
You are designing a CAT Reading Comprehension curriculum.

Genre:
${genre}

Existing topics:

${existingTopics.join("\n")}

Generate EXACTLY 10 NEW topics.

Rules:

- Do NOT repeat any existing topic.
- Avoid textbook chapter names.
- Every topic should support a deep argumentative CAT RC.
- Prefer abstract ideas, debates, paradoxes, contemporary issues and conceptual discussions.
- Avoid factual or descriptive themes.
- Every topic must be different.

Return ONLY valid JSON.

{
 "topics":[
   {
     "topic":"...",
     "prompt_seed":"..."
   }
 ]
}
`;

  const completion =
    await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are an expert CAT RC curriculum designer. Return JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1.1,
    });

  const text =
    completion.choices[0].message.content;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;

  const json = JSON.parse(text.slice(start, end));

  console.log(json.topics);

  const rows = json.topics.map((t) => ({
    genre,
    topic: t.topic,
    prompt_seed: t.prompt_seed,
  }));

  const { error } = await supabase
    .from("rc_topics")
    .upsert(rows, {
      onConflict: "genre,topic",
    });

  if (error) {
    console.log(error);
  } else {
    console.log(`Inserted ${rows.length} topics.`);
  }
}

async function main() {
  for (const genre of genres) {
    await generateGenre(genre);
  }

  console.log("\nDone.");
}

main();