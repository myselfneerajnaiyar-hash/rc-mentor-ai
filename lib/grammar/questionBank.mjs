export function selectCompleteActiveTestQuestions(tests, questions, isPlayable, sessionCount = 5) {
  const eligibleTests = new Map((tests || [])
    .filter((test) => test.is_active === true
      && test.question_count === sessionCount
      && Number.isInteger(test.test_number)
      && test.test_number >= 1
      && test.test_number <= 10)
    .map((test) => [test.id, test]))
  const questionsByTest = new Map()
  for (const question of questions || []) {
    const test = eligibleTests.get(question.test_id)
    if (!test || !isPlayable(question, test)) continue
    const set = questionsByTest.get(test.id) || []
    set.push(question)
    questionsByTest.set(test.id, set)
  }
  return [...questionsByTest.entries()]
    .filter(([, set]) => set.length === sessionCount)
    .flatMap(([, set]) => set)
}
