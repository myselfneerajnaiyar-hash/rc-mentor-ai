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

    const sentences = paragraph.split(/(?<=[.!?])\s+/);

    const explanation = sentences.slice(0, 2).join(" ").replace(/\s+/g, " ");

    const words = paragraph
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 6);

    const unique = Array.from(new Set(words)).slice(0, 5);

    const difficultWords = unique.map(w => ({
      word: w,
      meaning: `In this paragraph, "${w}" refers to an important idea that may be unfamiliar or complex for readers.`,
    }));

    const question =
      "According to this paragraph, why is attention compared to a muscle rather than a fixed trait?";

    return NextResponse.json({
      explanation,
      difficultWords,
      question,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
