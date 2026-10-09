export const BOOTCAMP_START_DATE = '2026-10-10'
export const BOOTCAMP_TRAINING_DAYS = 45
export const BOOTCAMP_BUFFER_DAYS = 10
// Practice access remains available for the existing 68 days after the shifted
// training and buffer schedule.
export const BOOTCAMP_ACCESS_DAYS_AFTER_PROGRAM = 68
export const BOOTCAMP_TIME_ZONE = 'Asia/Kolkata'
const DAY_MS=86400000
const addDays=(date,days)=>new Date(Date.parse(`${date}T00:00:00Z`)+days*DAY_MS).toISOString().slice(0,10)
// The only content-to-date mapping. Never derived from enrollment or completion.
export const BOOTCAMP_CALENDAR=Object.freeze(Array.from({length:BOOTCAMP_TRAINING_DAYS},(_,i)=>Object.freeze({day:i+1,date:addDays(BOOTCAMP_START_DATE,i)})))
export const BOOTCAMP_PROGRAM_END=addDays(BOOTCAMP_CALENDAR.at(-1).date,BOOTCAMP_BUFFER_DAYS)
export const BOOTCAMP_ACCESS_END=addDays(BOOTCAMP_PROGRAM_END,BOOTCAMP_ACCESS_DAYS_AFTER_PROGRAM)
export function bootCampDate(value=new Date()) {
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if(!Number.isFinite(Date.parse(value)) || new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw new Error('Invalid calendar date')
    return value
  }
  const date=new Date(value)
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid calendar date')
  return new Intl.DateTimeFormat('en-CA',{timeZone:BOOTCAMP_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
}
export function bootCampDateLabel(value) {
  const date=bootCampDate(value)
  return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'long'}).format(new Date(`${date}T00:00:00Z`))
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
  const start=new Date(`${BOOTCAMP_START_DATE}T00:00:00Z`),end=new Date(`${BOOTCAMP_PROGRAM_END}T00:00:00Z`)
  return Array.from({length:(end.getUTCFullYear()-start.getUTCFullYear())*12+end.getUTCMonth()-start.getUTCMonth()+1},(_,index)=>{
    const first=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+index,1))
    const offset=(first.getUTCDay()+6)%7,length=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate()
    return {label:first.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}),key:`${first.getUTCFullYear()}-${String(first.getUTCMonth()+1).padStart(2,'0')}`,cells:Array.from({length:Math.ceil((offset+length)/7)*7},(_,i)=>{
      const date=i-offset+1
      if(date<1||date>length)return null
      const iso=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),date)).toISOString().slice(0,10)
      return {date,iso,day:BOOTCAMP_CALENDAR.find(d=>d.date===iso)?.day || null,buffer:iso>BOOTCAMP_CALENDAR.at(-1).date && iso<=BOOTCAMP_PROGRAM_END}
    })}
  })
}
