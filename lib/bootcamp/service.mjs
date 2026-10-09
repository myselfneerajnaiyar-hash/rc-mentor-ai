import { buildOverallAnalytics } from './overall.mjs'
import { BOOTCAMP_ACCESS_END, BOOTCAMP_CALENDAR, bootCampDate, getBootCampCalendarState } from './calendar.mjs'
import { adaptDay, BootCampError, trainingDay } from './content.mjs'
import { initialState, expired, transition, publicState, reviewState, coachKey } from './session.mjs'
import { chatContext, validateChat } from './chat.mjs'
import { fallbackCoach, generateCoach } from './coach.mjs'
import { buildTrainerContext, trainerBriefing } from './trainer.mjs'
import { buildBootCampLeaderboard, leaderboardWindow } from './leaderboard.mjs'

export function databaseError(error) {
  if (error.code === 'P0002') return new BootCampError('Session not found.', 404)
  if (error.code === '40001') return new BootCampError('Progress changed in another request. Reload to continue safely.', 409)
  if (error.message?.includes('previous personal training day')) return new BootCampError('Complete the previous personal training day first.', 409)
  if (error.message?.includes('deadline_expired')) return new BootCampError('Time is up. Your saved answers have been kept.', 409)
  return new BootCampError('Boot Camp is temporarily unavailable. Your saved progress is safe.', 503)
}
export function createService(db, generate, converse, {now=()=>new Date(),examDate=null,previewAccess=false,previewHomeAccess=false,datePreview=false,freeDayOnly=false,personalSequence=true}={}) {
  function calendar(day=null,status='not_started'){return getBootCampCalendarState(now(),day,status,examDate)}
  const canPreview=()=>typeof previewAccess==='function'?previewAccess():previewAccess
  function requireOpen(day){if(freeDayOnly&&Number(day)!==1)throw new BootCampError('Days 2–45 require full Boot Camp access. Day 1 is available free.',402);const value=trainingDay(day);if(value>BOOTCAMP_CALENDAR.length){const access=calendar();if(access.period==='CLOSED')throw new BootCampError(`Boot Camp practice access ended on ${BOOTCAMP_ACCESS_END}.`,403);return {...access,day:value,unlocked:true}}const access=calendar(value);if(!access.unlocked&&!canPreview())throw new BootCampError(access.period==='CLOSED'?`Boot Camp practice access ended on ${BOOTCAMP_ACCESS_END}.`:`Day ${day} opens on ${access.releaseDate}.`,403);return access}
  async function rpc(name, args) { const { data, error } = await db.rpc(name, args); if (error) throw databaseError(error); return data }
  async function enrollment(user, create = false) {
    if (create) {
      const { error } = await db.from('bootcamp_enrollments').upsert({ user_id: user, program_key: 'bootcamp', sequence_mode: personalSequence?'personal':'calendar' }, { onConflict: 'user_id,program_key', ignoreDuplicates: true })
      if (error) throw databaseError(error)
    }
    const { data, error } = await db.from('bootcamp_enrollments').select('id,user_id,sequence_mode').eq('user_id', user).eq('program_key','bootcamp').maybeSingle()
    if (error) throw databaseError(error)
    return data
  }
  async function read(user, id) { const record=await rpc('bootcamp_read', { p_user: user, p_id: id });requireOpen(record.day_number);return record }
  async function commit(user, record, state, action) { return rpc('bootcamp_commit', { p_user: user, p_id: record.id, p_revision: record.revision, p_next: state, p_action: action }) }
  async function fresh(user, id, expiringQuestionId=null) {
    for (let n = 0; n < 3; n++) {
      const r = await read(user, id), now = Date.parse(r.server_now)
      if (!expired(r.state, now)) return r
      try { return await commit(user, r, transition(r.state, r.snapshot, 'expire', {questionId:expiringQuestionId}, now), 'expire') }
      catch (e) { if (e.status !== 409 || n === 2) throw e }
    }
  }
  async function sourceFor(day) {
    const {data,error}=await db.from('bootcamp_days').select('id,day_number,document,lock_token,updated_at').eq('day_number',day).maybeSingle()
    if(error)throw databaseError(error)
    if(!data)throw new BootCampError('This training day is not available yet.',404)
    return adaptDay(data)
  }
  async function getBootCampTrainerContext(user,currentDay,providedSnapshot) {
    const day=trainingDay(currentDay)
    const snapshot=providedSnapshot || (await sourceFor(day)).snapshot
    const records=await rpc('bootcamp_history',{p_user:user,p_before_day:day})
    return buildTrainerContext(records,day,snapshot)
  }
  async function getBootCampOverallAnalytics(user) {
    const e=await enrollment(user)
    const {data:catalog,error}=await db.from('bootcamp_days').select('day_number,document')
    if(error)throw databaseError(error)
    const records=[]
    if(e) {
      const {data:ids,error}=await db.from('bootcamp_day_attempts').select('id').eq('enrollment_id',e.id).order('day_number',{ascending:true}).limit(50)
      if(error)throw databaseError(error)
      // Bounded, owned, read-only reads; analytics never expires a session.
      for(let i=0;i<(ids||[]).length;i+=5) records.push(...await Promise.all(ids.slice(i,i+5).map(r=>rpc('bootcamp_read',{p_user:user,p_id:r.id}))))
    }
    return buildOverallAnalytics(records,catalog||[],calendar())
  }
  async function getBootCampLeaderboard(user, mode) {
    if (!['daily','weekly'].includes(mode)) throw new BootCampError('Choose Daily or Weekly.',400)
    const reportAt=now(),window=leaderboardWindow(mode,reportAt),scheduledDates=new Map(window.scheduledDays.map(d=>[d.day,d.date]))
    async function allRows(table, columns, configure = q => q) {
      const result=[]
      for(let offset=0;;offset+=1000) {
        let query=db.from(table).select(columns).order('id',{ascending:true})
        query=configure(query).range(offset,offset+999)
        const {data,error}=await query
        if(error)throw databaseError(error)
        result.push(...(data||[]))
        if(!data||data.length<1000)break
      }
      return result
    }
    const attempts=window.scheduledDays.length?await allRows('bootcamp_day_attempts','id,enrollment_id,day_number,state',q=>q.in('day_number',window.scheduledDays.map(d=>d.day))):[]
    const candidateAttempts=attempts.filter(a=>{
      const scheduled=scheduledDates.get(a.day_number),completed=a.state?.completed_at
      if(!scheduled||a.state?.status!=='completed'||!completed)return false
      try{return bootCampDate(completed)===scheduled}catch{return false}
    })
    const enrollmentIds=[...new Set(candidateAttempts.map(a=>a.enrollment_id))],enrollments=[]
    for(let i=0;i<enrollmentIds.length;i+=100)enrollments.push(...await allRows('bootcamp_enrollments','id,user_id,program_key',q=>q.eq('program_key','bootcamp').in('id',enrollmentIds.slice(i,i+100))))
    const usersByEnrollment=new Map(enrollments.map(e=>[e.id,e.user_id]))
    const ownedAttempts=candidateAttempts.filter(a=>usersByEnrollment.has(a.enrollment_id))
    const candidateIds=ownedAttempts.map(a=>a.id)
    const blocks=[]
    for(let i=0;i<candidateIds.length;i+=100) {
      const ids=candidateIds.slice(i,i+100)
      const {data,error}=await db.from('bootcamp_block_attempts').select('day_attempt_id,state').in('day_attempt_id',ids)
      if(error)throw databaseError(error)
      blocks.push(...(data||[]))
    }
    const blocksByAttempt=new Map()
    for(const block of blocks) {
      const list=blocksByAttempt.get(block.day_attempt_id)||[]
      list.push({status:block.state?.status,correct:block.state?.result?.correct})
      blocksByAttempt.set(block.day_attempt_id,list)
    }
    const scoredAttempts=ownedAttempts.map(a=>({id:a.id,userId:usersByEnrollment.get(a.enrollment_id),dayNumber:a.day_number,state:a.state,blocks:blocksByAttempt.get(a.id)||[]}))
    const participantIds=scoredAttempts.filter(a=>a.blocks.length===5&&a.blocks.every(b=>b.status==='completed'&&Number.isInteger(b.correct))).map(a=>a.userId)
    const uniqueIds=[...new Set([user,...participantIds])],names={}
    for(let i=0;i<uniqueIds.length;i+=100) {
      const {data,error}=await db.from('profiles').select('user_id,name').in('user_id',uniqueIds.slice(i,i+100))
      if(error)throw databaseError(error)
      for(const profile of data||[]) names[profile.user_id]=profile.name
    }
    return buildBootCampLeaderboard({period:mode,now:reportAt,attempts:scoredAttempts,names,currentUserId:user})
  }
  async function project(user,record) {
    const value=publicState(record,Date.parse(record.server_now))
    if(record.state.phase==='mission') value.commentary=trainerBriefing(await getBootCampTrainerContext(user,record.day_number,record.snapshot))
    return value
  }
  async function home(user,requestedDay) {
   const [e, contentResult] = await Promise.all([
  enrollment(user,true),
  db.from('bootcamp_days').select('id,day_number,document,lock_token')
])

const {data:content,error:contentError} = contentResult
    if(contentError)throw databaseError(contentError)
    const available=new Set()
    for(const row of content || []) { try { adaptDay(row); available.add(row.day_number) } catch { /* Invalid content stays unavailable. */ } }
    let attempts=[]
    if(e) {
      const {data,error}=await db.from('bootcamp_day_attempts').select('id,day_number,state').eq('enrollment_id',e.id).order('day_number',{ascending:true})
      if(error)throw databaseError(error)
      attempts=data || []
    }
    const cal=calendar()
    const personal=e?.sequence_mode==='personal'
    let personalNextDay=null
    if(personal) {
      personalNextDay=1
      for(;personalNextDay<=BOOTCAMP_CALENDAR.length;personalNextDay++) {
        const attempt=attempts.find(a=>a.day_number===personalNextDay)
        if(!attempt||attempt.state.status!=='completed')break
      }
      if(personalNextDay>BOOTCAMP_CALENDAR.length)personalNextDay=BOOTCAMP_CALENDAR.length
    }
    const previewDay=requestedDay==null?null:trainingDay(requestedDay)
    const showPreviewDay=canPreview()&&(previewDay!==null||previewHomeAccess)
    const days=BOOTCAMP_CALENDAR.map(({day})=>{
      const attempt=attempts.find(a=>a.day_number===day),status=attempt?.state.status || 'not_started'
      const access=calendar(day,status)
      const preview=showPreviewDay&&(previewHomeAccess||previewDay===day)&&!access.unlocked
      const entitled=!freeDayOnly||day===1
      const inPersonalSequence=!personal||day<=personalNextDay
      const unlocked=(access.unlocked||preview)&&entitled&&inPersonalSequence
      return {day,available:entitled&&(available.has(day)||!!attempt),unlocked,accessible:unlocked&&(available.has(day)||!!attempt),status:entitled?status:'locked',state:!entitled?'LOCKED':preview?'PREVIEW':attempt?.state.status==='abandoned'?'ATTEMPTED':access.state,isToday:access.isToday,releaseDate:access.releaseDate}
    })
    const day=requestedDay==null?(personal?personalNextDay:cal.todayDay):trainingDay(requestedDay)
    if(requestedDay!=null) {
      requireOpen(day)
      if(personal&&day>personalNextDay)throw new BootCampError(`Complete personal Day ${personalNextDay} before starting Day ${day}.`,409)
    }
    const attempt=attempts.find(a=>a.day_number===day)
    return {enrolled:!!e,sequenceMode:personal?'personal':'calendar',personalDay:personal?day:null,attempt:attempt?await project(user,await fresh(user,attempt.id)):null,currentDay:day,nextDay:personal?personalNextDay:cal.todayDay,calendar:{...cal,devPreview:showPreviewDay||datePreview},days,
      completedDays:attempts.filter(a=>a.day_number<=BOOTCAMP_CALENDAR.length&&a.state.status==='completed').length,
      catchUpDays:days.filter(d=>d.accessible&&!d.isToday&&d.status!=='completed').length,
      nudge:{day:cal.todayDay,ready:!!days.find(d=>d.isToday)?.accessible,daysToExam:cal.daysToExam,text:cal.todayDay?`Day ${cal.todayDay} ${days.find(d=>d.isToday)?.accessible?'ready':'content is being prepared'}${cal.daysToExam===null?'':`, ${cal.daysToExam} days to CAT`}`:null}}
  }

  async function start(user,requestedDay=1) {
    const day=trainingDay(requestedDay);requireOpen(day);const e=await enrollment(user)
    if(!e)throw new BootCampError('Enroll before starting.',409)
    const existing=await home(user,day)
    if(existing.attempt)return existing.attempt
    if(day>BOOTCAMP_CALENDAR.length)throw new BootCampError('This Boot Camp curriculum ends at Day 45.',400)
    if(existing.sequenceMode==='personal'&&day!==existing.nextDay)throw new BootCampError(`Complete personal Day ${existing.nextDay} before starting Day ${day}.`,409)
    if(!existing.days[day-1].available)throw new BootCampError('This training day is being prepared. Please check back soon.',404)
    const source=await sourceFor(day)
    const state=initialState(source.snapshot)
    state.coaching['mission:0']=trainerBriefing(await getBootCampTrainerContext(user,day,source.snapshot))
    const r=await rpc('bootcamp_create',{p_user:user,p_enrollment:e.id,p_snapshot:source.snapshot,p_hash:source.source_hash,p_source_revision:source.source_revision,p_state:state})
    return project(user,r)
  }
  async function act(user, id, action, input) {
    const r = await fresh(user, id)
    const current = r.state.blocks[r.state.current_block]
    if (current.key === input.key && ((action === 'finish' && current.status === 'completed') || (action === 'block_start' && current.status === 'active'))) return publicState(r,Date.parse(r.server_now))
    if (!Number.isInteger(input.revision) || input.revision !== r.revision) throw new BootCampError('Progress has changed. Reload to continue safely.', 409)
    const now = Date.parse(r.server_now)
    let next
    if (action === 'advance' && input.reviewed === true) {
      if (!['review','commentary'].includes(r.state.phase)) throw new BootCampError('This review has already been continued. Reload saved progress.',409)
      // One explicit Continue commits both review checkpoints atomically. Reading
      // authored evidence must never depend on a remote coaching request finishing.
      next = r.state.phase === 'review' ? transition(r.state,r.snapshot,'advance',{},now) : structuredClone(r.state)
      next.coaching[coachKey(next)] ||= await generateCoach({...r,state:next},[],null)
      next = transition(next,r.snapshot,'advance',{},now)
    } else next = transition(r.state, r.snapshot, action, input, now)
    const saved = await commit(user, r, next, action)
    return publicState(saved, Date.parse(saved.server_now))
  }
  async function coach(user, id) {
    const r = await fresh(user, id), key = coachKey(r.state)
    if (!['mission','commentary','report'].includes(r.state.phase)) throw new BootCampError('Coaching is not available at this stage.')
    const trainer=await getBootCampTrainerContext(user,r.day_number,r.snapshot)
    if (r.state.coaching[key] && (r.state.phase!=='mission' || r.state.coaching[key].trainerRevision===trainer.revision)) return project(user,r)
    r.state.coaching[key] = r.state.phase==='mission' ? trainerBriefing(trainer) : await generateCoach(r,trainer,generate)
    try { const saved = await commit(user, r, r.state, 'coach'); return publicState(saved, Date.parse(saved.server_now)) }
    catch (e) { if (e.status === 409) { const latest = await fresh(user,id); if (latest.state.coaching[key]) return publicState(latest,Date.parse(latest.server_now)) } throw e }
  }
  async function chat(user,input) {
    validateChat(input)
    let id=input.attemptId
    if(!id) id=(await home(user,input.dayNumber)).attempt?.id
    // Read-only: history is reconstructed from raw owned attempts on every request.
    const record=id ? await read(user,id) : null
    const requested=record?.day_number ?? input.dayNumber ?? (await home(user)).currentDay
    if(requested==null)throw new BootCampError('Choose an open training day to talk with Birbal.',409)
    const day=trainingDay(requested);requireOpen(day)
    const trainer=await getBootCampTrainerContext(user,day,record?.snapshot)
    const context=chatContext(record,input.block,trainer,input.questionId)
    if(!converse)throw new BootCampError('Birbal chat is temporarily unavailable. Please retry.',503)
    try {
      const reply=await converse(context,input.messages)
      if(typeof reply!=='string' || !reply.trim())throw Error('Empty reply')
      return {reply}
    } catch {throw new BootCampError('Birbal could not reply just now. Please retry your message.',503)}
  }
  return { home, chat, getBootCampOverallAnalytics, getBootCampLeaderboard, getBootCampTrainerContext, enroll: user => enrollment(user,true), start, act, coach,
    get: async (user,id,expiringQuestionId) => { const r = await fresh(user,id,expiringQuestionId); return project(user,r) },
    review: async (user,id,key) => {
      const r = await fresh(user,id)
      const review = reviewState(r,key)
      const index = r.state.blocks.findIndex(b=>b.key===key)
      const state = {...r.state,phase:'commentary',current_block:index}
      return {...review,commentary:r.state.coaching[`${key}:${index+1}`] || fallbackCoach({...r,state})}
    } }
}
