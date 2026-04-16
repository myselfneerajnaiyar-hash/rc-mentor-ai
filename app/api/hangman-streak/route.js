import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return Response.json({ streak: 0, isActiveToday: false });
    }

    // 📥 Fetch all attempts (latest first)
    const { data, error } = await supabase
      .from("hangman_attempts")
      .select("attempt_date")
      .eq("user_id", user_id)
      .order("attempt_date", { ascending: false });

    if (error || !data || data.length === 0) {
      return Response.json({ streak: 0, isActiveToday: false });
    }

    // 🧠 Step 1: Normalize dates (YYYY-MM-DD) & remove duplicates
    const uniqueDates = [
      ...new Set(
        data.map((d) =>
          new Date(d.attempt_date).toISOString().split("T")[0]
        )
      ),
    ];

    let streak = 0;

    // 📅 Today & Yesterday (normalized)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const latestActivity = uniqueDates[0];

    // 🧠 Step 2: Check if streak is still valid
    if (latestActivity !== todayStr && latestActivity !== yesterdayStr) {
      return Response.json({
        streak: 0,
        isActiveToday: false,
      });
    }

    // 🧠 Step 3: Count streak
    let currentDate = new Date(latestActivity);

    for (let i = 0; i < uniqueDates.length; i++) {
      const dateStr = uniqueDates[i];
      const expectedStr = currentDate.toISOString().split("T")[0];

      if (dateStr === expectedStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 🎯 Step 4: Check if user played today
    const isActiveToday = latestActivity === todayStr;

    return Response.json({
      streak,
      isActiveToday,
    });

  } catch (err) {
    return Response.json({
      streak: 0,
      isActiveToday: false,
    });
  }
}