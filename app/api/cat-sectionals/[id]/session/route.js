import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireCATSectionalAccess } from "@/lib/tenant/requireCATSectionalAccess";

export async function POST(request, { params }) {
  const sectionalId = params.id;
  const access = await requireCATSectionalAccess(request, sectionalId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error || (access.status === 401 ? "Authentication required" : "CAT sectionals are not available for your exam") },
      { status: access.status },
    );
  }

  const userId = access.identity.user.id;
  const now = new Date().toISOString();
  const { data: activeSession, error: activeError } = await supabaseAdmin
    .from("cat_arena_sectional_sessions")
    .select("id,sectional_id,duration_seconds,started_at,expires_at")
    .eq("user_id", userId)
    .eq("sectional_id", sectionalId)
    .is("submitted_at", null)
    .gt("expires_at", now)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    return NextResponse.json({ error: "Could not resume the sectional session" }, { status: 500 });
  }
  if (activeSession) return NextResponse.json({ session: activeSession });

  const { data: session, error: insertError } = await supabaseAdmin
    .from("cat_arena_sectional_sessions")
    .insert({ user_id: userId, sectional_id: sectionalId })
    .select("id,sectional_id,duration_seconds,started_at,expires_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Could not start the sectional session" }, { status: 500 });
  }
  return NextResponse.json({ session }, { status: 201 });
}
