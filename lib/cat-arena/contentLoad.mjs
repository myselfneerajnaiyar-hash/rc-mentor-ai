export function getCATSectionalContentError({ errors = [], passageCount = 0, questionCount = 0 } = {}) {
  if (errors.some(Boolean)) return "The test content could not be loaded. Please exit and try again."
  if (passageCount < 1) return "This test has no published passage content yet. Please choose another test."
  if (questionCount < 1) return "This test has no question content available. Please exit and try again."
  return null
}
