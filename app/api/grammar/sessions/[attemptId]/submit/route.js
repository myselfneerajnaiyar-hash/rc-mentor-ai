import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { GRAMMAR_TOPIC_NAMES, completedQuestion, getAttemptQuestions, requireGrammarAccess } from "@/lib/grammar/server"

const clampSeconds = (value) => Math.max(0, Math.min(3600, Math.round(Number(value) || 0)))

export async function POST(request, { params }) {
  let claimedAttemptId = null
  let questionAttemptsInserted = false
  try {
    const access = await requireGrammarAccess(request)
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Access denied" }, { status: access.status })
    const { attemptId } = await params
    const body = await request.json()
    const responses = Array.isArray(body.responses) ? body.responses : []

    const { data: attempt, error } = await supabaseAdmin.from("grammar_test_attempts").select("*").eq("id", attemptId).eq("user_id", access.user.id).maybeSingle()
    if (error) throw error
    if (!attempt) return NextResponse.json({ error: "Practice session not found" }, { status: 404 })
    if (attempt.completed) return NextResponse.json({ error: "This practice session has already been submitted", completed: true }, { status: 409 })

    const questions = await getAttemptQuestions(attempt, access.user.id)
    if (responses.length !== questions.length) return NextResponse.json({ error: "Please answer every question before submitting" }, { status: 400 })

    const responseByQuestion = new Map(responses.map((item) => [item.questionId, item]))
    const invalid = questions.some((question) => {
      const response = responseByQuestion.get(question.id)
      return !response || !(question.options || []).some((option) => option.id === response.selectedOptionId)
    })
    if (invalid || responseByQuestion.size !== questions.length) return NextResponse.json({ error: "One or more answers are invalid" }, { status: 400 })

    const submittedAt = new Date().toISOString()
    const { data: claimed, error: claimError } = await supabaseAdmin.from("grammar_test_attempts").update({ submitted_at: submittedAt, last_activity_at: submittedAt }).eq("id", attempt.id).eq("user_id", access.user.id).eq("completed", false).is("submitted_at", null).select("id").maybeSingle()
    if (claimError) throw claimError
    if (!claimed) return NextResponse.json({ error: "This practice session is already being submitted" }, { status: 409 })
    claimedAttemptId = attempt.id

    const rows = questions.map((question) => {
      const response = responseByQuestion.get(question.id)
      const selected = question.options.find((option) => option.id === response.selectedOptionId)
      return { attempt_id: attempt.id, user_id: access.user.id, question_id: question.id, selected_answer: selected.label, selected_option_id: selected.id, is_correct: selected.id === question.correct_answer, time_taken_seconds: clampSeconds(response.responseTimeSec) }
    })
    const { data: saved, error: saveError } = await supabaseAdmin.from("grammar_question_attempts").insert(rows).select("*")
    if (saveError) throw saveError
    questionAttemptsInserted = true

    const score = saved.filter((item) => item.is_correct).length
    const totalTime = saved.reduce((sum, item) => sum + (item.time_taken_seconds || 0), 0)
    const accuracy = Number(((score / questions.length) * 100).toFixed(2))
    const completedAt = new Date().toISOString()
    const { error: completionError } = await supabaseAdmin.from("grammar_test_attempts").update({ score, accuracy, time_taken_seconds: totalTime, completed: true, completed_at: completedAt, last_activity_at: completedAt }).eq("id", attempt.id).eq("user_id", access.user.id)
    if (completionError) throw completionError

    const savedByQuestion = new Map(saved.map((item) => [item.question_id, item]))
    return NextResponse.json({ success: true, completed: true, attemptId: attempt.id, topicId: attempt.topic_id, topicName: GRAMMAR_TOPIC_NAMES[attempt.topic_id] || attempt.topic_id, difficulty: attempt.difficulty, score, totalQuestions: questions.length, accuracy, timeTakenSec: totalTime, questions: questions.map((question) => completedQuestion(question, savedByQuestion.get(question.id))) })
  } catch (error) {
    console.error("GRAMMAR SESSION SUBMIT ERROR", error)
    if (claimedAttemptId) {
      if (questionAttemptsInserted) await supabaseAdmin.from("grammar_question_attempts").delete().eq("attempt_id", claimedAttemptId)
      await supabaseAdmin.from("grammar_test_attempts").update({ submitted_at: null }).eq("id", claimedAttemptId).eq("completed", false)
    }
    return NextResponse.json({ error: "Unable to submit this practice session" }, { status: 500 })
  }
}
