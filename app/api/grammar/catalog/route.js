import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { GRAMMAR_TOPIC_NAMES, isPlayableStoredQuestion, requireGrammarAccess } from "@/lib/grammar/server"
import { GRAMMAR_ONTOLOGY } from "@/lib/grammarOntology"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const access = await requireGrammarAccess(request)
    if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Access denied" }, { status: access.status })
    const topicId = new URL(request.url).searchParams.get("topicId") || "subject-verb-agreement"
    if (topicId !== "all" && !GRAMMAR_ONTOLOGY[topicId]) return NextResponse.json({ error: "Unknown Grammar topic" }, { status: 400 })
    let testQuery = supabaseAdmin.from("grammar_tests").select("id,topic_id,topic_name,difficulty,test_number,question_count,is_active").eq("is_active", true).order("difficulty").order("test_number").limit(1000)
    if (topicId !== "all") testQuery = testQuery.eq("topic_id", topicId)
    const { data: candidateTests, error } = await testQuery
    if (error) throw error
    const candidateIds = (candidateTests || []).map((test) => test.id)
    let bankQuestions = []
    if (candidateIds.length) {
      const result = await supabaseAdmin.from("grammar_questions").select("id,test_id,topic_id,difficulty,question_type,question_text,options,correct_answer,explanation,rule_tested,primary_skill,subskill,trap_type,option_analysis,is_active,bank_status").in("test_id", candidateIds)
      if (result.error) throw result.error
      bankQuestions = result.data || []
    }
    const tests = (candidateTests || []).filter((test) => {
      if (!["easy", "moderate", "hard"].includes(test.difficulty) || !Number.isInteger(test.test_number) || test.test_number < 1 || test.test_number > 10) return false
      const questions = bankQuestions.filter((question) => question.test_id === test.id)
      return questions.length === 5 && questions.every((question) => isPlayableStoredQuestion(question, test))
    })
    const testIds = tests.map((test) => test.id)
    let completed = []
    if (testIds.length) {
      const result = await supabaseAdmin.from("grammar_test_attempts").select("test_id,score,completed_at").eq("user_id", access.user.id).eq("completed", true).in("test_id", testIds).order("completed_at", { ascending: false })
      if (result.error) throw result.error
      completed = result.data || []
    }
    const completionByTest = new Map()
    completed.forEach((attempt) => { if (!completionByTest.has(attempt.test_id)) completionByTest.set(attempt.test_id, attempt) })
    const buildTopic = (currentTopicId) => {
      const topicTests = tests.filter((test) => test.topic_id === currentTopicId)
      const difficulties = Object.fromEntries(["easy", "moderate", "hard"].map((difficulty) => {
      const sets = topicTests.filter((test) => test.difficulty === difficulty).slice(0, 10).map((test, index) => {
        const attempt = completionByTest.get(test.id)
        return { testId: test.id, setNumber: Number(test.test_number || index + 1), questionCount: 5, completed: Boolean(attempt), bestScore: attempt?.score ?? null, completedAt: attempt?.completed_at || null }
      })
      const completedCount = sets.filter((set) => set.completed).length
      return [difficulty, { sets, completed: completedCount, total: 10, percentage: completedCount * 10 }]
      }))
      const completedTotal = Object.values(difficulties).reduce((sum, item) => sum + item.completed, 0)
      const availableTests = topicTests.length
      return { topicId: currentTopicId, topicName: GRAMMAR_TOPIC_NAMES[currentTopicId] || currentTopicId, difficulties, availableTests, availableQuestions: availableTests * 5, overall: { completed: completedTotal, total: 30, percentage: Math.round((completedTotal / 30) * 100) } }
    }
    if (topicId === "all") return NextResponse.json({ success: true, topics: Object.keys(GRAMMAR_ONTOLOGY).map(buildTopic) })
    return NextResponse.json({ success: true, ...buildTopic(topicId) })
  } catch (error) {
    console.error("GRAMMAR CATALOG ERROR", error)
    return NextResponse.json({ error: "Unable to load Grammar sets" }, { status: 500 })
  }
}
