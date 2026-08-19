export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  allQuestions,
  authenticatedUser,
  loadSessionDrill,
  sanitizeDrill,
  sessionDeadline,
} from "@/lib/precision/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function resultFromRows(session, drill, rows) {
  const byQuestion = new Map((rows || []).map((row) => [row.question_id, row]))
  const questions = allQuestions(drill).map((question) => {
    const row = byQuestion.get(question.id)
    const selected = question.options.find((option) => option.text === row?.user_answer)
    return {
      ...question,
      options: question.options.map(({ isCorrect, ...option }) => option),
      correctOptionId: question.correctOptionId,
      selectedOptionId: selected?.id || null,
      responseStatus: row?.user_answer_index == null ? "skipped" : "answered",
      isCorrect: row?.is_correct === true,
      responseTimeSec: row?.time_taken_sec || 0,
      selectedTrapType: selected && !row?.is_correct ? selected.trapType : null,
      selectedTrapLabel: selected && !row?.is_correct ? selected.trapLabel : null,
      selectedTrapExplanation: selected && !row?.is_correct ? selected.trapExplanation : null,
    }
  })
  return {
    sessionId: session.id,
    score: Number(session.correct_answers || 0),
    total: Number(session.total_questions || questions.length),
    totalTimeSec: Number(session.time_taken_sec || 0),
    timedOut: session.difficulty === "precision_timed_out",
    targetSkills: drill.targetSkills || [],
    questions,
  }
}

export async function GET(req, { params }) {
  try {
    const user = await authenticatedUser(req, supabase)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: session, error } = await supabase
      .from("rc_sessions")
      .select("*")
      .eq("id", params.sessionId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const drill = await loadSessionDrill(session, supabase)
    if (session.correct_answers != null) {
      const { data: rows } = await supabase
        .from("rc_session_questions")
        .select("*")
        .eq("session_id", session.id)
      return NextResponse.json({ status: "complete", result: resultFromRows(session, drill, rows) })
    }

    const deadline = sessionDeadline(session)
    return NextResponse.json({
      status: deadline.getTime() <= Date.now() ? "expired" : "in_progress",
      sessionId: session.id,
      createdAt: session.created_at,
      expiresAt: deadline.toISOString(),
      drill: sanitizeDrill(drill),
    })
  } catch (error) {
    console.error("Precision restore failed", error)
    return NextResponse.json({ error: "Could not restore Precision session" }, { status: 500 })
  }
}
