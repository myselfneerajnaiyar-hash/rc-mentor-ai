import { randomUUID } from 'node:crypto'
import { BootCampError, LABELS } from './content.mjs'
import { coachKey, expired, initialState, publicState, reviewState, transition } from './session.mjs'
import { fallbackCoach } from './coach.mjs'
import { buildTrainerContext, trainerBriefing } from './trainer.mjs'

export const BOOTCAMP_PREVIEW_DAY = 1

function milliseconds(value) {
  return value instanceof Date ? value.getTime() : Number(value)
}

function validatePreview(attempt, snapshot, sourceRevision) {
  if (!attempt || typeof attempt !== 'object' || !/^[0-9a-f-]{36}$/i.test(attempt.id || '')
    || !Number.isInteger(attempt.revision) || attempt.revision < 0
    || attempt.sourceRevision !== sourceRevision || attempt.dayNumber !== BOOTCAMP_PREVIEW_DAY
    || !attempt.state || !Array.isArray(attempt.state.blocks)
    || attempt.state.blocks.length !== snapshot.blocks.length
    || !['mission', 'ready', 'activity', 'review', 'commentary', 'report'].includes(attempt.state.phase)
    || !Number.isInteger(attempt.state.current_block) || attempt.state.current_block < 0 || attempt.state.current_block > 4) {
    throw new BootCampError('This preview session has expired. Reload to start a fresh preview.', 409)
  }
  return { id: attempt.id, revision: attempt.revision, sourceRevision, state: structuredClone(attempt.state), snapshot }
}

function pack(record) {
  return { id: record.id, revision: record.revision, sourceRevision: record.sourceRevision, dayNumber: BOOTCAMP_PREVIEW_DAY, state: record.state }
}

function project(record, now) {
  return { value: publicState(record, now), attempt: pack(record) }
}

export function startPreview(snapshot, sourceRevision, now = Date.now()) {
  if (snapshot?.dayNumber !== BOOTCAMP_PREVIEW_DAY) throw new BootCampError('The public preview day is unavailable.', 503)
  const time = milliseconds(now)
  const record = { id: randomUUID(), revision: 0, sourceRevision, snapshot, state: initialState(snapshot, time) }
  record.state.coaching['mission:0'] = trainerBriefing(buildTrainerContext([], BOOTCAMP_PREVIEW_DAY, snapshot))
  return project(record, time)
}

export function readPreview(attempt, snapshot, sourceRevision, now = Date.now(), questionId) {
  const time = milliseconds(now)
  const record = validatePreview(attempt, snapshot, sourceRevision)
  if (expired(record.state, time)) {
    record.state = transition(record.state, snapshot, 'expire', { questionId }, time)
    record.revision++
  }
  return project(record, time)
}

export function coachPreview(attempt, snapshot, sourceRevision, now = Date.now()) {
  const time = milliseconds(now)
  const record = validatePreview(attempt, snapshot, sourceRevision)
  const key = coachKey(record.state)
  if (!record.state.coaching[key]) {
    if (record.state.phase === 'mission') record.state.coaching[key] = trainerBriefing(buildTrainerContext([], BOOTCAMP_PREVIEW_DAY, snapshot))
    else if (['commentary', 'report'].includes(record.state.phase)) record.state.coaching[key] = fallbackCoach(record)
    else throw new BootCampError('Coaching is not available at this step.')
    record.revision++
  }
  return project(record, time)
}

export function reviewPreview(attempt, snapshot, sourceRevision, key, _now = Date.now()) {
  const record = validatePreview(attempt, snapshot, sourceRevision)
  if (!Object.hasOwn(LABELS, key)) throw new BootCampError('Invalid review block.', 400)
  const review = reviewState(record, key)
  const index = record.state.blocks.findIndex(block => block.key === key)
  const state = { ...record.state, phase: 'commentary', current_block: index }
  return { value: { ...review, commentary: record.state.coaching[`${key}:${index + 1}`] || fallbackCoach({ ...record, state }) }, attempt: pack(record) }
}

export function actPreview(attempt, snapshot, sourceRevision, action, input = {}, now = Date.now()) {
  const time = milliseconds(now)
  const record = validatePreview(attempt, snapshot, sourceRevision)
  if (input.revision !== record.revision) throw new BootCampError('Progress has changed. Reload the preview to continue safely.', 409)

  let next
  if (action === 'advance' && input.reviewed === true) {
    if (!['review', 'commentary'].includes(record.state.phase)) throw new BootCampError('This review has already been continued.', 409)
    next = record.state.phase === 'review' ? transition(record.state, snapshot, 'advance', {}, time) : structuredClone(record.state)
    next.coaching[coachKey(next)] ||= fallbackCoach({ ...record, state: next })
    next = transition(next, snapshot, 'advance', {}, time)
  } else {
    next = transition(record.state, snapshot, action, input, time)
  }
  record.state = next
  record.revision++
  return project(record, time)
}
