export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  allQuestions,
  authenticatedUser,
  loadSessionDrill,
  sessionDeadline,
} from "@/lib/precision/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function explanationText(explanation) {
  return [explanation?.reasoning, explanation?.why_correct].filter(Boolean).join("\n\n")
}

function whyWrong(question) {
  const output = {}
  question.options.forEach((option, index) => {
    if (!option.isCorrect && option.trapReason) output[index] = option.trapReason
  })
  return output
}

export async function POST(req, { params }) {
  try {
    const user = await authenticatedUser(req, supabase)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { responses = [] } = await req.json()
    const { data: session } = await supabase
      .from("rc_sessions")
      .select("*")
      .eq("id", params.sessionId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
    if (session.correct_answers != null) {
      return NextResponse.json({ duplicate: true, sessionId: session.id }, { status: 409 })
    }

    const drill = await loadSessionDrill(session, supabase)
    const questions = allQuestions(drill)
    const responseMap = new Map(responses.map((response) => [response.questionId, response]))
    const elapsedSec = Math.max(0, Math.round((Date.now() - new Date(session.created_at).getTime()) / 1000))
    const timedOut = sessionDeadline(session).getTime() <= Date.now()

    const submittedIds = new Set(responses.map((response) => response.questionId))
    if ([...submittedIds].some((id) => !questions.some((question) => question.id === id))) {
      return NextResponse.json({ error: "Submission contains an unknown question" }, { status: 400 })
    }

    const normalized = questions.map((question) => {
      const response = responseMap.get(question.id) || {}
      const selected = question.options.find((option) => option.id === response.selectedOptionId)
      if (response.selectedOptionId && !selected) throw new Error("Invalid option submitted")
      const responseTimeSec = Math.min(
        elapsedSec,
        Math.max(0, Math.round(Number(response.responseTimeSec) || 0))
      )
      return {
        question,
        selected,
        responseTimeSec,
        responseStatus: selected ? "answered" : "skipped",
        isCorrect: selected?.id === question.correctOptionId,
      }
    })

    const submittedTime = normalized.reduce((sum, item) => sum + item.responseTimeSec, 0)
    if (submittedTime > elapsedSec + 30) {
      return NextResponse.json({ error: "Submitted timing is inconsistent with the session" }, { status: 400 })
    }

    const score = normalized.filter((item) => item.isCorrect).length
    const totalTimeSec = Math.min(elapsedSec, submittedTime || elapsedSec)

    const { data: claimed } = await supabase
      .from("rc_sessions")
      .update({ time_taken_sec: -1 })
      .eq("id", session.id)
      .eq("user_id", user.id)
      .is("correct_answers", null)
      .is("time_taken_sec", null)
      .select("id")

    if (!claimed?.length) {
      return NextResponse.json({ duplicate: true, sessionId: session.id }, { status: 409 })
    }

    const detailRows = normalized.map(({ question, selected, responseTimeSec, isCorrect }) => ({
      session_id: session.id,
      question_id: question.id,
      question_text: question.question,
      options: question.options.map((option) => option.text),
      correct_answer: question.options.find((option) => option.id === question.correctOptionId)?.text || "",
      correct_answer_index: question.options.findIndex((option) => option.id === question.correctOptionId),
      explanation: explanationText(question.explanation),
      user_answer: selected?.text || null,
      user_answer_index: selected ? question.options.findIndex((option) => option.id === selected.id) : null,
      time_taken_sec: responseTimeSec,
      question_type: question.rawSkill,
      is_correct: isCorrect,
      temptation: selected && !isCorrect ? selected.trapType || selected.rawTrapType || null : null,
      why_wrong: whyWrong(question),
    }))

    const compatibilityRows = normalized.map(({ question, responseTimeSec, isCorrect }) => ({
      user_id: user.id,
      session_id: session.id,
      question_type: question.rawSkill,
      is_correct: isCorrect,
      time_taken_sec: responseTimeSec,
      source: "precision_drill",
      created_at: new Date().toISOString(),
    }))

    const { error: detailError } = await supabase.from("rc_session_questions").insert(detailRows)
    const { error: compatibilityError } = await supabase.from("rc_questions").insert(compatibilityRows)
    if (detailError || compatibilityError) {
      await supabase.from("rc_sessions").update({ time_taken_sec: null }).eq("id", session.id).eq("time_taken_sec", -1)
      console.error("Precision persistence failed", { detailError, compatibilityError })
      return NextResponse.json({ error: "Could not save Precision results" }, { status: 500 })
    }

    await supabase
      .from("rc_sessions")
      .update({
        correct_answers: score,
        time_taken_sec: totalTimeSec,
        difficulty: timedOut ? "precision_timed_out" : "precision",
      })
      .eq("id", session.id)
      .eq("time_taken_sec", -1)

    return NextResponse.json({
      sessionId: session.id,
      score,
      total: questions.length,
      totalTimeSec,
      timedOut,
      targetSkills: drill.targetSkills || [],
      questions: normalized.map(({ question, selected, responseTimeSec, responseStatus, isCorrect }) => ({
        ...question,
        options: question.options.map(({ isCorrect: hidden, ...option }) => option),
        selectedOptionId: selected?.id || null,
        responseTimeSec,
        responseStatus,
        isCorrect,
        selectedTrapType: selected && !isCorrect ? selected.trapType : null,
        selectedTrapLabel: selected && !isCorrect ? selected.trapLabel : null,
        selectedTrapExplanation: selected && !isCorrect ? selected.trapExplanation : null,
      })),
    })
  } catch (error) {
    console.error("Precision submission failed", error)
    return NextResponse.json({ error: error.message || "Precision submission failed" }, { status: 400 })
  }
}
