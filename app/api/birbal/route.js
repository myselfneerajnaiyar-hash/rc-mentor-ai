import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";


import { getBirbalContext } from "@/lib/birbalContext";
import { buildBirbalPrompt } from "@/lib/birbalPrompt";
import {
  getBirbalHistory,
  saveBirbalMessage
} from "@/lib/birbalHistory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `
You are Birbal, the official AI mentor of Auctor RC.

Always follow the product specification provided in the user prompt.

Never invent features.

Whenever you recommend any feature, append the correct action tag.

Examples:

<Action>START_WORKOUT</Action>

<Action>OPEN_EDITORIAL</Action>

<Action>START_RC</Action>

<Action>OPEN_ANALYTICS</Action>

Never invent action names.

Maximum two actions per response.
`;

export async function POST(req) {
  try {
    const body = await req.json();

    const userId = body.userId;
    const messages = body.messages || [];

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

   
    // --------------------------
    // Load Birbal Context
    // --------------------------

    const context = await getBirbalContext(
      supabase,
      userId
    );

    const history = await getBirbalHistory(
  supabase,
  userId
);

const includeSnapshot = history.length === 0;

if (messages.length > 0) {
  const lastMessage = messages[messages.length - 1];

  if (lastMessage.role === "user") {
    await saveBirbalMessage(
      supabase,
      userId,
      "user",
      lastMessage.content
    );
  }
}

    const passage = body.passage || "";
const contextual = body.contextual || false;

const question = body.question || "";
const options = body.options || [];
const correctIndex = body.correctIndex ?? null;

    console.log("PROFILE:", context.profile);

    // DEBUG MODE
if (body.debug) {
  return NextResponse.json({
    success: true,
    context
  });
}

    // --------------------------
    // Build Prompt
    // --------------------------

   const userPrompt = buildBirbalPrompt(
  {
    ...context,
    passage,
    contextual,
    question,
    options,
    correctIndex
  },
  includeSnapshot
);

    // --------------------------
    // Call GPT
    // --------------------------

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4.1-mini",
messages: [
  {
    role: "system",
    content: SYSTEM_PROMPT
  },
  {
    role: "user",
    content: userPrompt
  },
  ...history,
  ...messages.slice(-1)
]
      });

    const reply =
      completion.choices[0].message.content;

      console.log(reply);

      await saveBirbalMessage(
  supabase,
  userId,
  "assistant",
  reply
);

    return NextResponse.json({

      success: true,

      reply,

      context

    });

  }

  catch (err) {

    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message
      },
      {
        status: 500
      }
    );

  }

}

 