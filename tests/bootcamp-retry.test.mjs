import assert from 'node:assert/strict'
import test from 'node:test'
import { bootCampOperation } from '../lib/bootcamp/analytics.mjs'
import { retryBootCampOperation } from '../lib/bootcamp/retry.mjs'

const noWait = async () => {}

test('Boot Camp retries transient failures for reads and idempotent enrollment and Day 1 start only', async () => {
  for (const [method, path] of [['GET', '?day=1'], ['POST', '/enroll'], ['POST', '/days/1/start']]) {
    let calls = 0
    const result = await retryBootCampOperation(async () => {
      calls += 1
      if (calls === 1) throw new TypeError('fetch failed')
      return 'ok'
    }, { method, path, wait: noWait })
    assert.equal(result, 'ok')
    assert.equal(calls, 2)
  }
})

test('Boot Camp retries remain bounded and do not replay non-idempotent writes or conflicts', async () => {
  let startCalls = 0
  await assert.rejects(retryBootCampOperation(async () => {
    startCalls += 1
    const error = new Error('temporarily unavailable')
    error.status = 503
    throw error
  }, { method: 'POST', path: '/days/1/start', wait: noWait }), { status: 503 })
  assert.equal(startCalls, 3)

  let finishCalls = 0
  await assert.rejects(retryBootCampOperation(async () => {
    finishCalls += 1
    throw new TypeError('fetch failed')
  }, { method: 'POST', path: '/attempts/private/blocks/rc1/finish', wait: noWait }))
  assert.equal(finishCalls, 1)

  let conflictCalls = 0
  await assert.rejects(retryBootCampOperation(async () => {
    conflictCalls += 1
    const error = new Error('conflict')
    error.status = 409
    throw error
  }, { method: 'POST', path: '/days/1/start', wait: noWait }))
  assert.equal(conflictCalls, 1)
})

test('Boot Camp error telemetry records a safe operation name without path identifiers', () => {
  assert.equal(bootCampOperation('GET', '?day=1'), 'home')
  assert.equal(bootCampOperation('POST', '/enroll'), 'enrollment')
  assert.equal(bootCampOperation('POST', '/days/1/start?testDate=2026-11-01'), 'start_day')
  assert.equal(bootCampOperation('PATCH', '/attempts/secret-attempt/blocks/rc1/responses'), 'attempt_patch')
  assert.equal(bootCampOperation('POST', '/attempts/secret-attempt/blocks/rc1/responses').includes('secret-attempt'), false)
})
