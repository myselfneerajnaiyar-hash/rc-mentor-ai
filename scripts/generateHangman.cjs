require("dotenv").config({ path: ".env.local" });

const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

console.log("🔥 RUNNING FILE:", __filename);
console.log("🚀 Script started");

// ✅ OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔥 CONFIG
const difficulties = ["medium", "hard"];

const genres = [
  "psychology",
  "economics",
  "history",
  "philosophy",
  "technology",
  "behavioral science",
  "business strategy",
  "education",
  "society",
  "science",
];

// 🔥 GENERATE ONE PUZZLE
async function generatePuzzle(date, dayNumber) {

  const difficulty =
    difficulties[Math.floor(Math.random() * difficulties.length)];

  const genre =
    genres[Math.floor(Math.random() * genres.length)];

  console.log(`👉 Generating Day ${dayNumber} (${difficulty}, ${genre})`);

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.9,
    messages: [
      {
        role: "system",
        content: `
You are generating a HIGH-QUALITY CAT-level Reading Comprehension based Hangman puzzle.

Return ONLY valid JSON.

{
  "passage": "paragraph",
  "words": [
    { "answer": "WORD", "clue": "contextual clue" }
  ],
  "max_lives": number,
  "level": "medium or hard"
}

STRICT RULES:

PASSAGE:
- Topic: ${genre}
- CAT-level tone (NO story)
- Medium → analytical
- Hard → dense, abstract
- No childish tone

WORDS:
- Exactly 5 words
- Must be meaningful

CLUES:
- Context-based

LEVEL:
- ${difficulty}
`
      },
      {
        role: "user",
        content: `Generate a ${difficulty} difficulty puzzle`
      }
    ]
  });

  let text = response.choices[0].message.content;

  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  let puzzle;

  try {
    puzzle = JSON.parse(text);

    puzzle.level = difficulty;

    if (difficulty === "medium") puzzle.max_lives = 7;
    if (difficulty === "hard") puzzle.max_lives = 6;

    // ❌ Reject garbage
    if (!puzzle.passage || puzzle.passage.length < 120) {
      console.log("❌ Bad passage");
      return false;
    }

    if (!puzzle.words || puzzle.words.length !== 5) {
      console.log("❌ Bad words");
      return false;
    }

  } catch (err) {
    console.log("❌ JSON failed");
    return false;
  }

  // 💾 INSERT
  const { error } = await supabase
    .from("daily_hangman")
    .insert({
      passage: puzzle.passage,
      words: puzzle.words,
      max_lives: puzzle.max_lives,
      level: puzzle.level,
      date: date
    });

  if (error) {
    console.log("❌ Supabase error:", error.message);
    return false;
  }

  console.log(`✅ Inserted Day ${dayNumber}`);
  return true;
}

// 🔥 MAIN LOOP
async function run() {

  let generatedCount = 0;
  let dayOffset = 0;

  while (generatedCount < 100) {

    const baseDate = new Date();
    const puzzleDate = new Date(baseDate);
    puzzleDate.setDate(baseDate.getDate() + dayOffset);

    const formattedDate = puzzleDate.toISOString().split("T")[0];

    console.log(`🚀 Preparing Day ${dayOffset + 1}`);

    const success = await generatePuzzle(
      formattedDate,
      dayOffset + 1
    );

    if (!success) {
      console.log("❌ Retry same day...");
      continue;
    }

    generatedCount++;
    dayOffset++;
  }

  console.log("🎉 DONE");
}

// ✅ CALL OUTSIDE
run();