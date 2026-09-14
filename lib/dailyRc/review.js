export class DailyRcReviewError extends Error {
  constructor(message, status = 409) { super(message); this.status = status }
}

// Resolve content only through the owned attempt and its persisted question IDs.
export async function loadDailyRcReview(db, userId, attemptId) {
  if (!userId) throw new DailyRcReviewError("Authentication required", 401)
  if (!attemptId) throw new DailyRcReviewError("Choose an attempt from RC History", 400)
  const { data: attempt, error } = await db.from("daily_rc_attempts").select("*")
    .eq("id", attemptId).eq("user_id", userId).maybeSingle()
  if (error) throw error
  if (!attempt) throw new DailyRcReviewError("Attempt not found", 404)
  if (!attempt.completed_at || !attempt.daily_rc_set_id) throw new DailyRcReviewError("This attempt's review is incomplete")
  const [{ data: rcSet, error: setError }, { data: responses, error: responseError }] = await Promise.all([
    db.from("daily_rc_sets").select("*").eq("id", attempt.daily_rc_set_id).maybeSingle(),
    db.from("daily_rc_question_attempts").select("*").eq("attempt_id", attempt.id),
  ])
  if (setError || responseError) throw setError || responseError
  if (!rcSet) throw new DailyRcReviewError("The original passage is unavailable")
  const ids = (responses || []).map(row => row.question_id)
  const expected = Number(attempt.correct_count) + Number(attempt.incorrect_count) + Number(attempt.unanswered_count)
  if (!ids.length || ids.some(id => !id) || new Set(ids).size !== ids.length || ids.length !== expected) {
    throw new DailyRcReviewError("This attempt's saved responses are incomplete")
  }
  const { data: questions, error: questionError } = await db.from("daily_rc_questions").select("*")
    .eq("daily_rc_set_id", attempt.daily_rc_set_id).in("id", ids).order("order_no")
  if (questionError) throw questionError
  if (questions?.length !== ids.length) throw new DailyRcReviewError("The original question set is unavailable")
  const byId = new Map(questions.map(question => [question.id, question]))
  for (const response of responses) {
    const question = byId.get(response.question_id)
    if (!question || (response.correct_option && response.correct_option !== String.fromCharCode(64 + Number(question.correct_answer)))) {
      throw new DailyRcReviewError("The original answer key no longer matches this attempt")
    }
  }
  return { attempt, rcSet, questions, responses }
}

export function dailyRcAttemptHref(path, attemptId) {
  return attemptId ? `${path}?attemptId=${encodeURIComponent(attemptId)}` : "/rc-history"
}
