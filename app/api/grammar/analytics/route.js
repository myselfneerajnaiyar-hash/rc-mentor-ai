import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { buildGrammarAnalytics, fetchAllPages } from "@/lib/grammar/analytics.mjs"
import { GRAMMAR_TOPIC_NAMES, requireGrammarAccess } from "@/lib/grammar/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const access = await requireGrammarAccess(request)
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Access denied" }, { status: access.status })
    const attempts = await fetchAllPages(async (from, to) => {
      const { data, error } = await supabaseAdmin.from("grammar_test_attempts")
        .select("id,topic_id,difficulty,score,total_questions,completed_at")
        .eq("user_id", access.user.id).eq("completed", true)
        .order("completed_at", { ascending: true }).order("id", { ascending: true }).range(from, to)
      if (error) throw error
      return data || []
    })
    const responses = []
    for (let offset = 0; offset < attempts.length; offset += 100) {
      const ids = attempts.slice(offset, offset + 100).map((item) => item.id)
      const { data, error } = await supabaseAdmin.from("grammar_question_attempts")
        .select("attempt_id,question_id,is_correct,time_taken_seconds")
        .eq("user_id", access.user.id).in("attempt_id", ids)
      if (error) throw error
      responses.push(...(data || []))
    }
    const questionMetadata = {}
    const questionIds = [...new Set(responses.map((item) => item.question_id).filter(Boolean))]
    for (let offset = 0; offset < questionIds.length; offset += 500) {
      const ids = questionIds.slice(offset, offset + 500)
      const { data, error } = await supabaseAdmin.from("grammar_questions")
        .select("id,topic_id,difficulty,question_type,primary_skill,subskill")
        .in("id", ids)
      if (error) throw error
      for (const item of data || []) questionMetadata[item.id] = item
    }
    return NextResponse.json({ success: true, analytics: buildGrammarAnalytics({ attempts, responses, questionMetadata, topicNames: GRAMMAR_TOPIC_NAMES }) })
  } catch (error) {
    console.error("GRAMMAR ANALYTICS ERROR", error)
    return NextResponse.json({ error: "Unable to load Grammar Analytics" }, { status: 500 })
  }
}
