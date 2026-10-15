import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../components/bootcamp/BootCampShell.jsx', import.meta.url), 'utf8')
const session = await readFile(new URL('../components/bootcamp/BootCampSession.jsx', import.meta.url), 'utf8')
const analytics = await readFile(new URL('../components/bootcamp/BootCampOverallAnalytics.jsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../components/bootcamp/bootcamp.module.css', import.meta.url), 'utf8')

test('internal Boot Camp screens link back to the Boot Camp homepage and keep dashboard home separate', () => {
  assert.match(shell, /showBackToBootCamp = false/)
  assert.match(shell, /showBackToBootCamp && <Link href="\/boot-camp">Back to Boot Camp<\/Link>/)
  assert.match(shell, /<Link href="\/">Back to Home<\/Link>/)
  assert.match(session, /<BootCampShell>\{errorPanel\}<BootCampArena/)
  assert.match(session, /showBackToBootCamp=\{dayRoute\}/)
  assert.match(session, /showBackToBootCamp>/)
  assert.match(analytics, /<BootCampShell showBackToBootCamp>/)
})

test('Boot Camp header navigation wraps on narrow screens', () => {
  assert.match(styles, /\.topLinks\s*\{[^}]*flex-wrap:\s*wrap/)
  assert.match(styles, /@media\(max-width:760px\)[\s\S]*?\.top\s*\{[^}]*flex-wrap:\s*wrap/)
})
