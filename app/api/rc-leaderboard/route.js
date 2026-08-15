import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireCapability } from "@/lib/tenant/requireCapability"
export const dynamic = "force-dynamic"
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
export async function GET(req) {
  try {
   const access = await requireCapability(req, "showDailyRC")
   if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Daily RC is not available for your exam" }, { status: access.status })
   const today = new Date()
  .toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  })




const {
  data: todaySet,
  error: todaySetError
} = await supabase
  .from("daily_rc_sets")
  .select("id")
  .eq("challenge_date", today)
  .single()

console.log("today =", today)


if (!todaySet) {
  return NextResponse.json({
    top: [],
    yourRank: null,
    totalParticipants: 0
  })
}

    // ----- Get auth token -----
    const currentUserId = access.identity.user.id

    // ----- Get ALL attempts today (for ranking logic) -----
 const { data: allToday, error: allError } = await supabase
  .from("daily_rc_attempts")
  .select(`
    user_id,
    score,
    time_taken
  `)
  .eq(
    "daily_rc_set_id",
    todaySet.id
  )
  .order("score", {
    ascending: false
  })
  .order("time_taken", {
    ascending: true
  })


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
  const { data: attempts, error: topError } =
  await supabase
    .from("daily_rc_attempts")
    .select(`
      user_id,
      score,
      time_taken
    `)
    .eq(
      "daily_rc_set_id",
      todaySet.id
    )
    .order("score", {
      ascending: false
    })
    .order("time_taken", {
      ascending: true
    })
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
