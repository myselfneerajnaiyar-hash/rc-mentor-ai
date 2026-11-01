import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const homepage = await readFile(new URL('../components/bootcamp/BootCampArena.jsx', import.meta.url), 'utf8')

test('Boot Camp homepage leads with dynamic student state and compact CAT countdown', () => {
  assert.doesNotMatch(homepage, /Train with intent|Track every day|programNote|countdownNumber/)
  assert.match(homepage, /completed\?'Today’s workout is complete\.'/)
  assert.match(homepage, /behind\?`You’re \$\{backlogDays\} day/)
  assert.match(homepage, /firstVisit\?'Your first workout is ready\.'/)
  assert.match(homepage, /'You’re on track\.'/)
  assert.match(homepage, /className=\{s\.heroCatBadge\}>CAT 2026<\/div>/)
  assert.match(homepage, /<strong>\{catDays \?\? [^}]+\}<\/strong>[\s\S]*?<span>DAYS LEFT<\/span>/)
  assert.match(homepage, /3 RC passages<\/span><strong>12 questions<\/strong><small>21 min<\/small>/)
  assert.match(homepage, /8 VA questions<\/span><strong>8 min<\/strong>/)
  assert.match(homepage, /29 timed minutes today\./)
})

test('Boot Camp calendar keeps month/day behavior and reveals all remaining rows on demand', () => {
  assert.match(homepage, /trainingMonths\(\)/)
  assert.match(homepage, /href=\{`\/boot-camp\/day\/\$\{cell\.day\}/)
  assert.match(homepage, /hidden=\{!showAllRows&&\(week<firstVisibleRow\|\|week>=firstVisibleRow\+2\)\}/)
  assert.match(homepage, /aria-expanded=\{showAllRows\} aria-controls="training-month"/)
  assert.match(homepage, /SHOW MORE DAYS ↓/)
  assert.match(homepage, /SHOW FEWER DAYS ↑/)
})

test('homepage places today, plan context, journey and training support in rendered order', () => {
  const sections = ['todaySection', 'topAside', 'trainingSteps', 'journeySection', 'calendarAside', 'birbalStrip']
  let previous = -1
  for (const section of sections) {
    const position = homepage.indexOf(`className={s.${section}}`)
    assert.ok(position > previous, `${section} appears in the expected page order`)
    previous = position
  }
})
