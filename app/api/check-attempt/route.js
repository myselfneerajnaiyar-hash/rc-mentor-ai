import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ attempted: false }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ attempted: false }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
  .from("workout_attempts")
  .select("*")
  .eq("user_id", user.id)
  .eq("workout_date", today)
  .single()

return NextResponse.json({
  attempted: !!data,
  attempt: data || null
})
}