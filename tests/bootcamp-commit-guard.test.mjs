import test from 'node:test'
import assert from 'node:assert/strict'
import { bootCampCommitKey, dedupeBootCampCommit } from '../lib/bootcamp/commit-guard.mjs'

test('identical in-flight attempt/action/revision commits share one request', async () => {
  const body = { revision: 7, questionId: 'q1', response: 'B' }
  const key = bootCampCommitKey('student', '/attempts/00000000-0000-4000-8000-000000000001/blocks/rc1/responses', 'PATCH', body)
  let calls = 0
  let release
  const operation = () => { calls += 1; return new Promise(resolve => { release = resolve }) }
  const first = dedupeBootCampCommit(key, operation)
  const second = dedupeBootCampCommit(key, operation)
  await Promise.resolve()
  assert.equal(calls, 1)
  release({ saved: true })
  assert.deepEqual(await Promise.all([first, second]), [{ saved: true }, { saved: true }])
})

test('different payloads or revisions are not coalesced', async () => {
  const path = '/attempts/00000000-0000-4000-8000-000000000001/advance'
  const a = bootCampCommitKey('student', path, 'POST', { revision: 7, reviewed: true })
  const b = bootCampCommitKey('student', path, 'POST', { reviewed: true, revision: 8 })
  const c = bootCampCommitKey('student', path, 'POST', { revision: 7, reviewed: false })
  assert.notEqual(a, b)
  assert.notEqual(a, c)
  assert.equal(bootCampCommitKey('student', '/attempts/not-an-id/advance', 'POST', { revision: 7 }), null)
})
