import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireCapability } from "@/lib/tenant/requireCapability";

const STATIC_SECTIONAL_ID = /^sectional-(?:0[1-9]|10)$/;

export async function POST(request, { params }) {
  const access = await requireCapability(request, "showCATSectionals");
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Authentication required" : "CAT sectionals are not available for your exam" },
      { status: access.status },
    );
  }

  const sectionalId = params.id;
  if (!STATIC_SECTIONAL_ID.test(sectionalId)) {
    const { data: sectional, error: sectionalError } = await supabaseAdmin
      .from("sectional_test_content")
      .select("id")
      .eq("id", sectionalId)
      .eq("exam", "CAT")
      .eq("is_published", true)
      .maybeSingle();

    if (sectionalError) {
      return NextResponse.json({ error: "Could not load the sectional" }, { status: 500 });
    }
    if (!sectional) {
      return NextResponse.json({ error: "CAT sectional not found" }, { status: 404 });
    }
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
