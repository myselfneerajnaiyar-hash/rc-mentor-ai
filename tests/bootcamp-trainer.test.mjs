import test from 'node:test'
import assert from 'node:assert/strict'
import { fixture,harness,student,other } from './helpers/bootcamp-db.mjs'
import { adaptDay } from '../lib/bootcamp/content.mjs'
import { initialState } from '../lib/bootcamp/session.mjs'
import { buildTrainerContext,trainerBriefing,trainerPromptContext } from '../lib/bootcamp/trainer.mjs'

function completed(day,correct=true) {
  const snapshot=adaptDay(fixture(day)).snapshot,state=initialState(snapshot)
  state.status='completed';state.phase='report'
  state.blocks.forEach((b,i)=>{
    b.status='completed';b.started_at='2026-09-23T00:00:00Z';b.finished_at='2026-09-23T00:01:00Z'
    b.questions.forEach((q,n)=>{q.outcome=correct?'correct':'incorrect';q.response=correct?snapshot.blocks[i].questions[n].answer:'A';q.active_ms=2000})
  })
  state.report={score:999,accuracy:999};state.coaching={fake:'The student is permanently weak at inference.'}
  return {day_number:day,snapshot,state}
}
const context=(records,day)=>buildTrainerContext(records,day,adaptDay(fixture(day)).snapshot)
test('generic history handles Day 1, 2, 3, 10, 25 and 50 without future contamination',()=>{
  const all=Array.from({length:50},(_,i)=>completed(i+1))
  for(const day of [1,2,3,10,25,50]) {
    const c=context(all,day)
    assert.equal(c.history.overall.daysCompleted,day-1)
    assert.equal(c.history.overall.correct,(day-1)*25)
    assert.equal(c.currentDay.dayNumber,day)
    assert.equal(c.currentDay.totalQuestions,25)
    assert.equal(c.currentDay.blocks[1].passage.text,'Some claims need qualifications.')
    assert.ok(c.currentDay.blocks[1].passage.approvedEnrichment.coreTheme)
    assert.ok(c.currentDay.blocks[0].questions[0].skill)
    assert.ok(!JSON.stringify(c).includes('permanently weak'))
    assert.ok(!JSON.stringify(c).includes('"score":999'))
  }
  assert.match(trainerBriefing(context([],1)).briefing.noticed[0],/starting point/)
})
test('recent windows are completed days, non-overlapping and preserve sample sizes',()=>{
  const c=context(Array.from({length:9},(_,i)=>completed(i+1)),10)
  assert.deepEqual(c.history.recent3.dayNumbers,[7,8,9])
  assert.deepEqual(c.history.recent5.dayNumbers,[5,6,7,8,9])
  assert.deepEqual(c.history.previous3.dayNumbers,[4,5,6])
  assert.equal(c.history.overall.totalTrainingSeconds,9*300)
  assert.equal(c.history.overall.averageActiveSeconds,2)
  assert.equal(c.history.questionTypes.find(p=>p.name==='Inference').overall.attempted,9*13)
})
test('improving, persistent and emerging evidence changes focus; one-day samples never diagnose',()=>{
  const records=Array.from({length:6},(_,i)=>completed(i+1,i>=3))
  const c=context(records,7),inference=c.history.questionTypes.find(p=>p.name==='Inference')
  assert.equal(inference.status,'improving');assert.equal(inference.trend.direction,'improving')
  assert.ok(!c.history.patterns.watching.some(p=>p.name==='Inference'))
  assert.match(trainerBriefing(c).briefing.changed.join(' '),/improved/)
  const persistent=context(records.map(r=>completed(r.day_number,false)),7)
  assert.equal(persistent.history.questionTypes.find(p=>p.name==='Inference').status,'persistent')
  const emerging=context(records.map(r=>completed(r.day_number,r.day_number<=3)),7)
  assert.equal(emerging.history.questionTypes.find(p=>p.name==='Inference').status,'emerging')
  const one=context([completed(1,false)],2)
  assert.equal(one.history.questionTypes[0].trend.sufficientEvidence,false)
  assert.ok(one.history.patterns.watching.every(p=>p.status==='provisional'))
  assert.match(trainerBriefing(one).briefing.watching.join(' '),/small sample, not a diagnosis/)
})
test('unanswered, partial and explicitly abandoned records are participation, not cognitive mistakes',()=>{
  const full=completed(1,false),partial=completed(2,false),abandoned=completed(3,false),unstarted=completed(4,false)
  const questions=full.state.blocks[0].questions
  for(const [i,outcome] of ['skipped','not_reached','timed_out'].entries()){questions[i].outcome=outcome;questions[i].response=null}
  partial.state.status='active';partial.state.blocks[1].status='pending'
  abandoned.state.status='abandoned'
  unstarted.state=initialState(unstarted.snapshot)
  const c=context([full,partial,abandoned,unstarted],6)
  assert.equal(c.history.overall.attempted,22);assert.equal(c.history.overall.incorrect,22)
  assert.equal(c.history.overall.skipped,1);assert.equal(c.history.overall.notReached,1);assert.equal(c.history.overall.timedOut,1)
  assert.equal(c.history.participation.partiallyCompleted,1);assert.equal(c.history.participation.abandoned,1)
  assert.equal(c.history.participation.notStarted,2);assert.equal(c.history.participation.completed,1)
  assert.equal(c.history.participation.completionConsistency.started,3)
  assert.equal(c.history.traps.find(p=>p.name==='Scope Shift').selections,16)
})
test('raw correction changes revision and briefing; fifty-day prompt excludes old source text and remains bounded',()=>{
  const records=Array.from({length:49},(_,i)=>completed(i+1,false));const before=context(records,50)
  records[48].state.blocks[0].questions[0].outcome='correct'
  records[48].state.blocks[0].questions[0].response='B'
  const after=context(records,50)
  assert.notEqual(after.revision,before.revision);assert.equal(after.history.overall.correct,1)
  assert.notEqual(trainerBriefing(before).briefing.noticed[0],trainerBriefing(after).briefing.noticed[0])
  const prompt=JSON.stringify(trainerPromptContext(after))
  assert.ok(prompt.length<25000,`context is ${prompt.length} characters`)
  assert.ok(!prompt.includes('Choose the supported answer.'))
  assert.ok(!prompt.includes('bootcamp-day-50-rc1-q1'))
  assert.equal(after.history.recentEvidence.length,3)
})
test('SQL migration: complete Day 1 -> Day 2 -> Day 3; fresh history, ownership, resume and sequencing',async()=>{
  let today='2026-10-01'
  const h=await harness(fixture(),undefined,undefined,{now:()=>today})
  try {
    for(const day of [2,3]){const r=fixture(day);await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[r.id,r.day_number,r.document,r.lock_token,r.updated_at])}
    await h.service.enroll(student)
    await assert.rejects(h.service.start(student,2),/opens on/)
    for(const day of [1,2]) {
      let state=await h.service.start(student,day)
      assert.equal(state.dayNumber,day);assert.equal(state.commentary.briefing.daysCompleted,day-1)
      assert.equal((await h.service.start(student,day)).id,state.id)
      const act=async(action,input={})=>state=await h.service.act(student,state.id,action,{revision:state.revision,...input})
      await act('advance')
      for(const block of adaptDay(fixture(day)).snapshot.blocks){await act('block_start',{key:block.key});const q=block.questions[0];await act('responses',{key:block.key,questionId:q.id,presented:true,response:q.answer});await act('finish',{key:block.key});await act('advance',{reviewed:true})}
      assert.equal(state.status,'completed')
      today=`2026-10-0${day+1}`
      assert.equal((await h.service.home(student)).currentDay,day+1)
      assert.equal((await h.service.home(student,day)).attempt.id,state.id)
    }
    const day3=await h.service.start(student,3)
    assert.equal(day3.commentary.briefing.daysCompleted,2)
    const before=await h.service.getBootCampTrainerContext(student,3)
    assert.equal(before.history.overall.correct,10)
    assert.equal((await h.service.getBootCampTrainerContext(other,3)).history.overall.daysCompleted,0)
    await h.pg.query("update bootcamp_question_attempts set state=jsonb_set(state,'{outcome}','\"incorrect\"') where source_question_id='bootcamp-day-1-warmup-q1'")
    const resumed=await h.service.get(student,day3.id)
    assert.notEqual(resumed.commentary.trainerRevision,day3.commentary.trainerRevision)
    assert.match(resumed.commentary.briefing.noticed[0],/9 correct/)
    const permission=await h.pg.query("select has_function_privilege('authenticated','bootcamp_history(uuid,integer)','EXECUTE') allowed")
    assert.equal(permission.rows[0].allowed,false)
    assert.ok(h.calls.every(c=>!c.table || c.table.startsWith('bootcamp_')))
    for(const day of [0,51,1.5,'no'])await assert.rejects(h.service.start(student,day))
  } finally {await h.close()}
})

test('trap evidence counts selected distractors, and unanswered days do not satisfy trend evidence',()=>{
  const records=Array.from({length:6},(_,i)=>completed(i+1,false))
  for(const record of records)for(const b of record.snapshot.blocks)for(const q of b.questions)if(q.options.length)q.analysis.optionAnalysis.find(o=>o.optionId==='D').trapType='Other authored trap'
  const c=context(records,7)
  const offered=c.history.traps.find(p=>p.name==='Other authored trap')
  assert.ok(offered.overall.incorrect>0);assert.equal(offered.selections,0);assert.equal(offered.status,'no_current_signal')
  for(const r of records.filter(r=>![1,4].includes(r.day_number)))for(const b of r.state.blocks)for(const q of b.questions){q.outcome='not_reached';q.response=null}
  const sparse=context(records,7)
  assert.equal(sparse.history.recent3.days,3);assert.equal(sparse.history.recent3.attemptedDays,1)
  assert.equal(sparse.history.overallTrend.sufficientEvidence,false)
})
