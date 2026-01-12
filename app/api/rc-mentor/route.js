import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    if (!paragraph || !paragraph.trim()) {
      return NextResponse.json(
        { error: "No paragraph received" },
        { status: 400 }
      );
    }

    // --- Simple, deterministic logic (no OpenAI yet) ---
    // This guarantees:
    // 1) No 405 error
    // 2) Always valid JSON
    // 3) UI never breaks

    const explanation =
      "In simple terms, this paragraph explains the main idea in easier language. " +
      "It focuses only on the meaning of this paragraph and not the rest of the passage.";

    // Pick some “difficult” words heuristically
    const words = paragraph
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 8)
      .slice(0, 6);

    const difficultWords = words.map(w => ({
      word: w,
      meaning: A simpler meaning of "${w}" in this paragraph's context.,
    }));

    const question = {
      stem: "What is the main idea of this paragraph?",
      options: [
        "It describes a completely unrelated topic.",
        "It explains the central idea in a simple way.",
        "It gives only historical facts.",
        "It lists random examples.",
      ],
      answer: 1,
    };

    return NextResponse.json({
      explanation,
      difficultWords,
      question,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request or server error" },
      { status: 500 }
    );
  }
}
