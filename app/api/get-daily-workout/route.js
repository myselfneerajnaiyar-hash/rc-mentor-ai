export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)



export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("daily_workout_templates")
      .select("content")
      .eq("workout_date", today)
      .single()

    if (error || !data) {
      return NextResponse.json({
        error: "Workout not generated yet"
      }, { status: 404 })
    }

    return NextResponse.json(data.content)

  } catch (err) {
    console.error("Fetch error:", err)

    return NextResponse.json({
      error: "Something went wrong"
    }, { status: 500 })
  }
}
