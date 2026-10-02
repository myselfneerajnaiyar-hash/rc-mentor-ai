import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireCapability } from "@/lib/tenant/requireCapability"
import { normalizeDailyRcCategory } from "@/lib/dailyRc/categories.mjs"
import { dailyRcTodayDate } from "@/lib/dailyRc/today.mjs"
import { loadDailyRcLeaderboard } from "@/lib/dailyRc/leaderboard.mjs"

export const dynamic = "force-dynamic"
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export async function GET(req) {
  try {
    const access = await requireCapability(req, "showDailyRC")
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Authentication required" : "Daily RC is not available for your exam" },
        { status: access.status },
      )
    }

    const category = normalizeDailyRcCategory(new URL(req.url).searchParams.get("category"))
    const today = dailyRcTodayDate()
    const result = await loadDailyRcLeaderboard(supabase, {
      category,
      today,
      currentUserId: access.identity.user.id,
    })

    if (result.error) {
      console.error("[rc-leaderboard] Query failed", {
        stage: result.stage,
        category,
        challengeDate: today,
        code: result.error.code,
        message: result.error.message,
      })
      return NextResponse.json(
        { error: "Could not load the RC leaderboard. Please try again.", code: "RC_LEADERBOARD_QUERY_FAILED" },
        { status: 500 },
      )
    }

    if (result.profileError) {
      console.error("[rc-leaderboard] Profile lookup failed", {
        code: result.profileError.code,
        message: result.profileError.message,
      })
    }

    if (category === "daily_rc_challenge" && result.data.totalParticipants === 0) {
      console.warn("[rc-leaderboard] Empty Daily RC Challenge leaderboard", {
        category,
        challengeDate: today,
        setId: result.selectedSetId || null,
        participantCount: 0,
      })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error("[rc-leaderboard] Unexpected failure", {
      message: err instanceof Error ? err.message : "Unknown error",
    })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
