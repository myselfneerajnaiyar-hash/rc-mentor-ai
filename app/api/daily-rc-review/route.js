import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { requireCapability } from "@/lib/tenant/requireCapability"
import { DailyRcReviewError, loadDailyRcReview } from "@/lib/dailyRc/review"

export const dynamic = "force-dynamic"
export const revalidate = 0
const headers = { "Cache-Control": "private, no-store" }

export async function GET(request) {
  try {
    const access = await requireCapability(request, "showDailyRC")
    if (!access.ok) return NextResponse.json({ error: "Daily RC access required" }, { status: access.status, headers })
    const attemptId = new URL(request.url).searchParams.get("attemptId")
    if (!attemptId || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ error: "Choose an attempt from RC History" }, { status: 400, headers })
    }
    const review = await loadDailyRcReview(supabaseAdmin, access.identity.user.id, attemptId)
    return NextResponse.json(review, { headers })
  } catch (error) {
    return NextResponse.json({ error: error instanceof DailyRcReviewError ? error.message : "Unable to load this review" },
      { status: error instanceof DailyRcReviewError ? error.status : 500, headers })
  }
}
