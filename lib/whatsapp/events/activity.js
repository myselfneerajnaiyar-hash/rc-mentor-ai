const empty = ({ data, error }) => { if (error) throw error; return data || [] }

export async function getQualifyingActivitySummary(db, userId, since) {
  const sinceIso = new Date(since).toISOString()
  const sinceDate = sinceIso.slice(0, 10)
  const [dailyRc, rc, vocab, speed, workout, editorial, chat, sectional, grammar, wordHunt] = (await Promise.all([
    db.from("daily_rc_attempts").select("completed_at,correct_count,incorrect_count,unanswered_count,time_taken").eq("user_id", userId).gte("completed_at", sinceIso),
    db.from("rc_sessions").select("created_at,total_questions,correct_answers,time_taken_sec").eq("user_id", userId).gte("created_at", sinceIso),
    db.from("vocab_sessions").select("created_at,total_questions,correct_answers,time_taken_s").eq("user_id", userId).gte("created_at", sinceIso),
    db.from("speed_sessions").select("created_at,total_questions,correct_answers,total_time_s").eq("user_id", userId).gte("created_at", sinceIso),
    db.from("workout_attempts").select("completed_at,total_questions,correct_count").eq("user_id", userId).gte("completed_at", sinceIso),
    db.from("editorial_history").select("created_at").eq("user_id", userId).gte("created_at", sinceIso),
    db.from("mentor_chat_history").select("created_at").eq("user_id", userId).eq("role", "user").gte("created_at", sinceIso),
    db.from("mentor_test_attempts").select("created_at,total_questions,correct,time_taken_s").eq("user_id", userId).gte("created_at", sinceIso),
    db.from("grammar_test_attempts").select("completed_at,total_questions,score,time_taken_seconds").eq("user_id", userId).eq("completed", true).gte("completed_at", sinceIso),
    db.from("hangman_attempts").select("attempt_date").eq("user_id", userId).gte("attempt_date", sinceDate),
  ])).map(empty)
  const completedRc = rc.filter((row) => row.correct_answers != null && Number(row.total_questions) > 0)
  const activitiesCount = dailyRc.length + completedRc.length + vocab.length + speed.length + workout.length + editorial.length + chat.length + sectional.length + grammar.length + wordHunt.length
  const measured = [
    ...dailyRc.map((row) => metric(row.correct_count, Number(row.correct_count) + Number(row.incorrect_count) + Number(row.unanswered_count), row.time_taken)),
    ...completedRc.map((row) => metric(row.correct_answers, row.total_questions, row.time_taken_sec)),
    ...vocab.map((row) => metric(row.correct_answers, row.total_questions, row.time_taken_s)),
    ...speed.map((row) => metric(row.correct_answers, row.total_questions, row.total_time_s)),
    ...workout.map((row) => metric(row.correct_count, row.total_questions, null)),
    ...sectional.map((row) => metric(row.correct, row.total_questions, row.time_taken_s)),
    ...grammar.map((row) => metric(row.score, row.total_questions, row.time_taken_seconds)),
  ]
  const totals = measured.reduce((sum, row) => ({ correct: sum.correct + row.correct, questions: sum.questions + row.questions, timedSeconds: sum.timedSeconds + row.timedSeconds, timedQuestions: sum.timedQuestions + row.timedQuestions }), { correct: 0, questions: 0, timedSeconds: 0, timedQuestions: 0 })
  const questionActivitiesCount = measured.filter((row) => row.questions > 0).length
  const accuracyPercent = totals.questions ? Math.round(totals.correct * 100 / totals.questions) : null
  const averageSecondsPerQuestion = totals.timedQuestions ? Math.round(totals.timedSeconds / totals.timedQuestions) : null
  return { activitiesCount, questionActivitiesCount, hasActivity: activitiesCount > 0, hasDayOneMetrics: questionActivitiesCount > 0 && accuracyPercent != null && averageSecondsPerQuestion != null, accuracyPercent, averageSecondsPerQuestion }
}

export function buildDayOneEvent({ profile, lifecycleKey, summary, scheduledFor = new Date() }) {
  if (!summary?.hasActivity) throw new Error("Day-1 requires qualifying Auctor activity")
  if (!summary.hasDayOneMetrics) throw new Error("Day-1 requires real question performance and timing metrics")
  const baseUrl = String(profile.siteUrl || "https://rc.auctorlabs.in").replace(/\/$/, "")

  return {
    userId: profile.user_id,
    eventType: "trial_day1",
    lifecycleKey,
    scheduledFor,
    phoneSnapshot: profile.phone || null,
    payload: {
      firstName: String(profile.name || "Champion").trim().split(/\s+/)[0],
      sessionsCount: String(summary.questionActivitiesCount),
      accuracyPercent: String(summary.accuracyPercent),
      averageSecondsPerQuestion: String(summary.averageSecondsPerQuestion),
      paymentPlanLink: `${baseUrl}/pricing`,
    },
  }
}
function metric(correctValue, questionsValue, secondsValue) {
  const questions = Math.max(0, Number(questionsValue) || 0)
  const correct = Math.min(questions, Math.max(0, Number(correctValue) || 0))
  const timed = secondsValue != null && Number(secondsValue) >= 0 && questions > 0
  return { correct, questions, timedSeconds: timed ? Number(secondsValue) : 0, timedQuestions: timed ? questions : 0 }
}
