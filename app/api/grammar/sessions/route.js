import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { GRAMMAR_SESSION_COUNT, GRAMMAR_TOPIC_NAMES, SUPPORTED_GRAMMAR_TOPICS, getAttemptQuestions, getTestQuestions, isPlayableStoredQuestion, requireGrammarAccess, sanitizeStoredQuestion } from "@/lib/grammar/server"
import { GRAMMAR_DIFFICULTIES } from "@/lib/grammarOntology"

export async function POST(request) {
  try {
    const access = await requireGrammarAccess(request)
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Grammar practice is not available for this account" }, { status: access.status })
    const { topicId, difficulty, testId, mode } = await request.json()
    const specialTopic = mode === "mixed" ? "mixed-practice" : mode === "weakness" ? "weakness-training" : null
    if ((!specialTopic && !SUPPORTED_GRAMMAR_TOPICS.has(topicId)) || !GRAMMAR_DIFFICULTIES.includes(difficulty)) return NextResponse.json({ error: "Invalid Grammar topic or difficulty" }, { status: 400 })

    let testQuery = supabaseAdmin
      .from("grammar_tests")
      .select("id,topic_id,difficulty,test_number,is_active")
      .eq("difficulty", difficulty)
      .eq("is_active", true)
      .order("test_number")
      .limit(100)
    if (!specialTopic) testQuery = testQuery.eq("topic_id", topicId)
    const { data: tests, error: testError } = await testQuery
    if (testError) throw testError
    const eligibleTests = []
    for (const test of tests || []) {
      const questions = await getTestQuestions(test.id, GRAMMAR_SESSION_COUNT + 1)
      if (questions.length === GRAMMAR_SESSION_COUNT && questions.every((question) => isPlayableStoredQuestion(question, test))) eligibleTests.push({ test, questions })
    }
    const chosen = testId ? eligibleTests.find((item) => item.test.id === testId) : eligibleTests[0]
    const selectedTest = chosen?.test
    let selected = chosen?.questions || []
    if (!selectedTest) return NextResponse.json({ error: "This topic and difficulty needs more approved bank questions before practice is available." }, { status: 503 })

    const now = new Date().toISOString()
    const { data: attempt, error: attemptError } = await supabaseAdmin.from("grammar_test_attempts").insert({ user_id: access.user.id, test_id: selectedTest.id, topic_id: specialTopic || topicId, difficulty, total_questions: GRAMMAR_SESSION_COUNT, completed: false, started_at: now, last_activity_at: now }).select("*").single()
    if (attemptError) throw attemptError
    if (specialTopic) selected = await getAttemptQuestions(attempt, access.user.id)
    if (selected.length < GRAMMAR_SESSION_COUNT) { await supabaseAdmin.from("grammar_test_attempts").delete().eq("id", attempt.id); return NextResponse.json({ error: "The stored question bank does not yet contain enough questions for this mode." }, { status: 503 }) }
    const topicName = specialTopic === "mixed-practice" ? "Mixed Practice" : specialTopic === "weakness-training" ? "Weakness Training" : GRAMMAR_TOPIC_NAMES[topicId]
    return NextResponse.json({ success: true, attemptId: attempt.id, topicId: specialTopic || topicId, topicName, difficulty, count: selected.length, questions: selected.map(sanitizeStoredQuestion) })
  } catch (error) {
    console.error("GRAMMAR SESSION CREATE ERROR", error)
    return NextResponse.json({ error: "Unable to start Grammar practice right now" }, { status: 500 })
  }
}
