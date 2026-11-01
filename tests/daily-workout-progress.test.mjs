import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { getDailyWorkoutProgress } from '../lib/dailyWorkout/progress.mjs'

test('Daily Workout abandonment progress records the current section without answers or identifiers', async () => {
  assert.deepEqual(getDailyWorkoutProgress({ phase: 'speed', speedStage: 'question', speedIndex: 2 }), {
    progress_phase: 'speed', progress_question_number: 3, progress_stage: 'question',
  })
  assert.deepEqual(getDailyWorkoutProgress({ phase: 'vocab', vocabIndex: 4 }), {
    progress_phase: 'vocab', progress_question_number: 5,
  })
  assert.deepEqual(getDailyWorkoutProgress({ phase: 'rc2', rcIndex: 1 }), {
    progress_phase: 'rc2', progress_question_number: 2,
  })
  assert.deepEqual(getDailyWorkoutProgress({ phase: 'micro', microIndex: 0 }), {
    progress_phase: 'micro', progress_question_number: 1,
  })
  assert.deepEqual(getDailyWorkoutProgress({ phase: 'unexpected', speedIndex: 100 }), { progress_phase: 'unknown' })

  const component = await readFile(new URL('../components/WorkoutEngine.jsx', import.meta.url), 'utf8')
  assert.match(component, /activity_abandoned", \{ activity_type: "daily_workout", \.\.\.abandonmentProgress\.current \}/)
})
