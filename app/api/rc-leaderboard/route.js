import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
export async function GET(req) {
  try {
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
  .order("challenge_date", { ascending: false })
  .limit(1)
  .single()

console.log("todaySetError =", todaySetError)
console.log("todaySet =", todaySet)


if (!todaySet) {
  return NextResponse.json({
    top: [],
    yourRank: null,
    totalParticipants: 0
  })
}

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

  console.log("========== ALL TODAY DEBUG ==========")
console.log("todaySet.id =", todaySet.id)
console.log("allError =", allError)
console.log("allToday =", allToday)
console.log("allToday length =", allToday?.length)

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

    console.log("========== ATTEMPTS DEBUG ==========")
console.log("topError =", topError)
console.log("attempts =", attempts)
console.log("attempts length =", attempts?.length)

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

console.log("typeof top10 =", typeof top10)
console.log("top10 =", top10)
console.log("Array.isArray(top10) =", Array.isArray(top10))

      

    if (topError) {
      console.error(topError)
      return NextResponse.json({ error: topError }, { status: 500 })
    }


    console.log("=== RC LEADERBOARD DEBUG ===")
console.log("todaySet.id =", todaySet?.id)

console.log("allToday length =", allToday?.length)
console.log("allToday =", JSON.stringify(allToday))

console.log("attempts length =", attempts?.length)
console.log("attempts =", JSON.stringify(attempts))

console.log("profiles length =", profiles?.length)
console.log("profiles =", JSON.stringify(profiles))

console.log("top10 length =", top10?.length)
console.log("top10 =", JSON.stringify(top10))

console.log("totalParticipants =", totalParticipants)
console.log("=== END DEBUG ===")
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