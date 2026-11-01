const SECTIONS = new Set(['speed', 'vocab', 'rc1', 'rc2', 'micro', 'result'])

export function getDailyWorkoutProgress({ phase, speedStage, speedIndex, vocabIndex, rcIndex, microIndex } = {}) {
  const progress = { progress_phase: SECTIONS.has(phase) ? phase : 'unknown' }
  if (phase === 'speed') {
    progress.progress_question_number = Number.isInteger(speedIndex) ? speedIndex + 1 : 1
    if (speedStage === 'paragraph' || speedStage === 'question') progress.progress_stage = speedStage
  } else if (phase === 'vocab') {
    progress.progress_question_number = Number.isInteger(vocabIndex) ? vocabIndex + 1 : 1
  } else if (phase === 'rc1' || phase === 'rc2') {
    progress.progress_question_number = Number.isInteger(rcIndex) ? rcIndex + 1 : 1
  } else if (phase === 'micro') {
    progress.progress_question_number = Number.isInteger(microIndex) ? microIndex + 1 : 1
  }
  return progress
}
