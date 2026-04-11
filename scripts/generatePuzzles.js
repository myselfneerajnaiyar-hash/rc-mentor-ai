import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

process.on("unhandledRejection", (err) => {
  console.error("❌ ERROR:", err);
});

// 🎯 PROMPT
function buildPrompt() {
  return `
Create a reading comprehension based word guessing game.

1. Write a passage (120-150 words)
2. Select EXACTLY 5 words from the passage
3. Words must:
   - Be present EXACTLY in passage
   - Be 5–8 letters
   - Be common English words

4. For each word, generate a clue

Return ONLY JSON:

{
  "passage": "...",
  "words": [
    { "answer": "WORD", "clue": "clue" }
  ]
}

Rules:
- Answers in UPPERCASE
- No extra text
`;
}

// 🔥 ONE PUZZLE
async function generateOnePuzzle() {
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You generate puzzles." },
        { role: "user", content: buildPrompt() }
      ],
      temperature: 0.7,
    });

    let text = res.choices[0].message.content;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(text);

    // ✅ VALIDATION
    if (!data.words || data.words.length !== 5) return null;

    const passage = data.passage.toUpperCase();

    for (let w of data.words) {
      if (!passage.includes(w.answer)) return null;
    }

    return {
      ...data,
      maxLives: 10
    };

  } catch (err) {
    console.log("❌ Failed:", err.message);
    return null;
  }
}

// 🚀 MAIN
async function main() {
  console.log("STARTING...");

  const puzzles = [];
  let attempts = 0;

  while (puzzles.length < 20 && attempts < 100) {
    attempts++;

    console.log("Generating:", puzzles.length);

    const puzzle = await generateOnePuzzle();

    if (puzzle) {
      puzzles.push(puzzle);
      console.log("✅ Added");
    }
  }

  fs.writeFileSync(
    "./app/data/puzzles.json",
    JSON.stringify(puzzles, null, 2)
  );

  console.log("DONE ✅");
}

main();