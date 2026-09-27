import { BOOTCAMP_CALENDAR, bootCampDate } from './calendar.mjs'
import { buildTrainerContext } from './trainer.mjs'

const answered = q => ['correct','incorrect'].includes(q.outcome)
const complete = r => r.state.status === 'completed' && r.state.blocks.every(b => b.status === 'completed')
const stats = rows => {
  const attempts=rows.filter(answered), correct=attempts.filter(q=>q.outcome==='correct').length
  const timed=attempts.filter(q=>Number.isFinite(q.active_ms)&&q.active_ms>0)
  return {attempted:attempts.length,correct,accuracy:attempts.length?correct/attempts.length*100:null,
    observed:timed.length,averageSeconds:timed.length?timed.reduce((n,q)=>n+q.active_ms,0)/timed.length/1000:null}
}
const rows = (r,kind) => r.state.blocks.filter(b=>!kind || (kind==='rc'?/^rc[123]$/.test(b.key):b.key===kind)).flatMap(b=>b.questions)
const previousDate = date => new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10)

// Pure aggregate projection. No question text, responses, answer keys, identities,
// revisions or cached AI summaries are returned to the browser.
export function buildOverallAnalytics(records,catalog,calendar) {
  const ordered=[...records].sort((a,b)=>a.day_number-b.day_number)
  const completed=ordered.filter(complete), all=completed.flatMap(r=>rows(r)), overall=stats(all)
  // The generic trainer already supplies sample-aware, disjoint-window analysis.
  // 51 is an exclusive aggregation boundary, never a routable curriculum day.
  const history=completed.length?buildTrainerContext(ordered,51,completed.at(-1).snapshot).history:null
  const profile=items=>(items||[]).map(p=>({name:p.name,attempted:p.overall.attempted,correct:p.overall.correct,accuracy:p.overall.accuracy,days:p.overall.attemptedDays,
    sufficient:p.overall.attempted>=4&&p.overall.attemptedDays>=2,trend:p.trend,previous:p.previous,recent:p.recent}))
  const questionTypes=profile(history?.questionTypes),skills=profile(history?.skills)
  const byDay=completed.map(r=>({day:r.day_number,...stats(rows(r)),rc:stats(rows(r,'rc')),va:stats(rows(r,'va'))}))
  const activity=new Map()
  for(const r of ordered) for(const b of r.state.blocks) {
    // Opening a mission/block alone is not training evidence. Save/finish events
    // survive refresh; only the latest save per question is retained by schema.
    const events=[...b.questions.filter(q=>q.saved_at&&q.response!==null).map(q=>q.saved_at),...(b.finished_at?[b.finished_at]:[])]
    for(const event of events) {const date=bootCampDate(event);if(date<=calendar.today)activity.set(date,activity.get(date)||'partial')}
    if(complete(r)&&r.state.completed_at) {const date=bootCampDate(r.state.completed_at);if(date<=calendar.today)activity.set(date,'completed')}
  }
  let bestStreak=0,run=0,last=null
  for(const date of [...activity.keys()].sort()) {run=last===previousDate(date)?run+1:1;bestStreak=Math.max(bestStreak,run);last=date}
  let cursor=activity.has(calendar.today)?calendar.today:previousDate(calendar.today),currentStreak=0
  while(activity.has(cursor)){currentStreak++;cursor=previousDate(cursor)}
  const started=ordered.filter(r=>r.state.blocks.some(b=>b.started_at||b.questions.some(q=>q.response!==null)))
  const available=catalog.filter(c=>c.document?.status==='enriched'&&BOOTCAMP_CALENDAR.some(d=>d.day===c.day_number&&d.date<=calendar.today))
  // An existing snapshot remains authoritative if source content was replaced.
  const availableCounts=new Map(available.map(c=>[c.day_number,(c.document.content.warmup?.length||0)+(c.document.content.passages||[]).reduce((n,p)=>n+(p.questions?.length||0),0)+(c.document.content.verbalAbility?.length||0)]))
  for(const r of ordered)availableCounts.set(r.day_number,rows(r).length)
  const improving=skills.filter(p=>p.sufficient&&p.trend.direction==='improving').slice(0,2)
  const watch=skills.filter(p=>p.sufficient&&p.trend.direction!=='improving'&&p.accuracy<overall.accuracy).sort((a,b)=>a.accuracy-b.accuracy).slice(0,2)
  return {calendar,daysCompleted:completed.length,daysStarted:started.length,questionsAttempted:overall.attempted,questionsCorrect:overall.correct,accuracy:overall.accuracy,
    curriculumPercent:completed.length/50*100,completionRate:started.length?completed.length/started.length*100:null,currentStreak,bestStreak,
    rc:stats(completed.flatMap(r=>rows(r,'rc'))),va:stats(completed.flatMap(r=>rows(r,'va'))),warmup:stats(completed.flatMap(r=>rows(r,'warmup'))),
    accuracyByDay:byDay,accuracyByQuestionType:questionTypes,accuracyBySkill:skills,
    recentTrend:history?.overallTrend||null,recent:history?.recent3||null,previous:history?.previous3||null,
    consistency:BOOTCAMP_CALENDAR.map(d=>({day:d.day,date:d.date,status:d.date>calendar.today?'future':activity.get(d.date)||'no_activity',curriculumStatus:complete(ordered.find(r=>r.day_number===d.day)||{state:{status:null}})?'completed':started.some(r=>r.day_number===d.day)?'partial':'not_started'})),
    activityDates:[...activity].map(([date,status])=>({date,status})),
    curriculum:{availableQuestions:[...availableCounts.values()].reduce((a,b)=>a+b,0),availableDays:availableCounts.size,rcPassages:completed.reduce((n,r)=>n+r.state.blocks.filter(b=>/^rc/.test(b.key)).length,0),vaQuestions:stats(completed.flatMap(r=>rows(r,'va'))).attempted,warmups:completed.length},
    partialDays:started.filter(r=>!complete(r)).map(r=>({day:r.day_number,savedAnswers:rows(r).filter(q=>q.response!==null).length})),
    birbal:{observation:overall.attempted?`${overall.correct} correct from ${overall.attempted} attempted across ${completed.length} completed training days.`:'Your training profile is taking shape. Complete a training day to establish your starting point.',
      improving:improving.map(p=>`${p.name}: ${p.previous.correct}/${p.previous.attempted} earlier to ${p.recent.correct}/${p.recent.attempted} recent answers correct.`),
      watch:watch.map(p=>`${p.name}: ${p.correct}/${p.attempted} correct across ${p.days} days; currently below your overall accuracy.`),
      focus:watch.length?`In your next ${watch[0].name} review, explain what supports your answer before checking the explanation.`:'Keep choosing what the text supports, then use review to check your reasoning.'},
    missingData:{untimedAttempted:overall.attempted-overall.observed,provisionalTypes:questionTypes.filter(p=>!p.sufficient).length,provisionalSkills:skills.filter(p=>!p.sufficient).length},
    rules:{performance:'Accuracy and profiles use completed training days only. Partial days remain visible separately. Accuracy = correct ÷ attempted; warm-up is excluded from RC and VA comparisons. Question-type and skill profiles include warm-up.',
      timing:'Approximate active question-view time on answered questions with positive timing only. Excludes unobserved time and passage reading; not reading speed. Different questions are not controlled comparisons.',
      consistency:'Activity uses saved-answer and block-finish dates in Asia/Kolkata, not logins or curriculum day numbers. Only the latest save per question is retained; streaks are observed lower bounds. Simulated release dates do not rewrite real activity timestamps.',
      samples:'Profiles require 4 answers across 2 completed days. Trend arrows require that minimum in each non-overlapping three-day window; 10 percentage points is descriptive change, not statistical significance.'}}
}
