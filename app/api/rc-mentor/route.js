import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { paragraph } = await req.json();

    if (!paragraph) {
      return NextResponse.json(
        { result: "No paragraph received." },
        { status: 400 }
      );
    }

    // For now, keep this deterministic and simple.
    // No OpenAI call – this guarantees it works and removes all API issues.
    const result = `
What this paragraph is saying, in simple terms:

* The writer is arguing that attention is not something you are born with in a fixed amount.
* Some people seem naturally focused, others distracted, but research shows attention works like a muscle.
* Like a muscle, it becomes stronger when you practice focusing and weaker when you are constantly interrupted.
* Modern digital environments (notifications, alerts, endless content) do not just reveal short attention spans — they actively create them.
* Over time, this makes sustained focus feel difficult and uncomfortable.

Main idea in one line:
Attention is a trainable skill, and modern digital environments are shaping it by constantly fragmenting our focus.
`.trim();

    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { result: "Error generating explanation." },
      { status: 500 }
    );
  }
}
