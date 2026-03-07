export async function getRCStats(supabase, userId) {

  const { data: questions } = await supabase
    .from("rc_session_questions")
    .select("question_type, is_correct, time_taken_sec")
    .eq("user_id", userId)

  let accuracy = 0
  let avgTime = 0
  let weakestType = "unknown"
  let weakestAccuracy = 100

  if (questions && questions.length > 0) {

    let total = questions.length
    let correct = 0
    let totalTime = 0

    const typeStats = {}

    questions.forEach(q => {

      if (q.is_correct) correct++

      totalTime += q.time_taken_sec || 0

      const type = (q.question_type || "inference")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-")

      if (!typeStats[type]) {
        typeStats[type] = { correct: 0, total: 0 }
      }

      typeStats[type].total++

      if (q.is_correct) {
        typeStats[type].correct++
      }

    })

    accuracy = Math.round((correct / total) * 100)
    avgTime = Math.round(totalTime / total)

    Object.entries(typeStats).forEach(([type, s]) => {

      const acc =
        s.total === 0
          ? 100
          : Math.round((s.correct / s.total) * 100)

      if (acc < weakestAccuracy) {
        weakestAccuracy = acc
        weakestType = type
      }

    })

  }

  return {
    accuracy,
    avgTime,
    weakestType,
    weakestAccuracy
  }

}