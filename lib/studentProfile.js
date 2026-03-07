export async function getStudentProfile(supabase, userId) {

  const profile = {
    rc: {
      accuracy: 0,
      avgTime: 0,
      weakest: "unknown"
    },

    vocab: {
      accuracy: 0
    },

    speed: {
      avgWpm: 0
    },

    workout: {
      completed: 0
    },

    cat: {
      attempts: 0
    }
  }

  /* ---------------- RC ANALYTICS ---------------- */

  const { data: sessions } = await supabase
    .from("rc_sessions")
    .select("id")
    .eq("user_id", userId)

  const sessionIds = (sessions || []).map(s => s.id)

  if (sessionIds.length > 0) {

    const { data: questions } = await supabase
      .from("rc_session_questions")
      .select("question_type, is_correct, time_taken_sec")
      .in("session_id", sessionIds)

    let total = 0
    let correct = 0
    let totalTime = 0

    const typeStats = {}

    ;(questions || []).forEach(q => {

      total++

      if (q.is_correct) correct++

      if (q.time_taken_sec) {
        totalTime += q.time_taken_sec
      }

      const type = (q.question_type || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "-")

      if (!typeStats[type]) {
        typeStats[type] = { correct: 0, total: 0 }
      }

      typeStats[type].total++

      if (q.is_correct) {
        typeStats[type].correct++
      }

    })

    profile.rc.accuracy =
      total === 0 ? 0 : Math.round((correct / total) * 100)

    profile.rc.avgTime =
      total === 0 ? 0 : Math.round(totalTime / total)

    let weakestType = "unknown"
    let weakestAcc = 100

    Object.entries(typeStats).forEach(([type, s]) => {

      if (s.total < 3) return

      const acc = Math.round((s.correct / s.total) * 100)

      if (acc < weakestAcc) {
        weakestAcc = acc
        weakestType = type
      }

    })

    profile.rc.weakest = weakestType
  }

  /* ---------------- VOCAB ANALYTICS ---------------- */

  const { data: vocab } = await supabase
    .from("vocab_sessions")
    .select("correct_answers, total_questions")
    .eq("user_id", userId)

  if (vocab && vocab.length > 0) {

    const totalQuestions =
      vocab.reduce((a,b)=>a+(b.total_questions || 0),0)

    const correctAnswers =
      vocab.reduce((a,b)=>a+(b.correct_answers || 0),0)

    if (totalQuestions > 0) {
      profile.vocab.accuracy =
        Math.round((correctAnswers / totalQuestions) * 100)
    }

  }

  /* ---------------- SPEED ANALYTICS ---------------- */

  const { data: speed } = await supabase
    .from("speed_sessions")
    .select("effective_wpm")
    .eq("user_id", userId)

  if (speed && speed.length > 0) {

    const total =
      speed.reduce((a,b)=>a+(b.effective_wpm || 0),0)

    profile.speed.avgWpm =
      Math.round(total / speed.length)

  }

  /* ---------------- WORKOUT ANALYTICS ---------------- */

  const { data: workouts } = await supabase
    .from("workout_attempts")
    .select("id")
    .eq("user_id", userId)

  profile.workout.completed =
    workouts ? workouts.length : 0

  /* ---------------- CAT ANALYTICS ---------------- */

  const { data: cat } = await supabase
    .from("sectional_test_attempts")
    .select("id")
    .eq("user_id", userId)

  profile.cat.attempts =
    cat ? cat.length : 0

  return profile

}