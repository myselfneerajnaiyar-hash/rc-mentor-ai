import test from 'node:test'
import assert from 'node:assert/strict'
import { leaderboardWindow,buildBootCampLeaderboard } from '../lib/bootcamp/leaderboard.mjs'
import { fixture,harness,student,other } from './helpers/bootcamp-db.mjs'
const lateStudent='00000000-0000-4000-8000-000000000003'
const partialStudent='00000000-0000-4000-8000-000000000004'

const splitScore=score=>{let left=score;return [5,4,4,4,8].map(capacity=>{const correct=Math.min(left,capacity);left-=correct;return correct})}
const blocks=score=>splitScore(score).map(correct=>({status:'completed',correct}))
const attempt=(userId,dayNumber,completedAt,score,status='completed',overrides={})=>({userId,dayNumber,
  state:{status,completed_at:completedAt,...overrides},blocks:blocks(score)})

test('leaderboard windows use IST dates, fixed +05:30 midnight, and Monday through Sunday weeks',()=>{
  assert.equal(leaderboardWindow('daily','2026-10-05T18:29:59Z').startDate,'2026-10-05')
  assert.equal(leaderboardWindow('daily','2026-10-05T18:30:00Z').startDate,'2026-10-06')
  const monday=leaderboardWindow('weekly','2026-10-05T00:00:00+05:30')
  assert.equal(monday.startDate,'2026-10-05');assert.equal(monday.endDate,'2026-10-11')
  assert.equal(monday.startAt,'2026-10-04T18:30:00.000Z');assert.equal(monday.endAt,'2026-10-11T18:30:00.000Z')
  assert.deepEqual(leaderboardWindow('weekly','2026-10-11T23:59:59+05:30').scheduledDays.map(d=>d.day),[1,2])
  assert.deepEqual(leaderboardWindow('weekly','2026-10-12T00:00:00+05:30').scheduledDays.map(d=>d.day),[3,4,5,6,7,8,9])
  assert.equal(leaderboardWindow('weekly','2026-10-12T00:00:00+05:30').startDate,'2026-10-12')
})

test('strict scheduled-date eligibility, complete-only scoring, tied ranks, weekly sums, and no-eligible state',async()=>{
  let now='2026-10-10T12:00:00+05:30'
  const h=await harness(fixture(),undefined,undefined,{now:()=>new Date(now)})
  try {
    const studentEnrollment='10000000-0000-4000-8000-000000000001',otherEnrollment='10000000-0000-4000-8000-000000000002',lateEnrollment='10000000-0000-4000-8000-000000000003',partialEnrollment='10000000-0000-4000-8000-000000000004'
    await h.pg.query('insert into auth.users values($1),($2)',[lateStudent,partialStudent])
    await h.pg.query('insert into bootcamp_enrollments(id,user_id,program_key) values($1,$2,$3),($4,$5,$3),($6,$7,$3),($8,$9,$3)',[studentEnrollment,student,'bootcamp',otherEnrollment,other,lateEnrollment,lateStudent,partialEnrollment,partialStudent])
    await h.pg.query('insert into profiles(user_id,name) values($1,$2),($3,$4),($5,$6),($7,$8)',[student,'Asha Rao',other,'Bela Sen',lateStudent,'Chirag Das',partialStudent,'Diya Roy'])
    let serial=1
    async function save(userEnrollment,day,completedAt,score,status='completed') {
      const id=`20000000-0000-4000-8000-${String(serial++).padStart(12,'0')}`
      const state={status,completed_at:completedAt,started_at:'2026-10-05T12:00:00Z'}
      await h.pg.query('insert into bootcamp_day_attempts(id,enrollment_id,day_number,source_hash,source_revision,snapshot,state) values($1,$2,$3,$4,$5,$6,$7)',[id,userEnrollment,day,'hash','rev',{},state])
      const results=splitScore(score)
      for(let i=0;i<5;i++)await h.pg.query('insert into bootcamp_block_attempts(day_attempt_id,block_key,position,state) values($1,$2,$3,$4)',[id,['warmup','rc1','rc2','rc3','va'][i],i,{status:i===4?status:'completed',result:{correct:results[i]}}])
      return id
    }
    // Day 1 finishes at 23:59:59 IST: eligible. Equal score means shared rank.
    await save(studentEnrollment,1,'2026-10-10T18:29:59Z',12)
    await save(otherEnrollment,1,'2026-10-10T18:29:59Z',12)
    // Started on Day 1 but saved completion is exactly midnight IST: late, excluded.
    await save(lateEnrollment,1,'2026-10-10T18:30:00Z',20)
    // Day 2 catch-up completed on Day 3: learning data is retained, leaderboard excludes it.
    await save(studentEnrollment,2,'2026-10-12T19:00:00Z',25)
    // Incomplete attempt is excluded even with a scheduled-date completion timestamp.
    await save(partialEnrollment,1,'2026-10-10T18:00:00Z',25,'in_progress')
    const daily=await h.service.getBootCampLeaderboard(student,'daily')
    assert.equal(daily.entries.length,2)
    assert.deepEqual(daily.entries.map(row=>row.rank),[1,1])
    assert.equal(daily.current.score,12);assert.equal(daily.current.workouts,1)
    assert.equal(daily.entries.filter(row=>row.isCurrentUser).length,1)
    assert.equal(JSON.stringify(daily).includes(student),false)
    assert.equal(JSON.stringify(daily).includes('completed_at'),false)
    assert.deepEqual((await h.service.getBootCampLeaderboard(student,'daily')).current,daily.current,'reopening/reloading does not duplicate unique user/day attempts')

    // Scheduled Days 5 and 6 both fall inside the MondayÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Sunday week of Oct 5.
    await save(studentEnrollment,5,'2026-10-14T05:00:00Z',10)
    await save(studentEnrollment,6,'2026-10-15T05:00:00Z',12)
    now='2026-10-16T12:00:00+05:30'
    const weekly=await h.service.getBootCampLeaderboard(student,'weekly')
    assert.equal(weekly.current.score,22);assert.equal(weekly.current.workouts,2)
    assert.equal(weekly.window.startDate,'2026-10-12');assert.equal(weekly.window.endDate,'2026-10-18')
    now='2026-10-11T12:00:00+05:30'
    const empty=await h.service.getBootCampLeaderboard(other,'daily')
    assert.equal(empty.current.rank,null);assert.equal(empty.current.score,0);assert.equal(empty.current.workouts,0)

    const unauth=await h.handle(new Request('http://localhost/api/bootcamp/leaderboard?mode=weekly'),'leaderboard')
    assert.equal(unauth.status,401)
    now='2026-10-10T12:00:00+05:30'
    const authed=await h.handle(new Request('http://localhost/api/bootcamp/leaderboard?mode=daily',{headers:{authorization:`Bearer ${other}`}}),'leaderboard')
    assert.equal(authed.status,200)
    const publicData=await authed.json()
    assert.equal(JSON.stringify(publicData).includes('enrollment_id'),false)
    assert.equal(JSON.stringify(publicData).includes('source_hash'),false)
    assert.equal(JSON.stringify(publicData).includes('Asha Rao'),true)
    assert.equal(JSON.stringify(publicData).includes('20000000-0000'),false)
  } finally {await h.close()}
})

test('pure rank projection does not expose an email profile value or private attempt identifiers',()=>{
  const data=buildBootCampLeaderboard({period:'daily',now:'2026-10-10T10:00:00Z',currentUserId:student,
    names:{[student]:'user@example.com',[other]:'Learner 2'},attempts:[
      {...attempt(student,1,'2026-10-10T10:00:00Z',8),id:'private-id'},
      attempt(other,1,'2026-10-10T10:00:00Z',8)
    ]})
  assert.equal(data.current.name,'Boot Camp learner')
  assert.equal(data.entries[0].rank,1);assert.equal(data.entries[1].rank,1)
  assert.equal(JSON.stringify(data).includes('private-id'),false)
  assert.equal(JSON.stringify(data).includes('user@example.com'),false)
})
