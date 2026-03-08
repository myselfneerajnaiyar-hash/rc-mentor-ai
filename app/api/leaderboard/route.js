import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
export async function GET(req) {
  try {
    const today = new Date().toISOString().split("T")[0]

    // ----- Get auth token -----
    const authHeader = req.headers.get("authorization")
    let currentUserId = null

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const {
        data: { user }
      } = await supabase.auth.getUser(token)

      currentUserId = user?.id || null
    }

    // ----- Get ALL attempts today (for ranking logic) -----
    const { data: allToday, error: allError } = await supabase
      .from("workout_attempts")
      .select("user_id, total_score")
      .eq("workout_date", today)
      .eq("mode", "daily")
      .order("total_score", { ascending: false })

    if (allError) {
      console.error(allError)
      return NextResponse.json({ error: allError }, { status: 500 })
    }

    const totalParticipants = allToday?.length || 0

    let yourRank = null

    if (currentUserId && allToday) {
      allToday.forEach((row, index) => {
        if (row.user_id === currentUserId) {
          yourRank = index + 1
        }
      })
    }

    // ----- Get Top 10 with profile names -----
   const { data: attempts, error: topError } = await supabase
  .from("workout_attempts")
  .select("user_id, total_score")
  .eq("workout_date", today)
  .eq("mode", "daily")
  .order("total_score", { ascending: false })
  .limit(10)

if (topError) {
  console.error(topError)
  return NextResponse.json({ error: topError }, { status: 500 })
}

// AFTER query finishes
const userIds = (attempts || []).map(a => a.user_id)

const { data: profiles } = await supabase
  .from("profiles")
  .select("user_id, name")
  .in("user_id", userIds)

  console.log("Profiles returned:", profiles)


const profileMap = {}

profiles?.forEach(p => {
  profileMap[p.user_id] = p.name
})

const top10 = (attempts || []).map(a => ({
  ...a,
  profiles: {
    name: profileMap[a.user_id] || "Reader"
  }
}))
      

    if (topError) {
      console.error(topError)
      return NextResponse.json({ error: topError }, { status: 500 })
    }

    return NextResponse.json({
      top: top10 || [],
      yourRank,
      totalParticipants
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}