import { createHash } from 'node:crypto'
import { metrics } from './session.mjs'
import { LABELS } from './content.mjs'

export const TRAINER_VERSION = 1
const count = rows => {
  const m = metrics(rows)
  const observed = rows.filter(q=>q.active_ms>0)
  const activeMs = observed.reduce((sum,q)=>sum+q.active_ms,0)
  return {total:m.total,attempted:m.answered,correct:m.correct,incorrect:m.incorrect,skipped:m.skipped,notReached:m.not_reached,timedOut:m.timed_out,
    accuracy:m.answered?m.accuracy:null,coverage:m.coverage,days:new Set(rows.map(q=>q.day)).size,attemptedDays:new Set(rows.filter(q=>q.outcome==='correct'||q.outcome==='incorrect').map(q=>q.day)).size,
    activeMs,observedTimingQuestions:observed.length,averageActiveSeconds:observed.length?activeMs/observed.length/1000:null}
}
const enough = m => m.attempted>=4 && m.attemptedDays>=2
function comparison(recent,previous) {
  const sufficient = enough(recent) && enough(previous)
  const delta = recent.accuracy!==null && previous.accuracy!==null ? recent.accuracy-previous.accuracy : null
  return {direction:!sufficient?'insufficient_evidence':delta>=10?'improving':delta<=-10?'declining':'stable',
    percentagePointChange:delta,sufficientEvidence:sufficient,interpretation:'Descriptive change across observed questions, not statistical significance or equal-difficulty testing.'}
}
function elapsed(record) {
  return record.state.blocks.reduce((sum,b)=>{
    const start=Date.parse(b.started_at),end=Date.parse(b.finished_at)
    return sum+(Number.isFinite(start)&&Number.isFinite(end)?Math.max(0,Math.round((end-start)/1000)):Number(b.result?.elapsed_seconds)||0)
  },0)
}
function questionRows(record) {
  return record.state.blocks.flatMap((b,i)=>b.questions.map((q,n)=>{
    const source=record.snapshot.blocks[i].questions[n]
    const selected=source.analysis.optionAnalysis?.find(o=>o.optionId===q.response)
    return {...q,day:record.day_number,block:b.key,id:source.id,type:source.type,skill:source.analysis.primarySkill,
      difficulty:source.analysis.difficulty || null,trap:q.outcome==='incorrect'?selected?.trapType || null:null,
      offeredTraps:[...new Set((source.analysis.optionAnalysis || []).filter(o=>!o.isCorrect && o.trapType).map(o=>o.trapType))],
      lesson:source.analysis.idealThinkingProcess?.[0] || source.analysis.explanation}
  }))
}
function windows(rows,recentDays,previousDays) {
  const overall=count(rows),recent=count(rows.filter(q=>recentDays.has(q.day))),previous=count(rows.filter(q=>previousDays.has(q.day)))
  const trend=comparison(recent,previous)
  const status=trend.direction==='improving'?'improving':enough(recent)&&recent.incorrect>=2?
    (!previous.attempted || !previous.incorrect?'emerging':enough(previous)&&previous.incorrect>=2?'persistent':'active'):
    recent.incorrect?'provisional':'no_current_signal'
  return {overall,recent,previous,trend,status}
}
function grouped(rows,field,recentDays,previousDays) {
  const names=[...new Set(rows.flatMap(q=>field==='trap'?q.offeredTraps:[q[field]]))].filter(Boolean).sort()
  return names.map(name=>{
    const selected=rows.filter(q=>field==='trap'?q.offeredTraps.includes(name):q[field]===name)
    const result=windows(selected,recentDays,previousDays)
    const selectionCount=items=>items.filter(q=>q.trap===name).length
    const recentRows=selected.filter(q=>recentDays.has(q.day)),previousRows=selected.filter(q=>previousDays.has(q.day))
    const selectionTrend=field==='trap'?comparison({...result.recent,accuracy:result.recent.attempted?(1-selectionCount(recentRows)/result.recent.attempted)*100:null},{...result.previous,accuracy:result.previous.attempted?(1-selectionCount(previousRows)/result.previous.attempted)*100:null}):null
    return {name,...result,...(field==='trap'?{
      selections:selectionCount(selected),
      status:selectionTrend.direction==='improving'?'improving':selectionCount(recentRows)>=2&&enough(result.recent)?(selectionCount(previousRows)>=2&&enough(result.previous)?'persistent':selectionCount(previousRows)===0?'emerging':'active'):selectionCount(recentRows)?'provisional':'no_current_signal',
      trend:selectionTrend,
      selectionRate:result.overall.attempted?selectionCount(selected)/result.overall.attempted*100:null,
      recentSelectionRate:result.recent.attempted?selectionCount(recentRows)/result.recent.attempted*100:null,
      previousSelectionRate:result.previous.attempted?selectionCount(previousRows)/result.previous.attempted*100:null,
      recentSelections:selected.filter(q=>q.trap===name&&recentDays.has(q.day)).length,
      previousSelections:selected.filter(q=>q.trap===name&&previousDays.has(q.day)).length,
      evidenceRule:'Performance counts describe questions offering this authored distractor, not errors caused by that trap. Selections count actual incorrect choices; rates use attempted exposed questions. Improving means fewer selections per opportunity. Trap metadata is a content hypothesis, not a mental diagnosis.'
    }: {})}
  })
}

// Only current-day content is retained here. Historical source text never enters
// this object. No answer keys or distractor explanations are exposed in a mission.
export function currentWorkout(snapshot) {
  return {dayNumber:snapshot.dayNumber,title:snapshot.title || `Day ${snapshot.dayNumber} training`,
    totalQuestions:snapshot.blocks.reduce((sum,b)=>sum+b.questions.length,0),
    blocks:snapshot.blocks.map(b=>({key:b.key,label:LABELS[b.key],seconds:b.seconds,questionCount:b.questions.length,
      passage:b.passage?{id:b.passage.id,text:b.passage.text,approvedEnrichment:{coreTheme:b.passageAnalysis?.coreTheme,authorIntent:b.passageAnalysis?.authorIntent}}:null,
      questions:b.questions.map(q=>({id:q.id,type:q.type,text:q.text,context:q.context || undefined,
        skill:q.analysis.primarySkill,difficulty:q.analysis.difficulty || null}))}))}
}

export function buildTrainerContext(records,currentDay,snapshot) {
  // The service supplies only this student's records. Curriculum order is not
  // completion order, so use saved attempts from every other workout day.
  const prior=records.filter(r=>r.day_number!==currentDay).sort((a,b)=>a.day_number-b.day_number)
  const completed=prior.filter(r=>r.state.status==='completed' && r.state.blocks.every(b=>b.status==='completed'))
  const recent=completed.slice(-3),previous=completed.slice(-6,-3),last5=completed.slice(-5)
  const recentDays=new Set(recent.map(r=>r.day_number)),previousDays=new Set(previous.map(r=>r.day_number))
  const rows=completed.flatMap(questionRows)
  const participation=prior.map(r=>{
    const questions=r.state.blocks.flatMap(b=>b.questions),attempted=questions.filter(q=>q.response!==null).length
    const started=r.state.blocks.some(b=>b.started_at) || attempted>0
    const status=completed.includes(r)?'completed':r.state.status==='abandoned'?'abandoned':started?'partially_completed':'not_started'
    return {day:r.day_number,status,total:questions.length,attempted,coverage:questions.length?attempted/questions.length*100:0}
  })
  const started=participation.filter(p=>p.status!=='not_started').length
  const overall={...count(rows),daysCompleted:completed.length,totalTrainingSeconds:completed.reduce((sum,r)=>sum+elapsed(r),0)}
  const questionTypes=grouped(rows,'type',recentDays,previousDays),skills=grouped(rows,'skill',recentDays,previousDays)
  const blocks=grouped(rows,'block',recentDays,previousDays),traps=grouped(rows,'trap',recentDays,previousDays)
  const currentDayContent=currentWorkout(snapshot)
  const presentTypes=new Set(snapshot.blocks.flatMap(b=>b.questions.map(q=>q.type)))
  const presentSkills=new Set(snapshot.blocks.flatMap(b=>b.questions.map(q=>q.analysis.primarySkill)))
  const patterns=[...questionTypes.map(p=>({...p,dimension:'questionType',relevantToday:presentTypes.has(p.name)})),
    ...skills.map(p=>({...p,dimension:'skill',relevantToday:presentSkills.has(p.name)}))]
  const rank={persistent:4,emerging:3,active:2,provisional:1,improving:0,no_current_signal:0}
  const priorities=patterns.filter(p=>p.relevantToday && rank[p.status]>0)
    .sort((a,b)=>rank[b.status]-rank[a.status] || b.recent.incorrect-a.recent.incorrect || a.name.localeCompare(b.name))
  const watching=[]
  for(const p of priorities) if(!watching.some(x=>x.name===p.name) && watching.length<2)watching.push(p)
  const history={overall,recent3:{dayNumbers:recent.map(r=>r.day_number),...count(rows.filter(q=>recentDays.has(q.day)))},
    recent5:{dayNumbers:last5.map(r=>r.day_number),...count(rows.filter(q=>last5.some(r=>r.day_number===q.day)))},
    previous3:{dayNumbers:previous.map(r=>r.day_number),...count(rows.filter(q=>previousDays.has(q.day)))},
    overallTrend:comparison(count(rows.filter(q=>recentDays.has(q.day))),count(rows.filter(q=>previousDays.has(q.day)))),
    participation:{days:participation,completed:completed.length,partiallyCompleted:participation.filter(p=>p.status==='partially_completed').length,
      abandoned:participation.filter(p=>p.status==='abandoned').length,
      notStarted:Math.max(0,currentDay-1-new Set(participation.filter(p=>p.day<currentDay).map(p=>p.day)).size),
      completionConsistency:{completed:completed.length,started,rate:started?completed.length/started*100:null,
        meaning:'Completed / started training days. This is not a calendar attendance rate; abandonment is never inferred from elapsed time.'}},
    questionTypes,skills,blocks,traps,
    patterns:{watching,improving:patterns.filter(p=>p.status==='improving').slice(0,4),
      persistent:patterns.filter(p=>p.status==='persistent').slice(0,4),emerging:patterns.filter(p=>p.status==='emerging').slice(0,4)},
    recentEvidence:rows.filter(q=>recentDays.has(q.day)&&q.outcome==='incorrect').slice(-3).map(q=>({day:q.day,id:q.id,type:q.type,skill:q.skill,outcome:q.outcome,trap:q.trap,lesson:q.lesson.slice(0,240)}))}
  const revision=createHash('sha256').update(JSON.stringify({version:TRAINER_VERSION,prior,snapshot})).digest('hex')
  return {version:TRAINER_VERSION,revision,currentDay:currentDayContent,history,
    rules:{source:'Saved Boot Camp question attempts and their immutable content metadata; cached report totals and AI summaries are not authoritative.',
      samplePolicy:'Trend labels require at least 4 attempted questions across 2 days in EACH non-overlapping window; differences of 10 percentage points are descriptive, not significance tests.',
      incomplete:'Partial and explicitly abandoned attempts are participation evidence only, never included in completed-day cognitive patterns.',
      timing:'Active view time covers observed questions only, not reading speed. Training time excludes review/coaching.',
      diagnoses:'Separate counts from tentative interpretation. Never turn a selected distractor or one wrong answer into a permanent diagnosis.'}}
}

const pct=n=>n===null?'not available':`${Math.round(n*10)/10}%`
const observation=p=>`${p.name}: ${p.overall.correct} correct and ${p.overall.incorrect} incorrect from ${p.overall.attempted} attempted across ${p.overall.attemptedDays} completed days. Recently: ${p.recent.correct}/${p.recent.attempted} correct across ${p.recent.attemptedDays} days.`
export function trainerBriefing(context) {
  const {history:h,currentDay:day}=context
  const noEvidence=h.overall.attempted===0
  const hasCompletedHistory=h.overall.daysCompleted>0
  const noticed=noEvidence?[hasCompletedHistory?`You've completed ${h.overall.daysCompleted} training day${h.overall.daysCompleted===1?'':'s'}. I don't have answered-question results to interpret yet, so today we'll add that evidence to your history.`:
    "Today is our starting point. I don't know your VARC patterns yet, so today's session will give me our first set of evidence."]:
    [`I've looked at your ${h.overall.daysCompleted} completed training days: ${h.overall.correct} correct from ${h.overall.attempted} attempted (${pct(h.overall.accuracy)}).`,
      ...h.patterns.watching.map(observation)].slice(0,3)
  if(h.participation.partiallyCompleted || h.participation.abandoned)noticed.push(`There are ${h.participation.partiallyCompleted} partial and ${h.participation.abandoned} explicitly abandoned days. I haven't treated these as completed-day reasoning evidence.`)
  const changed=h.questionTypes.filter(p=>['improving','declining'].includes(p.trend.direction)).slice(0,2).map(p=>
    `${p.name}: ${p.previous.correct}/${p.previous.attempted} correct across ${p.previous.attemptedDays} earlier days (${pct(p.previous.accuracy)}) to ${p.recent.correct}/${p.recent.attempted} across ${p.recent.attemptedDays} recent days (${pct(p.recent.accuracy)}). ${p.trend.direction==='improving'?"You've improved on these observed questions; I won't keep this as a fixed weakness.":"I've noticed a recent dip. Let's see whether it repeats today."}`)
  if(!changed.length)changed.push(h.overallTrend.sufficientEvidence?`Overall accuracy was ${pct(h.previous3.accuracy)} from ${h.previous3.attempted} earlier attempts and is ${pct(h.recent3.accuracy)} from ${h.recent3.attempted} recent attempts. These are different questions, not a controlled comparison.`:'There is not enough evidence in two separate periods to describe a reliable direction yet.')
  const watching=h.patterns.watching.map(p=>`${p.name}: ${p.recent.incorrect} incorrect from ${p.recent.attempted} recent attempts across ${p.recent.attemptedDays} days. ${p.status==='provisional'?"This is a small sample, not a diagnosis.":"This has appeared more than once; let's check whether it repeats today."}`)
  if(!watching.length)watching.push(noEvidence?(hasCompletedHistory?'How you choose and support your answers today; we can add answer-level evidence to your completed-workout history.':'How you choose and support your answers. I am establishing a starting point.'):'Whether your recent results hold on today\'s questions. I do not need to invent a weakness.')
  const workout=day.blocks.map(b=>`${b.label}: ${b.questionCount} questions${b.seconds?`, ${b.seconds/60} minutes`:`, untimed`}. ${[...new Set(b.questions.map(q=>q.type))].join(', ')}.`)
  const focus=h.patterns.watching[0]
  const mission=focus?`On today's ${focus.name} work, explain what supports your answer before choosing. We will compare this evidence with your recent ${focus.recent.correct}/${focus.recent.attempted} result.`:
    'Choose what the text supports, keep its qualifications intact, and use the review to check your reasoning.'
  return {title:`Day ${String(day.dayNumber).padStart(2,'0')} — your training mission`,text:hasCompletedHistory?"Good to see you again. I've looked at your work so far.":"Let's establish your starting point together.",
    focus:mission,evidenceIds:[],generatedBy:'deterministic',trainerRevision:context.revision,
    briefing:{noticed,changed,watching,workout,mission,daysCompleted:h.overall.daysCompleted}}
}

// Bounded LLM projection: every taxonomy remains available as counts, but source
// passages from previous days, full past answers, and AI memory text are excluded.
export function trainerPromptContext(context,includeCurrentContent=false) {
  const {history:h,currentDay:day}=context
  const compact=p=>({name:p.name,overall:{attempted:p.overall.attempted,correct:p.overall.correct,incorrect:p.overall.incorrect,days:p.overall.days,attemptedDays:p.overall.attemptedDays,accuracy:p.overall.accuracy,coverage:p.overall.coverage,averageActiveSeconds:p.overall.averageActiveSeconds},
    recent:{attempted:p.recent.attempted,correct:p.recent.correct,incorrect:p.recent.incorrect,days:p.recent.days,attemptedDays:p.recent.attemptedDays,accuracy:p.recent.accuracy,coverage:p.recent.coverage,averageActiveSeconds:p.recent.averageActiveSeconds},
    previous:{attempted:p.previous.attempted,correct:p.previous.correct,incorrect:p.previous.incorrect,days:p.previous.days,attemptedDays:p.previous.attemptedDays,accuracy:p.previous.accuracy,coverage:p.previous.coverage,averageActiveSeconds:p.previous.averageActiveSeconds},status:p.status,trend:p.trend.direction,
    ...(p.selections!==undefined?{selections:p.selections,recentSelections:p.recentSelections,previousSelections:p.previousSelections,selectionRate:p.selectionRate,recentSelectionRate:p.recentSelectionRate,previousSelectionRate:p.previousSelectionRate,evidenceRule:p.evidenceRule}: {})})
  return {version:context.version,overall:h.overall,recent3:h.recent3,recent5:h.recent5,previous3:h.previous3,participation:h.participation,
    questionTypes:h.questionTypes.map(compact),skills:h.skills.map(compact),blocks:h.blocks.map(compact),traps:h.traps.map(compact),
    watching:h.patterns.watching.map(compact),improving:h.patterns.improving.map(compact),recentEvidence:h.recentEvidence,
    currentDay:includeCurrentContent?day:{dayNumber:day.dayNumber,title:day.title,totalQuestions:day.totalQuestions,blocks:day.blocks.map(b=>({key:b.key,label:b.label,seconds:b.seconds,questionCount:b.questionCount,passageWords:b.passage?b.passage.text.trim().split(/\s+/).length:null,questions:b.questions.map(q=>({type:q.type,skill:q.skill,difficulty:q.difficulty}))}))},rules:context.rules}
}
