export const BOOTCAMP_START_DATE = '2026-10-01'
export const BOOTCAMP_TRAINING_DAYS = 50
export const BOOTCAMP_PROGRAM_END = '2026-11-29'
export const BOOTCAMP_ACCESS_END = '2027-01-31'
export const BOOTCAMP_TIME_ZONE = 'Asia/Kolkata'
const DAY_MS=86400000
// The only content-to-date mapping. Never derived from enrollment or completion.
export const BOOTCAMP_CALENDAR=Object.freeze(Array.from({length:BOOTCAMP_TRAINING_DAYS},(_,i)=>Object.freeze({day:i+1,date:new Date(Date.parse(BOOTCAMP_START_DATE+'T00:00:00Z')+i*DAY_MS).toISOString().slice(0,10)})))
export function bootCampDate(value=new Date()) {
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if(!Number.isFinite(Date.parse(value)) || new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw new Error('Invalid calendar date')
    return value
  }
  const date=new Date(value)
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid calendar date')
  return new Intl.DateTimeFormat('en-CA',{timeZone:BOOTCAMP_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
}
export function getBootCampCalendarState(value,bootcampDay=null,status='not_started',examDate=null) {
  const today=bootCampDate(value)
  const period=today<BOOTCAMP_START_DATE?'UPCOMING':today>BOOTCAMP_ACCESS_END?'CLOSED':today<=BOOTCAMP_CALENDAR.at(-1).date?'TRAINING':today<=BOOTCAMP_PROGRAM_END?'BUFFER':'LIBRARY'
  const todayDay=BOOTCAMP_CALENDAR.find(d=>d.date===today)?.day || null
  const mapped=bootcampDay===null?null:BOOTCAMP_CALENDAR.find(d=>d.day===Number(bootcampDay))
  if(bootcampDay!==null&&!mapped)throw new Error('Invalid Boot Camp day')
  const unlocked=!!mapped && mapped.date<=today && period!=='CLOSED'
  const state=!mapped?period:!unlocked?'LOCKED':status==='completed'?'COMPLETED':status==='in_progress'?'IN_PROGRESS':mapped.day===todayDay?'TODAY':'OPEN_BACKLOG'
  const daysToExam=examDate?Math.max(0,Math.round((Date.parse(bootCampDate(examDate))-Date.parse(today))/DAY_MS)):null
  return {today,nextChangeAt:new Date(Date.parse(today+'T00:00:00+05:30')+DAY_MS).toISOString(),timeZone:BOOTCAMP_TIME_ZONE,period,todayDay,day:mapped?.day || null,releaseDate:mapped?.date || null,isToday:!!mapped&&mapped.day===todayDay,unlocked,state,accessEnd:BOOTCAMP_ACCESS_END,daysToExam}
}
export function trainingMonths() {
  return [9,10].map(month=>{
    const first=new Date(Date.UTC(2026,month,1)),offset=(first.getUTCDay()+6)%7,length=new Date(Date.UTC(2026,month+1,0)).getUTCDate()
    return {label:first.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}),key:`2026-${month+1}`,cells:Array.from({length:Math.ceil((offset+length)/7)*7},(_,i)=>{
      const date=i-offset+1
      if(date<1||date>length)return null
      const iso=new Date(Date.UTC(2026,month,date)).toISOString().slice(0,10)
      return {date,iso,day:BOOTCAMP_CALENDAR.find(d=>d.date===iso)?.day || null,buffer:iso>BOOTCAMP_CALENDAR.at(-1).date && iso<=BOOTCAMP_PROGRAM_END}
    })}
  })
}
