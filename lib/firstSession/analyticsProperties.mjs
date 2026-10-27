import { displayQuestionType } from "./reportPresentation.mjs"

export function diagnosticCompletionProperties(report, submittedByTimer = false) {
  const questions = Array.isArray(report?.questions) ? report.questions : []
  const attempted = questions.filter((question) => question.selected_option !== null && question.selected_option !== undefined).length
  const correct = questions.filter((question) => question.is_correct).length
  const typeStats = new Map()
  for (const question of questions) {
    const type = displayQuestionType(question.question_type) || "Unclassified"
    const stats = typeStats.get(type) || { question_type: type, total: 0, attempted: 0, correct: 0, unanswered: 0 }
    stats.total += 1
    if (question.selected_option !== null && question.selected_option !== undefined) stats.attempted += 1
    else stats.unanswered += 1
    if (question.is_correct) stats.correct += 1
    typeStats.set(type, stats)
  }
  return {
    total_questions: Number(report?.total_questions) || questions.length,
    correct_count: correct,
    attempted_count: attempted,
    unanswered_count: Math.max(0, questions.length - attempted),
    accuracy: attempted ? Number(((correct / attempted) * 100).toFixed(2)) : 0,
    time_taken_seconds: Number(report?.time_taken_seconds) || 0,
    question_type_performance: [...typeStats.values()],
    submitted_by_timer: submittedByTimer,
  }
}

export function diagnosticReportProperties(report) {
  const summary = diagnosticCompletionProperties(report)
  return {
    set_id: report?.set_id,
    diagnostic_version: report?.set_id,
    score: Number(report?.score) || 0,
    accuracy: summary.accuracy,
    attempted_count: summary.attempted_count,
    total_questions: summary.total_questions,
    time_taken_seconds: summary.time_taken_seconds,
  }
}
