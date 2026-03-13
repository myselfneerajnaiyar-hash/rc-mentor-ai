import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {

  try {

    const today = new Date().toISOString().split("T")[0]

    // check if workout already exists
    const { data: existing } = await supabase
      .from("daily_workout_templates")
      .select("*")
      .eq("workout_date", today)
      .single()

    if (existing) {
      return NextResponse.json({
        status: "Workout already exists",
        data: existing
      })
    }

    // generate workout
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/get-daily-workout`,
      { cache: "no-store" }
    )

    const workout = await res.json()

    // save to supabase
    await supabase
      .from("daily_workout_templates")
      .insert({
        workout_date: today,
        mode: "normal",
        content: workout
      })

    return NextResponse.json({
      status: "Workout generated and saved",
      data: workout
    })

  } catch (err) {

    return NextResponse.json({
      status: "error",
      error: err.message
    })

  }

}
