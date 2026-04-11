import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return Response.json({ streak: 0 });
    }

    // 📅 Get all attempt dates (latest first)
    const { data } = await supabase
      .from("hangman_attempts")
      .select("attempt_date")
      .eq("user_id", user_id)
      .order("attempt_date", { ascending: false });

    if (!data || data.length === 0) {
      return Response.json({ streak: 0 });
    }

   let streak = 0;
let expectedDate = new Date();

for (let i = 0; i < data.length; i++) {
  const attemptDate = new Date(data[i].attempt_date);

  const diff = Math.floor(
    (expectedDate - attemptDate) / (1000 * 60 * 60 * 24)
  );

  if (diff === 0) {
    // same day
    streak++;
  } else if (diff === 1) {
    // yesterday
    streak++;
    expectedDate = attemptDate;
  } else {
    break;
  }
}

    return Response.json({ streak });

  } catch (err) {
    return Response.json({ streak: 0 });
  }
}