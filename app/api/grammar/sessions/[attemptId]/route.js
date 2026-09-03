import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { GRAMMAR_TOPIC_NAMES, completedQuestion, getAttemptQuestions, requireGrammarAccess, sanitizeStoredQuestion } from "@/lib/grammar/server"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  try {
    const access = await requireGrammarAccess(request)
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Access denied" }, { status: access.status })

    const { attemptId } = await params
    const { data: attempt, error } = await supabaseAdmin.from("grammar_test_attempts").select("*").eq("id", attemptId).eq("user_id", access.user.id).maybeSingle()
    if (error) throw error
    if (!attempt) return NextResponse.json({ error: "Practice session not found" }, { status: 404 })

    const questions = await getAttemptQuestions(attempt, access.user.id)
    if (!questions.length) return NextResponse.json({ error: "This practice session has no questions" }, { status: 409 })
    const topicName = GRAMMAR_TOPIC_NAMES[attempt.topic_id] || attempt.topic_id

    if (!attempt.completed) {
      return NextResponse.json({ success: true, completed: false, attemptId: attempt.id, topicId: attempt.topic_id, topicName, difficulty: attempt.difficulty, questions: questions.map(sanitizeStoredQuestion) })
    }

    const { data: responses, error: responseError } = await supabaseAdmin.from("grammar_question_attempts").select("*").eq("attempt_id", attempt.id)
    if (responseError) throw responseError
    const byQuestion = new Map((responses || []).map((item) => [item.question_id, item]))
    return NextResponse.json({
      success: true,
      completed: true,
      attemptId: attempt.id,
      topicId: attempt.topic_id,
      topicName,
      difficulty: attempt.difficulty,
      score: attempt.score,
      totalQuestions: attempt.total_questions,
      accuracy: Number(attempt.accuracy || 0),
      timeTakenSec: attempt.time_taken_seconds || 0,
      questions: questions.map((question) => completedQuestion(question, byQuestion.get(question.id))),
    })
  } catch (error) {
    console.error("GRAMMAR SESSION GET ERROR", error)
    return NextResponse.json({ error: "Unable to load this practice session" }, { status: 500 })
  }
}
