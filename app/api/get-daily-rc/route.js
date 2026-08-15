export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireCapability } from "@/lib/tenant/requireCapability";

import { createClient }
from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {

const access = await requireCapability(request, "showDailyRC");
if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Daily RC is not available for your exam" }, { status: access.status });

const today = new Date(
  Date.now() + 5.5 * 60 * 60 * 1000
)
  .toISOString()
  .split("T")[0];

console.log("IST DATE:", today);

  const url = new URL(request.url);

  if (url.searchParams.get("view") === "previous") {
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;
    const status = url.searchParams.get("status") === "attempted" ? "attempted" : "unattempted";

    let attemptsBySet = new Map();
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: attempts } = await supabase
          .from("daily_rc_attempts")
          .select("id,daily_rc_set_id,completed_at,accuracy,time_taken,score")
          .eq("user_id", user.id);
        attemptsBySet = new Map((attempts || []).map((attempt) => [attempt.daily_rc_set_id, attempt]));
      }
    }

    const attemptedSetIds = [...attemptsBySet.keys()];
    if (status === "attempted" && attemptedSetIds.length === 0) {
      return NextResponse.json({ success: true, challenges: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } });
    }

    let setsQuery = supabase
      .from("daily_rc_sets")
      .select("id,title,challenge_date,difficulty,source_year", { count: "exact" })
      .lt("challenge_date", today);

    if (status === "attempted") setsQuery = setsQuery.in("id", attemptedSetIds);
    if (status === "unattempted" && attemptedSetIds.length) setsQuery = setsQuery.not("id", "in", `(${attemptedSetIds.join(",")})`);

    const { data: sets, error: setsError, count } = await setsQuery
      .order("challenge_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (setsError) {
      return NextResponse.json({ success: false, error: setsError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      challenges: (sets || []).map((set) => ({
        id: set.id,
        title: set.title,
        challenge_date: set.challenge_date,
        difficulty: set.difficulty || null,
        source_year: set.source_year || null,
        attempt: attemptsBySet.get(set.id) || null,
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
      },
    });
  }

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
