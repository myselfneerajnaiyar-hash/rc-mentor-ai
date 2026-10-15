import assert from 'node:assert/strict'
import test from 'node:test'
import { bootCampErrorCategory, createBootCampEventTracker, getBootCampAnalyticsContext, setBootCampAnalyticsContext } from '../lib/bootcamp/analytics.mjs'

test('Boot Camp errors are grouped into stable, non-sensitive categories', () => {
  assert.equal(bootCampErrorCategory({ status: 401 }), 'authentication')
  assert.equal(bootCampErrorCategory({ status: 402 }), 'entitlement')
  assert.equal(bootCampErrorCategory({ status: 403 }), 'entitlement')
  assert.equal(bootCampErrorCategory({ status: 409 }), 'conflict')
  assert.equal(bootCampErrorCategory({ status: 422 }), 'request')
  assert.equal(bootCampErrorCategory({ status: 503 }), 'server')
  assert.equal(bootCampErrorCategory(new TypeError('fetch failed')), 'network')
})

test('Boot Camp event capture includes authenticated user identity and deduplicates the same UI event key', async () => {
  const captured = []
  const tracker = createBootCampEventTracker({
    getUserId: async () => 'student-123',
    identify: userId => captured.push(['identify', userId]),
    capture: (event, properties) => captured.push([event, properties]),
  })
  const properties = { day_number: 2, enrollment_state: 'enrolled', access_state: 'OPEN_TODAY' }
  assert.equal(await tracker('bootcamp_day_open', { eventKey: 'day_open:2', properties }), true)
  assert.equal(await tracker('bootcamp_day_open', { eventKey: 'day_open:2', properties }), false)
  const concurrent = await Promise.all([
    tracker('bootcamp_day_start', { eventKey: 'day_start:attempt-1', properties }),
    tracker('bootcamp_day_start', { eventKey: 'day_start:attempt-1', properties }),
  ])
  assert.deepEqual(concurrent.sort(), [false, true])
  assert.deepEqual(captured, [
    ['identify', 'student-123'],
    ['bootcamp_day_open', { user_id: 'student-123', ...properties }],
    ['bootcamp_day_start', { user_id: 'student-123', ...properties }],
  ])
})

test('Boot Camp analytics failures never reject an activity flow', async () => {
  const tracker = createBootCampEventTracker({
    getUserId: async () => { throw new Error('analytics unavailable') },
    capture: () => { throw new Error('analytics unavailable') },
  })
  assert.equal(await tracker('bootcamp_error'), false)
})

test('Boot Camp analytics context is isolated by authenticated user', () => {
  setBootCampAnalyticsContext('student-a', { day_number: 3, enrollment_state: 'enrolled', access_state: 'OPEN_TODAY' })
  assert.deepEqual(getBootCampAnalyticsContext('student-a'), { day_number: 3, enrollment_state: 'enrolled', access_state: 'OPEN_TODAY' })
  assert.deepEqual(getBootCampAnalyticsContext('student-b'), {})
})
