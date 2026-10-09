import test from 'node:test'
import assert from 'node:assert/strict'
import { BOOTCAMP_ACCESS_END, BOOTCAMP_CALENDAR, BOOTCAMP_PROGRAM_END, BOOTCAMP_TRAINING_DAYS, BOOTCAMP_BUFFER_DAYS, getBootCampCalendarState,trainingMonths } from '../lib/bootcamp/calendar.mjs'
import { requireBootCampEntitlement } from '../lib/bootcamp/access.mjs'
import { fixture,harness,student,other } from './helpers/bootcamp-db.mjs'
import { BOOTCAMP_CURRICULUM_TOTALS } from '../lib/bootcamp/program.mjs'

for(const [date,today,open] of [['2026-10-05',1,1],['2026-10-09',5,5],['2026-10-29',25,25],['2026-11-18',45,45],['2026-11-19',null,45],['2026-11-28',null,45],['2027-02-04',null,45]])test(`fixed calendar ${date}`,()=>{
  const states=BOOTCAMP_CALENDAR.map(d=>getBootCampCalendarState(date,d.day))
  assert.equal(states.filter(d=>d.unlocked).length,open)
  assert.deepEqual(states.filter(d=>d.state==='TODAY').map(d=>d.day),today?[today]:[])
  assert.ok(states.filter(d=>d.day>open).every(d=>d.state==='LOCKED'))
  assert.ok(states.filter(d=>d.day<=open&&d.day!==today).every(d=>d.state==='OPEN_BACKLOG'))
  assert.equal(getBootCampCalendarState(date).todayDay,today)
})
test('45 training days, derived curriculum totals, ten buffer dates, India midnight boundaries, no invented CAT countdown',()=>{
  assert.equal(BOOTCAMP_TRAINING_DAYS,45)
  assert.deepEqual(BOOTCAMP_CURRICULUM_TOTALS,{trainingDays:45,warmupQuestions:225,rcPassages:135,rcQuestions:540,vaQuestions:360,totalQuestions:1125})
  assert.equal(BOOTCAMP_CALENDAR.length,45)
  assert.equal(BOOTCAMP_CALENDAR[0].date,'2026-10-05');assert.equal(BOOTCAMP_CALENDAR.at(-1).date,'2026-11-18')
  assert.equal(BOOTCAMP_PROGRAM_END,'2026-11-28');assert.equal(BOOTCAMP_ACCESS_END,'2027-02-04')
  assert.deepEqual(BOOTCAMP_CALENDAR.slice(0,3).map(d=>d.date),['2026-10-05','2026-10-06','2026-10-07'])
  assert.deepEqual(trainingMonths().map(m=>m.label),['October 2026','November 2026'])
  assert.equal(trainingMonths().flatMap(m=>m.cells).filter(c=>c?.buffer).length,BOOTCAMP_BUFFER_DAYS)
  assert.equal(getBootCampCalendarState('2026-10-04T18:29:59Z',1).state,'LOCKED')
  assert.equal(getBootCampCalendarState('2026-10-04T18:30:00Z',1).state,'TODAY')
  assert.equal(getBootCampCalendarState('2026-11-24').period,'BUFFER')
  assert.equal(getBootCampCalendarState('2026-12-04').period,'LIBRARY')
  assert.equal(getBootCampCalendarState('2027-02-05',1).unlocked,false)
  assert.equal(getBootCampCalendarState('2026-10-29').daysToExam,null)
  assert.equal(getBootCampCalendarState('2026-10-29',null,'not_started','2026-11-14').daysToExam,16)
  assert.equal(getBootCampCalendarState('2026-10-29',25,'completed').state,'COMPLETED')
  assert.equal(getBootCampCalendarState('2026-10-29',25,'completed').isToday,true)
  assert.equal(getBootCampCalendarState('2026-10-29',23,'in_progress').state,'IN_PROGRESS')
  assert.throws(()=>getBootCampCalendarState('2026-10-29',51))
})
test('simulated October 10 calendar shows backlog, today, future locks, and each account actual attempts',async()=>{
  let today='2026-10-10'
  const h=await harness(fixture(),undefined,undefined,{now:()=>today})
  try {
    for(const day of Array.from({length:9},(_,i)=>fixture(i+2)))await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[day.id,day.day_number,day.document,day.lock_token,day.updated_at])
    await h.service.enroll(student)
    const home=await h.service.home(student)
    assert.equal(home.calendar.devPreview,false)
    assert.equal(home.calendar.today,'2026-10-10')
    assert.equal(home.calendar.todayDay,6)
    assert.equal(home.days.slice(0,6).every(day=>day.accessible),true)
    assert.equal(home.days.slice(6).some(day=>day.accessible),false)
    assert.equal(home.days.slice(0,5).every(day=>day.state==='OPEN_BACKLOG'),true)
    assert.equal(home.days[5].state,'TODAY')
    assert.equal(home.days[0].releaseDate,'2026-10-05')
    assert.equal(home.completedDays,0)
    await h.service.enroll(other)
    const returningAttempt=await h.service.start(other,5)
    const returning=await h.service.home(other)
    assert.equal(returning.days[4].status,'in_progress')
    assert.equal((await h.service.home(other,5)).attempt.id,returningAttempt.id)
    today='2026-10-11'
    assert.equal((await h.service.home(student)).calendar.todayDay,7)
    assert.equal((await h.service.home(student)).days[6].state,'TODAY')
    assert.equal((await h.service.home(student)).days[7].state,'LOCKED')
    const board=await h.service.getBootCampLeaderboard(student,'daily')
    assert.equal(board.window.startDate,'2026-10-11')
    assert.equal(board.current.score,0)
    assert.equal(board.eligibleStudents,0)
  } finally {await h.close()}
})
test('new personal journey starts with published Day 1 content on the global Day 5 calendar',async()=>{
  let today='2026-10-09'
  const h=await harness(fixture(),undefined,undefined,{now:()=>today,personalSequence:true,freeDayOnly:true})
  try {
    for(const day of [2,3,4,5]) { const row=fixture(day); await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[row.id,row.day_number,row.document,row.lock_token,row.updated_at]) }
    await h.service.enroll(student)
    await h.service.enroll(student)
    const home=await h.service.home(student)
    assert.equal(home.calendar.todayDay,5)
    assert.equal(home.sequenceMode,'personal')
    assert.equal(home.personalDay,1)
    assert.equal(home.currentDay,1)
    assert.equal(home.days[0].accessible,true)
    assert.equal(home.days[4].accessible,false)
    const first=await h.service.start(student,1)
    assert.equal(first.dayNumber,1)
    assert.equal((await h.pg.query("select snapshot->>'sourceId' as source_id from bootcamp_day_attempts where id=$1",[first.id])).rows[0].source_id,'bootcamp-day-1')
    assert.equal((await h.service.start(student,1)).id,first.id)
    await assert.rejects(h.service.start(student,2),error=>error.status===402)
    await assert.rejects(h.service.home(student,5),error=>error.status===402)
    assert.equal((await h.pg.query('select count(*)::integer as n from bootcamp_enrollments where user_id=$1',[student])).rows[0].n,1)
    assert.equal((await h.pg.query('select count(*)::integer as n from bootcamp_day_attempts')).rows[0].n,1)
    assert.equal((await h.service.home(student)).attempt.id,first.id)
    await h.pg.query("insert into bootcamp_enrollments(user_id,program_key) values($1,'bootcamp')",[other])
    assert.equal((await h.service.home(other)).sequenceMode,'calendar')
  } finally { await h.close() }
})
test('personal sequence advances only after completion and keeps day snapshots stable',async()=>{
  const h=await harness(fixture(),undefined,undefined,{now:()=>new Date('2026-10-09T06:00:00Z'),personalSequence:true})
  try {
    const day2=fixture(2),day5=fixture(5)
    for(const row of [day2,day5])await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[row.id,row.day_number,row.document,row.lock_token,row.updated_at])
    await h.service.enroll(student)
    let state=await h.service.start(student,1)
    await assert.rejects(h.service.start(student,5),error=>error.status===409)
    const attemptId=state.id
    const act=async(action,input={})=>state=await h.service.act(student,attemptId,action,{revision:state.revision,...input})
    await act('advance')
    for(const key of ['warmup','rc1','rc2','rc3','va']) { await act('block_start',{key});await act('finish',{key});await act('advance',{reviewed:true}) }
    assert.equal((await h.service.home(student)).personalDay,2)
    const second=await h.service.start(student,2)
    assert.equal((await h.pg.query("select snapshot->>'sourceId' as source_id from bootcamp_day_attempts where id=$1",[second.id])).rows[0].source_id,'bootcamp-day-2')
    assert.notEqual(second.id,attemptId)
    assert.equal((await h.service.start(student,1)).id,attemptId)
  } finally { await h.close() }
})

test('October 9 exposes only valid past content as startable and leaves invalid content preparing',async()=>{
  const h=await harness(fixture(),undefined,undefined,{now:()=> '2026-10-09'})
  try {
    for(const day of [2,3,5]) {
      const row=fixture(day)
      if(day===3)row.document.status='draft'
      await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[row.id,row.day_number,row.document,row.lock_token,row.updated_at])
    }
    await h.service.enroll(student)
    const home=await h.service.home(student)
    assert.equal(home.days[0].state,'OPEN_BACKLOG');assert.equal(home.days[0].accessible,true)
    assert.equal(home.days[1].state,'OPEN_BACKLOG');assert.equal(home.days[1].accessible,true)
    assert.equal(home.days[2].unlocked,true);assert.equal(home.days[2].available,false);assert.equal(home.days[2].accessible,false)
    assert.equal(home.days[4].isToday,true);assert.equal(home.days[4].state,'TODAY');assert.equal(home.days[4].accessible,true)
    assert.equal((await h.service.start(student,2)).dayNumber,2)
    assert.equal((await h.service.start(student,5)).dayNumber,5)
    await assert.rejects(h.service.start(student,3),e=>e.status===404)
  } finally {await h.close()}
})
test('existing entitlement rules: active trial, purchase, institute, expiry, and no invented extension',()=>{
  const now=new Date('2026-10-25T00:00:00Z'),profile={trial_expires_at:'2026-10-26T00:00:00Z'}
  assert.equal(requireBootCampEntitlement({profile},now).kind,'trial')
  assert.throws(()=>requireBootCampEntitlement({profile:{trial_expires_at:'2026-10-20'}},now),e=>e.status===402)
  assert.equal(requireBootCampEntitlement({profile:{},subscription:{expires_at:'2027-02-01'}},now).kind,'subscription')
  assert.throws(()=>requireBootCampEntitlement({profile:{},subscription:{expires_at:'2026-10-20'}},now),e=>e.status===402)
  assert.equal(requireBootCampEntitlement({profile:{institute_id:'a'},resolvedTenant:{ok:true,kind:'institute',institute:{id:'a'}}},now).kind,'institute')
  assert.throws(()=>requireBootCampEntitlement({profile:{institute_id:'a'},resolvedTenant:{ok:true,kind:'institute',institute:{id:'b'}}},now),e=>e.status===402)
  assert.throws(()=>requireBootCampEntitlement({profile:{},subscription:{expires_at:'2026-12-04'}},new Date('2027-01-01')),e=>e.status===402)
})
test('SQL/service: late join, gaps, arbitrary backlog, official result, partial resume and route locks',async()=>{
  let today='2026-10-29'
  const h=await harness(fixture(),undefined,undefined,{now:()=>today})
  try {
    for(const day of [2,3,5,23,24,25,26,27,45]){const r=fixture(day);await h.pg.query('insert into bootcamp_days values($1,$2,$3,$4,$5)',[r.id,r.day_number,r.document,r.lock_token,r.updated_at])}
    await h.service.enroll(student)
    const initial=await h.service.home(student)
    assert.equal(initial.currentDay,25);assert.equal(initial.attempt,null)
    assert.equal(initial.days.filter(d=>d.unlocked).length,25)
    const current=await h.service.start(student,25)
    assert.equal(current.dayNumber,25)
    assert.equal((await h.service.home(student)).currentDay,25)
    await assert.rejects(h.service.start(student,26),e=>e.status===403)
    await assert.rejects(h.service.home(student,26),e=>e.status===403)
    await assert.rejects(h.service.chat(student,{dayNumber:26,messages:[{role:'user',content:'What is the passage?'}]}),e=>e.status===403)
    let state=await h.service.start(student,23)
    const id=state.id
    const act=async(action,input={})=>state=await h.service.act(student,id,action,{revision:state.revision,...input})
    await act('advance')
    for(const key of ['warmup','rc1']){await act('block_start',{key});await act('finish',{key});await act('advance',{reviewed:true})}
    const resumed=await h.service.start(student,23)
    assert.equal(resumed.id,id);assert.equal(resumed.currentBlock,'rc2');assert.equal(resumed.revision,state.revision)
    assert.equal((await h.service.home(student)).currentDay,25)
    for(const key of ['rc2','rc3','va']){await act('block_start',{key});await act('finish',{key});await act('advance',{reviewed:true})}
    const official=await h.db.rpc('bootcamp_read',{p_user:student,p_id:id})
    const reopen=await h.service.start(student,23)
    assert.equal(reopen.id,id);assert.equal(reopen.phase,'report');assert.equal(reopen.revision,state.revision)
    await assert.rejects(h.service.act(student,id,'block_start',{key:'warmup',revision:state.revision}))
    const after=await h.db.rpc('bootcamp_read',{p_user:student,p_id:id})
    assert.deepEqual(after.data.state,official.data.state)
    assert.equal((await h.pg.query('select count(*)::integer as n from bootcamp_day_attempts where day_number=23')).rows[0].n,1)
    for(const day of [5,2,24])assert.equal((await h.service.start(student,day)).dayNumber,day)
    today='2026-10-31'
    const returned=await h.service.home(student)
    assert.equal(returned.currentDay,27);assert.equal(returned.days[25].state,'OPEN_BACKLOG')
    assert.equal(returned.days[26].state,'TODAY');assert.equal(returned.days[27].state,'LOCKED')
    assert.equal((await h.service.start(student,27)).dayNumber,27)
    today='2026-10-28'
    await assert.rejects(h.service.get(student,current.id),e=>e.status===403)
    await assert.rejects(h.service.review(student,current.id,'warmup'),e=>e.status===403)
    await assert.rejects(h.service.coach(student,current.id),e=>e.status===403)
    today='2026-11-19'
    assert.equal((await h.service.home(student)).currentDay,null)
    assert.equal((await h.service.start(student,45)).dayNumber,45)
    today='2027-02-04';assert.equal((await h.service.home(student)).days.filter(d=>d.unlocked).length,45)
    today='2027-02-05';await assert.rejects(h.service.start(student,3),e=>e.status===403)
    assert.ok(h.calls.every(c=>!c.table||c.table.startsWith('bootcamp_')))
  } finally {await h.close()}
})
