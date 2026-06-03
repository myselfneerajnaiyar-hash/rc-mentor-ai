export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {

  const { data } = await supabase
    .from("profiles")
    .select(`
      user_id,
      name,
      daily_rc_streak,
      championship_points
    `)
    .order("championship_points", {
      ascending: false
    });

  return NextResponse.json({
    top5: data.slice(0, 5),
    allPlayers: data
  });
}