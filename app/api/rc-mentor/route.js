import { NextResponse } from "next/server";

export async function POST(req) {
  return NextResponse.json({
    explanation: "This is a test explanation.",
    difficultWords: [
      { word: "test", meaning: "a trial" }
    ],
    question: "Test question?\nA) One\nB) Two\nC) Three\nD) Four\nCorrect answer: A"
  });
}
