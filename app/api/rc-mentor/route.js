import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    // Very basic word extraction (demo logic)
    const words = paragraph
      .split(/\W+/)
      .filter(w => w.length > 6)
      .slice(0, 5);

    const difficultWords = words.map(w => ({
      word: w,
      meaning: `A simpler meaning of "${w}" in this paragraph's context.`
    }));

    const explanation = `This paragraph explains the main idea in simple terms. It focuses on helping you understand the author's point without complex language.`;

    const question = {
      text: "What is the central idea of this paragraph?",
      options: [
        "Attention is fixed and cannot be changed",
        "Technology always improves focus",
        "Attention can be trained like a muscle",
        "Distraction has no impact on thinking"
      ],
      correct: 2
    };

    return NextResponse.json({
      explanation,
      difficultWords,
      question
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
