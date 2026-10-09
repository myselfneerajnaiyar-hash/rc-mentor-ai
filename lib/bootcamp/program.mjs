import { BOOTCAMP_TRAINING_DAYS } from './calendar.mjs'

export const BOOTCAMP_DAILY_STRUCTURE = Object.freeze({ warmup: 5, rcPassages: 3, rcQuestions: 12, vaQuestions: 8 })
export const BOOTCAMP_CURRICULUM_TOTALS = Object.freeze({
  trainingDays: BOOTCAMP_TRAINING_DAYS,
  warmupQuestions: BOOTCAMP_TRAINING_DAYS * BOOTCAMP_DAILY_STRUCTURE.warmup,
  rcPassages: BOOTCAMP_TRAINING_DAYS * BOOTCAMP_DAILY_STRUCTURE.rcPassages,
  rcQuestions: BOOTCAMP_TRAINING_DAYS * BOOTCAMP_DAILY_STRUCTURE.rcQuestions,
  vaQuestions: BOOTCAMP_TRAINING_DAYS * BOOTCAMP_DAILY_STRUCTURE.vaQuestions,
  totalQuestions: BOOTCAMP_TRAINING_DAYS * (BOOTCAMP_DAILY_STRUCTURE.warmup + BOOTCAMP_DAILY_STRUCTURE.rcQuestions + BOOTCAMP_DAILY_STRUCTURE.vaQuestions),
})
