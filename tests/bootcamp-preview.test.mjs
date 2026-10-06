import test from 'node:test'
import assert from 'node:assert/strict'
import { fixture } from './helpers/bootcamp-db.mjs'
import { adaptDay } from '../lib/bootcamp/content.mjs'
import { actPreview, coachPreview, readPreview, reviewPreview, startPreview } from '../lib/bootcamp/preview.mjs'

test('public preview completes the fixed day through the existing session and review engine without exposing a saved attempt', () => {
  const { snapshot, source_revision: sourceRevision } = adaptDay(fixture())
  let now = Date.parse('2026-10-06T12:00:00.000Z')
  const started = startPreview(snapshot, sourceRevision, now)
  let attempt = started.attempt
  assert.equal(started.value.dayNumber, 1)
  assert.equal(started.value.phase, 'mission')
  assert.equal(started.value.commentary?.briefing?.daysCompleted, 0)
  assert.equal(JSON.stringify(attempt).includes('snapshot'), false)

  const advance = (action, body = {}) => {
    now += 1000
    const result = actPreview(attempt, snapshot, sourceRevision, action, { ...body, revision: attempt.revision }, now)
    attempt = result.attempt
    return result.value
  }

  advance('advance')
  for (const key of ['warmup', 'rc1', 'rc2', 'rc3', 'va']) {
    advance('block_start', { key })
    const completed = advance('finish', { key })
    assert.equal(completed.phase, 'review')
    const review = reviewPreview(attempt, snapshot, sourceRevision, key, now)
    assert.equal(review.value.key, key)
    assert.ok(review.value.questions.length > 0)
    assert.ok(review.value.commentary?.text)
    const next = advance('advance', { reviewed: true })
    assert.equal(next.phase, key === 'va' ? 'report' : 'ready')
  }

  assert.equal(attempt.state.status, 'completed')
  assert.equal(readPreview(attempt, snapshot, sourceRevision, now).value.report.total, 25)
  assert.ok(coachPreview(attempt, snapshot, sourceRevision, now).value.commentary?.text)
  assert.throws(() => readPreview(attempt, snapshot, 'changed-source', now), /preview session has expired/i)
})
