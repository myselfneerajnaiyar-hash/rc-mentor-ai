
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export async function POST(req) {
  try {
    const body = await req.json();

    const today = new Date().toISOString().split("T")[0];

    // 🔍 Check if already attempted
   const { data: existing, error: fetchError } = await supabase
  .from("hangman_attempts")
  .select("*")
  .eq("user_id", body.user_id)
  .eq("attempt_date", today)
  .maybeSingle();

   if (existing && !fetchError) {
      return Response.json({
        error: "already_attempted",
        score: existing.score,
        time_taken: existing.time_taken
      });
    }

    // ✅ Insert if not attempted
   const { error: insertError } = await supabase
  .from("hangman_attempts")
  .insert({ ...body });

if (insertError) {
  // 🔥 THIS IS THE REAL FIX
  if (insertError.message.includes("duplicate")) {
    return Response.json({
      error: "already_attempted"
    });
  }

  return Response.json({ error: insertError.message });
}

    if (error) {
      return Response.json({ error: error.message });
    }

    return Response.json({ success: true });

  } catch (err) {
    return Response.json({ error: err.message });
  }
}