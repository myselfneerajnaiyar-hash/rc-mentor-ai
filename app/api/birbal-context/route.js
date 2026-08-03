import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBirbalContext } from "@/lib/birbalContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const context = await getBirbalContext(
    supabase,
    userId
  );

  return NextResponse.json(context);
}