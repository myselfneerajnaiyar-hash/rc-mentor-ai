import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const session = await readFile(new URL('../components/bootcamp/BootCampSession.jsx', import.meta.url), 'utf8')

test('opening an accessible day creates a missing session before showing the mission and resumes saved attempts', () => {
  assert.match(session, /if \(dayRoute && !home\.attempt && selectedDay\?\.accessible\)/)
  assert.match(session, /if \(!preview\) await requestSession\('\/enroll','POST'\)/)
  assert.match(session, /requestSession\(`\/days\/\$\{dayNumber\}\/start`,'POST'\)/)
  assert.match(session, /if \(!session && busy\).*role="status"/)
  assert.match(session, /if \(!session\) return <BootCampShell preview=\{preview\}>.*Loading preview/)
  assert.doesNotMatch(session, /Your training is ready\./)
  assert.match(session, /accept\(await resolveAttempt\(home\)\)/)
})
