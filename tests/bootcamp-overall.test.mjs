import test from 'node:test'
import assert from 'node:assert/strict'
import { fixture,harness,student,other } from './helpers/bootcamp-db.mjs'
import { adaptDay } from '../lib/bootcamp/content.mjs'
import { initialState } from '../lib/bootcamp/session.mjs'
import { buildOverallAnalytics } from '../lib/bootcamp/overall.mjs'
import { BOOTCAMP_CALENDAR,getBootCampCalendarState } from '../lib/bootcamp/calendar.mjs'
import { bootCampClock, bootCampPreviewDate, isBootCampPreviewUser } from '../lib/bootcamp/clock.mjs'
import { leaderboardWindow } from '../lib/bootcamp/leaderboard.mjs'
export function record(day,correct=10) {
 const snapshot=adaptDay(fixture(day)).snapshot,state=initialState(snapshot)
 state.status='completed';state.phase='report';state.completed_at=`${BOOTCAMP_CALENDAR[day-1]?.date||'2026-11-23'}T10:00:00Z`
 let n=0
 for(const b of state.blocks){b.status='completed';b.started_at=state.completed_at;b.finished_at=state.completed_at;for(const q of b.questions){q.outcome=n++<correct?'correct':'incorrect';q.response='A';q.saved_at=state.completed_at;q.active_ms=2000}}
 return {day_number:day,snapshot,state}
}
const calendar=getBootCampCalendarState('2026-10-14')
test('ten-day aggregate preserves missing/partial days, weighted counts, samples and privacy',()=>{
 const records=[1,2,3,5,6,8,9,10].map(d=>record(d,d+8));const partial=record(7);partial.state.status='in_progress';partial.state.blocks[4].status='pending';records.push(partial)
 const result=buildOverallAnalytics(records,Array.from({length:10},(_,i)=>fixture(i+1)),calendar)
 assert.equal(result.daysCompleted,8);assert.equal(result.daysStarted,9);assert.equal(result.questionsAttempted,200);assert.equal(result.questionsCorrect,108);assert.equal(result.accuracy,54)
 assert.deepEqual(result.accuracyByDay.map(d=>d.day),[1,2,3,5,6,8,9,10]);assert.equal(result.curriculum.availableQuestions,250);assert.equal(result.curriculum.rcPassages,24)
 assert.equal(result.consistency[3].status,'no_activity');assert.equal(result.consistency[6].status,'partial');assert.equal(result.consistency[10].status,'future');assert.equal(result.currentStreak,6)
 assert.equal(result.partialDays.length,1);assert.equal(result.rc.averageSeconds,2);assert.ok(result.accuracyBySkill.some(s=>s.sufficient));assert.equal(result.recentTrend.sufficientEvidence,true);assert.ok(!result.birbal.watch.some(line=>result.accuracyBySkill.some(p=>p.trend.direction==='improving'&&line.startsWith(p.name+':'))))
 for(const forbidden of ['source_question_id','sourceAnswer','snapshot','optionAnalysis','Choose the supported answer.'])assert.ok(!JSON.stringify(result).includes(forbidden))
 records[0].state.report={accuracy:999};assert.equal(buildOverallAnalytics(records,[],calendar).accuracy,54)
})
test('empty, unanswered, missing timing, catch-up dates and Day 50 are truthful',()=>{
 const empty=buildOverallAnalytics([],[],calendar);assert.equal(empty.accuracy,null);assert.equal(empty.rc.averageSeconds,null)
 const r=record(1);r.state.blocks.forEach(b=>b.questions.forEach(q=>{q.outcome='not_reached';q.response=null;q.active_ms=0}));const a=buildOverallAnalytics([r],[],calendar);assert.equal(a.accuracy,null);assert.equal(a.questionsAttempted,0)
 const second=record(2);second.state.completed_at=r.state.completed_at;second.state.blocks.forEach(b=>{b.finished_at=r.state.completed_at;b.questions.forEach(q=>q.saved_at=r.state.completed_at)});assert.equal(buildOverallAnalytics([record(1),second],[],calendar).bestStreak,1)
 const day50=record(50);day50.state.completed_at='2026-11-23T10:00:00Z';day50.state.blocks.forEach(b=>{b.finished_at=day50.state.completed_at;b.questions.forEach(q=>q.saved_at=day50.state.completed_at)});assert.equal(buildOverallAnalytics([day50],[],getBootCampCalendarState('2026-11-23')).accuracyByDay[0].day,50)
})
test('overall profiles expose authored question types separately from selected distractor traps',()=>{
 const records=[record(1,0),record(2,0),record(3,0)]
 const result=buildOverallAnalytics(records,[],calendar)
 assert.ok(result.accuracyByQuestionType.some(p=>p.name==='Author Tone'))
 assert.ok(result.accuracyByQuestionType.some(p=>p.name==='Para Summary'))
 assert.ok(result.accuracyBySkill.some(p=>p.name==='Inference'))
 assert.equal(result.trapProfile.find(p=>p.name==='Causal Leap').count,6)
 assert.equal(result.trapProfile.find(p=>p.name==='Half Truth / Partial Truth').count,6)
 assert.equal(result.leadingTrap.name,'Causal Leap')
 assert.match(result.leadingTrap.description,/cause-and-effect/)
 const sparse=buildOverallAnalytics([record(1,0)],[],calendar)
 assert.equal(sparse.leadingTrap,null)
 assert.ok(sparse.trapProfile.every(p=>p.provisional))
})
test('development date is strict; deployed simulation requires an allowlisted Preview account',()=>{
 assert.equal(bootCampClock({NODE_ENV:'development',BOOTCAMP_TEST_DATE:'2026-10-05'}),'2026-10-05')
 assert.throws(()=>bootCampClock({NODE_ENV:'development',BOOTCAMP_TEST_DATE:'2026-02-30'}))
 for(const NODE_ENV of ['production','test',undefined])assert.ok(bootCampClock({NODE_ENV,BOOTCAMP_TEST_DATE:'invalid'}) instanceof Date)
 const env={VERCEL_ENV:'preview',BOOTCAMP_PREVIEW_USERS:'owner@example.com,cofounder@example.com'}
 assert.equal(isBootCampPreviewUser('COFOUNDER@example.com',env),true)
 assert.equal(isBootCampPreviewUser('student@example.com',env),false)
 assert.equal(isBootCampPreviewUser('cofounder@example.com',{...env,VERCEL_ENV:'production'}),false)
 assert.equal(bootCampPreviewDate('2026-10-10','cofounder@example.com',env),'2026-10-10')
 assert.equal(bootCampPreviewDate('2026-10-10','student@example.com',env),null)
 assert.equal(bootCampPreviewDate('2026-10-10','cofounder@example.com',{...env,VERCEL_ENV:'production'}),null)
 assert.throws(()=>bootCampPreviewDate('2026-02-30','cofounder@example.com',env))
 const simulated=bootCampPreviewDate('2026-10-10','cofounder@example.com',env)
 assert.equal(simulated,'2026-10-10','date-only simulator input is passed through without timezone conversion')
 assert.equal(getBootCampCalendarState(simulated).today,'2026-10-10')
 assert.equal(getBootCampCalendarState(simulated).todayDay,6)
 assert.deepEqual(leaderboardWindow('daily',simulated).scheduledDays.map(d=>d.day),[6])
})
test('analytics endpoint reads only owned Boot Camp data without writes, authentication or keys leaking',async()=>{
 const h=await harness(fixture());try{
 await h.service.enroll(student);await h.service.start(student,1);h.calls.length=0
 const result=await h.service.getBootCampOverallAnalytics(student);assert.equal(result.daysStarted,0);assert.equal(result.accuracy,null)
 assert.ok(h.calls.every(c=>c.operation==='select'||c.name==='bootcamp_read'));assert.ok(h.calls.every(c=>!c.table||c.table.startsWith('bootcamp_')))
 assert.equal((await h.service.getBootCampOverallAnalytics(other)).daysStarted,0)
 assert.equal((await h.handle(new Request('http://localhost/api/bootcamp/analytics'),'analytics')).status,401)
 const res=await h.handle(new Request('http://localhost/api/bootcamp/analytics',{headers:{authorization:`Bearer ${student}`}}),'analytics');assert.equal(res.status,200)
 }finally{await h.close()}
})
