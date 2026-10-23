const percentage = (correct, total) => total ? Math.round((correct / total) * 100) : null
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null

export async function fetchAllPages(fetchPage, pageSize = 500) {
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(offset, offset + pageSize - 1)
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

export function buildGrammarAnalytics({ attempts = [], responses = [], questionMetadata = {}, topicNames = {} }) {
  const completed = [...attempts].filter((attempt) => attempt.completed_at).sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
  const responseRows = responses.map((response) => {
    const question = questionMetadata[response.question_id] || {}
    const attempt = completed.find((item) => item.id === response.attempt_id)
    return { ...response, question, attempt }
  }).filter((item) => item.attempt)
  const correct = responseRows.filter((row) => row.is_correct === true).length
  const topicRows = new Map()
  for (const row of responseRows) {
    const topicId = row.question.topic_id || row.attempt.topic_id
    if (!topicId || topicId === "mixed-practice" || topicId === "weakness-training") continue
    const entry = topicRows.get(topicId) || { topicId, questionsAttempted: 0, questionsCorrect: 0, times: [], skills: new Map(), perAttempt: new Map() }
    entry.questionsAttempted += 1
    if (row.is_correct === true) entry.questionsCorrect += 1
    if (Number.isFinite(Number(row.time_taken_seconds))) entry.times.push(Number(row.time_taken_seconds))
    const skill = row.question.primary_skill || row.question.subskill
    if (skill) {
      const skillEntry = entry.skills.get(skill) || { skill, attempted: 0, correct: 0 }
      skillEntry.attempted += 1
      if (row.is_correct === true) skillEntry.correct += 1
      entry.skills.set(skill, skillEntry)
    }
    const attemptEntry = entry.perAttempt.get(row.attempt_id) || { correct: 0, total: 0, at: row.attempt.completed_at }
    attemptEntry.total += 1
    if (row.is_correct === true) attemptEntry.correct += 1
    entry.perAttempt.set(row.attempt_id, attemptEntry)
    topicRows.set(topicId, entry)
  }
  const topics = [...topicRows.values()].map((entry) => {
    const series = [...entry.perAttempt.values()].sort((a, b) => new Date(a.at) - new Date(b.at))
    const first = series[0]
    const last = series.at(-1)
    const trend = series.length < 2 ? null : percentage(last.correct, last.total) - percentage(first.correct, first.total)
    const accuracy = percentage(entry.questionsCorrect, entry.questionsAttempted)
    const weakSkill = [...entry.skills.values()].filter((skill) => skill.attempted >= 2).sort((a, b) => percentage(a.correct, a.attempted) - percentage(b.correct, b.attempted))[0]
    return {
      topicId: entry.topicId,
      topicName: topicNames[entry.topicId] || entry.topicId,
      questionsAttempted: entry.questionsAttempted,
      questionsCorrect: entry.questionsCorrect,
      accuracy,
      averageTimeSeconds: average(entry.times),
      mastery: entry.questionsAttempted < 5 ? "Building data" : accuracy >= 80 ? "Strong" : accuracy >= 60 ? "Developing" : "Needs practice",
      trend,
      weakestSkill: weakSkill ? { name: weakSkill.skill, accuracy: percentage(weakSkill.correct, weakSkill.attempted), attempted: weakSkill.attempted } : null,
    }
  }).sort((a, b) => a.accuracy - b.accuracy)
  const groupMetrics = (keyFn, keys) => Object.fromEntries(keys.map((key) => {
    const rows = responseRows.filter((row) => keyFn(row) === key)
    const groupCorrect = rows.filter((row) => row.is_correct === true).length
    return [key, { attempted: rows.length, correct: groupCorrect, accuracy: percentage(groupCorrect, rows.length) }]
  }))
  const difficulty = groupMetrics((row) => row.question.difficulty || row.attempt.difficulty, ["easy", "moderate", "hard"])
  const formats = [...new Set(responseRows.map((row) => row.question.question_type).filter(Boolean))].sort().map((format) => {
    const rows = responseRows.filter((row) => row.question.question_type === format)
    const formatCorrect = rows.filter((row) => row.is_correct === true).length
    return { format, attempted: rows.length, correct: formatCorrect, accuracy: percentage(formatCorrect, rows.length) }
  })
  const testScores = completed.map((attempt) => Number(attempt.score || 0))
  const timeValues = responseRows.map((row) => Number(row.time_taken_seconds)).filter(Number.isFinite)
  const misses = responseRows.filter((row) => row.is_correct !== true).length
  const eligibleTopics = topics.filter((item) => item.questionsAttempted >= 5)
  return {
    overall: {
      questionsAttempted: responseRows.length,
      questionsCorrect: correct,
      accuracy: percentage(correct, responseRows.length),
      testsCompleted: completed.length,
      averageScore: average(testScores),
      averageTimeSeconds: average(timeValues),
      currentStreak: null,
    },
    topics,
    difficulty,
    formats,
    weakestTopic: eligibleTopics[0] || null,
    strongestTopic: eligibleTopics.length ? [...eligibleTopics].sort((a, b) => b.accuracy - a.accuracy)[0] : null,
    missedQuestionCount: misses,
    hasData: responseRows.length > 0,
  }
}
