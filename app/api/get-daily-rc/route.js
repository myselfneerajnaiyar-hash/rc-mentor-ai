import { NextResponse } from "next/server";

import { createClient }
from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const { data, error } =
    await supabase

      .from("daily_rc_sets")

      .select(`
        *,
        daily_rc_questions (*)
      `)

      .eq(
        "challenge_date",
        today
      )

      .single();

  if (error) {

    return NextResponse.json({
      success: false,
      error: error.message
    });
  }

  return NextResponse.json({

    success: true,

    challenge: data

  });
}