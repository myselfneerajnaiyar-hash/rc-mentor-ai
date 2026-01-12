import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    if (!paragraph || typeof paragraph !== "string") {
      return NextResponse.json(
        { error: "Invalid paragraph" },
        { status: 400 }
      );
    }

    // Basic deterministic processing (no AI yet)
    const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);

    const explanation =
      "In simple terms, this paragraph is saying: " +
      sentences.slice(0, 2).join(" ").replace(/\s+/g, " ");

    const words = paragraph
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 6);

    const unique = Array.from(new Set(words)).slice(0, 4);

    const difficultWords = unique.map(w => ({
      word: w,
      meaning: `Here, "${w}" refers to an idea that may be unfamiliar or abstract for many readers.`,
    }));

    const primaryQuestion = {
      prompt: "What is the main role of this paragraph?",
      options: [
        "To introduce a new idea or claim",
        "To give a detailed example",
        "To contradict an earlier argument",
        "To summarize the entire passage",
      ],
      correctIndex: 0,
    };

    const easierQuestion = {
      prompt: "What is the author mainly doing in this paragraph?",
      options: [
        "Presenting an idea",
        "Telling a story",
        "Changing the topic",
        "Ending the discussion",
      ],
      correctIndex: 0,
    };

    return NextResponse.json({
      explanation,
      difficultWords,
      primaryQuestion,
      easierQuestion,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
