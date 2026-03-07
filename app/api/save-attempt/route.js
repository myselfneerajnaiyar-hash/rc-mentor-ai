import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const {
  totalScore,
  result,
  skillMap,
  totalQuestions,
  totalCorrect,
  totalWrong,
  accuracy,
  userResponses
} = body

    // 1️⃣ Get auth token
    const authHeader = req.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      )
    }

    const token = authHeader.replace("Bearer ", "")

    // 2️⃣ Validate user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }


    // 3️⃣ Prepare today's date
    const today = new Date().toISOString().split("T")[0]

    // 4️⃣ Insert attempt
  const { error: insertError } = await supabase
  .from("workout_attempts")
  .insert([
    {
      user_id: user.id,
      workout_date: today,
      mode: "daily",

      speed_score: result?.speed?.score ?? 0,
      vocab_score: result?.vocab?.score ?? 0,
      rc1_score: result?.rc1?.score ?? 0,
      rc2_score: result?.rc2?.score ?? 0,
      micro_score: result?.micro?.score ?? 0,

      total_score: totalScore ?? 0,

      // NEW ANALYTICS FIELDS
      total_questions: totalQuestions ?? 0,
      correct_count: totalCorrect ?? 0,
      wrong_count: totalWrong ?? 0,
      accuracy: accuracy ?? 0,
      skill_breakdown: skillMap ?? {},
      user_responses: userResponses ?? {},

      completed_at: new Date()
    }
  ])
    // 5️⃣ Handle errors
    if (insertError) {

      // Duplicate attempt (unique constraint violation)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already attempted today's workout." },
          { status: 400 }
        )
      }

      console.error("Insert error:", insertError)

      return NextResponse.json(
        { error: "Failed to save attempt." },
        { status: 500 }
      )
    }

   

const { data: profile } = await supabase
  .from("profiles")
  .select("streak_count, last_workout_date")
  .eq("user_id", user.id)
  .single()

let newStreak = 1

if (profile?.last_workout_date) {
  const lastDate = new Date(profile.last_workout_date)
  const diffDays = Math.floor(
    (new Date(today) - lastDate) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 1) {
    newStreak = (profile.streak_count || 0) + 1
  } else if (diffDays === 0) {
    newStreak = profile.streak_count // already counted today
  }
}

await supabase
  .from("profiles")
  .update({
    streak_count: newStreak,
    last_workout_date: today
  })
  .eq("user_id", user.id)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("Server error:", err)

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    )
  }
}