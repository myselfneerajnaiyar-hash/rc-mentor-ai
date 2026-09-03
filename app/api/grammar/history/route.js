import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { GRAMMAR_TOPIC_NAMES, requireGrammarAccess } from "@/lib/grammar/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const access = await requireGrammarAccess(request)
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Access denied" }, { status: access.status })
    const { data: attempts, error } = await supabaseAdmin.from("grammar_test_attempts").select("id,test_id,topic_id,difficulty,score,total_questions,accuracy,time_taken_seconds,completed_at").eq("user_id", access.user.id).eq("completed", true).order("completed_at", { ascending: false }).limit(20)
    if (error) throw error
    return NextResponse.json({ success: true, history: (attempts || []).map((item) => ({ attemptId: item.id, topicId: item.topic_id, topicName: GRAMMAR_TOPIC_NAMES[item.topic_id] || item.topic_id, difficulty: item.difficulty, score: item.score, totalQuestions: item.total_questions, accuracy: Number(item.accuracy || 0), timeTakenSec: item.time_taken_seconds || 0, completedAt: item.completed_at })) })
  } catch (error) {
    console.error("GRAMMAR HISTORY ERROR", error)
    return NextResponse.json({ error: "Unable to load practice history" }, { status: 500 })
  }
}
