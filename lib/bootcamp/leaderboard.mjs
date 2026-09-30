import { BOOTCAMP_CALENDAR, BOOTCAMP_TIME_ZONE, bootCampDate } from './calendar.mjs'

const DAY_MS=86400000
const addDays=(date,days)=>new Date(Date.parse(`${date}T00:00:00Z`)+days*DAY_MS).toISOString().slice(0,10)
const utcMidnight=(date)=>new Date(Date.parse(`${date}T00:00:00Z`)-330*60*1000).toISOString()

export function leaderboardWindow(period,now=new Date()) {
  if(!['daily','weekly'].includes(period))throw new Error('Choose daily or weekly leaderboard.')
  const today=bootCampDate(now)
  let startDate=today,endDate=today
  if(period==='weekly') {
    const weekday=new Date(`${today}T00:00:00Z`).getUTCDay()
    startDate=addDays(today,-((weekday+6)%7))
    endDate=addDays(startDate,6)
  }
  const scheduledDays=BOOTCAMP_CALENDAR.filter(d=>d.date>=startDate&&d.date<=endDate)
  const nextDate=addDays(endDate,1)
  return {period,timeZone:BOOTCAMP_TIME_ZONE,startDate,endDate,label:period==='daily'?startDate:`${startDate} – ${endDate}`,startAt:utcMidnight(startDate),endAt:utcMidnight(nextDate),scheduledDays}
}

const safeName=value=>{
  const name=typeof value==='string'?value.trim().replace(/\s+/g,' '):''
  if(!name||name.length>80||/@/.test(name)||/\+?\d[\d\s().-]{7,}\d/.test(name))return 'Boot Camp learner'
  return name
}
const completionDate=attempt=>{try{return bootCampDate(attempt.state?.completed_at)}catch{return null}}
const complete=attempt=>attempt.state?.status==='completed'&&!!completionDate(attempt)&&
  Array.isArray(attempt.blocks)&&attempt.blocks.length===5&&attempt.blocks.every(b=>b.status==='completed'&&Number.isInteger(b.correct)&&b.correct>=0)

// Input records are assembled server-side from existing attempt, block, enrollment,
// and profile rows. Only the compact ranked projection leaves this function.
export function buildBootCampLeaderboard({period,now=new Date(),attempts=[],names={},currentUserId}) {
  const window=leaderboardWindow(period,now),dates=new Map(window.scheduledDays.map(d=>[d.day,d.date]))
  const byUser=new Map()
  for(const attempt of attempts) {
    const scheduledDate=dates.get(attempt.dayNumber)
    if(!scheduledDate||!complete(attempt)||completionDate(attempt)!==scheduledDate)continue
    const score=attempt.blocks.reduce((sum,b)=>sum+b.correct,0)
    if(!Number.isInteger(score)||score<0||score>25)continue
    const entry=byUser.get(attempt.userId)||{userId:attempt.userId,score:0,workouts:0}
    entry.score+=score;entry.workouts++;byUser.set(attempt.userId,entry)
  }
  const sorted=[...byUser.values()].sort((a,b)=>b.score-a.score||safeName(names[a.userId]).localeCompare(safeName(names[b.userId]))||a.userId.localeCompare(b.userId))
  const publicEntry=entry=>({rank:1+sorted.filter(other=>other.score>entry.score).length,name:safeName(names[entry.userId]),score:entry.score,workouts:entry.workouts,isCurrentUser:entry.userId===currentUserId})
  const entries=sorted.slice(0,10).map(publicEntry)
  const own=byUser.get(currentUserId)
  const current=own?publicEntry(own):{rank:null,name:safeName(names[currentUserId]),score:0,workouts:0,isCurrentUser:true}
  return {mode:period,timeZone:window.timeZone,label:window.label,window:{startDate:window.startDate,endDate:window.endDate,startAt:window.startAt,endAt:window.endAt,scheduledDays:window.scheduledDays.map(d=>({day:d.day,date:d.date}))},entries,current,eligibleStudents:sorted.length}
}
