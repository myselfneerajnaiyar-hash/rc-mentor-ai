import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { wpm = 180 } = body || {};

    const text =
      "The interplay between individual agency and social structure remains a central concern in sociology. " +
      "While traditional perspectives emphasize social forces, modern thought highlights personal choice. " +
      "Yet individuals operate within cultural and institutional constraints that both enable and restrict action. " +
      "Agency is therefore not rebellion against norms but navigation through them. " +
      "Socioeconomic conditions shape how much freedom one can actually exercise.";

    const questions = [
      {
        q: "What is the main idea of the passage?",
        options: [
          "Agency is unlimited",
          "Social structures are irrelevant",
          "Agency exists within constraints",
          "Traditions must be rejected",
        ],
        correct: 2,
      },
      {
        q: "What shapes individual freedom most?",
        options: [
          "Random chance",
          "Technology",
          "Socioeconomic conditions",
          "Biology",
        ],
        correct: 2,
      },
    ];

    return NextResponse.json({
      text,
      questions,
    });
  } catch (e) {
    console.error("Speed API error:", e);
    return NextResponse.json(
      { error: "Failed to generate" },
      { status: 500 }
    );
  }
}
