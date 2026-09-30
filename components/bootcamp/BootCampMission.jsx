'use client'
import { useEffect, useMemo, useState } from 'react'
import { bootcampRequest } from '@/lib/bootcamp/client'
import s from './bootcamp.module.css'

function workoutBlock(text,index) {
  const [label='',details='']=text.split(': ',2)
  const questions=details.match(/^(\d+) questions?/i)?.[1]
  const duration=details.match(/,\s*([^.]*)\./)?.[1] || 'untimed'
  return {label:label || `Activity ${index+1}`,questions:Number(questions)||0,duration}
}

function ProgressStrip({ data, loading, error }) {
  const metrics=[
    ['COMPLETED DAYS',data?.daysCompleted,'of 50'],
    ['QUESTIONS',data?.questionsAttempted,'attempted'],
    ['ACCURACY',data?.accuracy===null?'—':data?`${Math.round(data.accuracy)}%`:null,'completed days'],
    ['CURRENT STREAK',data?.currentStreak,data?.currentStreak===1?'day':'days'],
  ]
  return <section className={s.missionProgress} aria-label="Your training progress">
    <div className={s.progressHeading}><span>YOUR PROGRESS</span><span>{loading?'Updating from your saved sessions':error?'Progress is temporarily unavailable':'Based on your saved training'}</span></div>
    <div className={s.progressStats}>{metrics.map(([label,value,caption])=><div className={s.progressStat} key={label}><span>{label}</span><strong>{value===null||value===undefined?'—':value}</strong><small>{caption}</small></div>)}</div>
  </section>
}

export default function BootCampMission({ commentary, onContinue, busy, ready, blockLabel, seconds, dayNumber = 1 }) {
  const [progress,setProgress]=useState(null)
  const [progressLoading,setProgressLoading]=useState(true)
  const [progressError,setProgressError]=useState(false)
  useEffect(()=>{
    if(ready){setProgressLoading(false);return}
    let active=true
    bootcampRequest('/analytics').then(data=>{if(active)setProgress(data)}).catch(()=>{if(active)setProgressError(true)}).finally(()=>{if(active)setProgressLoading(false)})
    return ()=>{active=false}
  },[ready])
  const briefing=commentary?.briefing
  const blocks=useMemo(()=>Array.isArray(briefing?.workout)?briefing.workout.map(workoutBlock):[],[briefing?.workout])
  const timedMinutes=blocks.reduce((total,block)=>total+(Number(block.duration.match(/^(\d+(?:\.\d+)?)\s*minutes?$/i)?.[1])||0),0)
  const workoutTotal=blocks.reduce((total,block)=>total+block.questions,0)
  const watch=briefing?.watching?.[0] || ''
  const hasObservedFocus=/^.+:\s+\d+ incorrect from \d+ recent attempts/.test(watch)
  const improved=briefing?.changed?.find(item=>item.includes("You've improved on these observed questions"))
  const watchEvidence=watch.match(/^(.+?):\s+(\d+) incorrect from (\d+) recent attempts/)
  const improvementEvidence=improved?.match(/to (\d+)\/(\d+) across (\d+) recent days/i)
  const diagnosisTitle=hasObservedFocus?watch.split(':')[0]:improved?improved.split(':')[0]:'A baseline, not a diagnosis'
  const diagnosisEvidence=hasObservedFocus && watchEvidence
    ? `${watchEvidence[1]}: ${watchEvidence[2]} incorrect from ${watchEvidence[3]} recent attempts.`
    : improved
      ? improvementEvidence
        ? `Recent results: ${improvementEvidence[1]} of ${improvementEvidence[2]} correct across ${improvementEvidence[3]} completed days.`
        : 'Recent results improved for this question group.'
      : briefing?.daysCompleted
        ? 'No repeated strength or focus area is supported by your recent completed work yet.'
        : 'There are no completed days to compare yet. Today’s answers will establish a starting point.'
  const mission=commentary?.focus || briefing?.mission
  const coachBriefing=briefing?.noticed?.[0] || commentary?.text || 'Let’s establish your starting point together.'
  const missionSource=briefing?.daysCompleted
    ? `BASED ON ${briefing.daysCompleted} COMPLETED TRAINING DAY${briefing.daysCompleted===1?'':'S'}`
    : 'TODAY’S FOCUS · BUILDING YOUR BASELINE'

  if (ready) return <section className={s.hero}><p className={s.eyebrow}>Your next activity</p><h1 className={s.title}>Let’s begin {blockLabel}.</h1><p className={s.lead}>{seconds?`You have ${seconds/60} minutes. Your timer starts when you’re ready. We’ll review your reasoning together afterward.`:'Five short questions to bring your reasoning into focus. There’s no countdown here; take the time you need.'}</p><div className={s.actions}><button className={s.primary} disabled={busy} onClick={onContinue}>{busy?'Preparing...':`Start ${blockLabel}`} <span aria-hidden="true">→</span></button></div>{seconds&&<p className={s.muted}>The clock continues if you refresh or leave. Saved answers stay with you.</p>}</section>

  return <section className={s.missionPage}>
    <section className={s.missionHero} aria-labelledby="mission-title">
      <div className={s.missionHeroCopy}>
        <p className={s.missionEyebrow}><span/> YOUR PERSONAL VARC TRAINING</p>
        <h1 id="mission-title">Day {String(dayNumber).padStart(2,'0')} <span>— Your Training Mission</span></h1>
        <p className={s.missionGreeting}>{commentary?.text || coachBriefing}</p>
        <p className={s.missionSubline}>One focused session. Five activities. Your reasoning, understood in context.</p>
      </div>
      <div className={s.coachStage}>
        <div className={s.coachGlow}/>
        <img className={s.coachPortrait} src="/Birbal avatar.jpeg" alt="Birbal, your VARC trainer" />
        <div className={s.speechCard}><span>BIRBAL <i/> YOUR COACH</span><p>{coachBriefing}</p></div>
      </div>
    </section>

    <ProgressStrip data={progress} loading={progressLoading} error={progressError}/>

    <section className={s.diagnosisCard} aria-labelledby="diagnosis-title">
        <div className={s.cardKicker}><span>01</span> BIRBAL’S DIAGNOSIS</div>
        <div className={s.diagnosisContent}><div><h2 id="diagnosis-title">{hasObservedFocus?'A pattern to watch':improved?'A strength taking shape':'Starting with an open mind'}</h2><strong className={s.diagnosisName}>{diagnosisTitle}</strong></div>
          <div><p className={s.evidence}>{diagnosisEvidence}</p><p className={s.caution}>{hasObservedFocus?'A useful signal from your recent work, not a fixed label.':improved?'Progress across observed questions; today gives us another chance to check it.':'Birbal will use today’s answers to build a more reliable picture. No pattern has been assumed.'}</p></div></div>
    </section>

    <section className={s.workoutSection} aria-labelledby="workout-title">
      <div className={s.workoutHeading}><div><p className={s.cardKicker}><span>03</span> THE SESSION</p><h2 id="workout-title">Today’s Workout</h2><p>Five clear steps. Birbal will review your reasoning after every activity.</p></div><div className={s.totalQuestions}><strong>{workoutTotal || '—'}</strong><span>QUESTIONS</span></div></div>
      <ol className={s.workoutSequence}>{blocks.map((block,index)=><li className={s.workoutStep} key={`${block.label}-${index}`}><span className={s.stepNumber}>{String(index+1).padStart(2,'0')}</span><div className={s.stepInfo}><h3>{block.label}</h3><p>{block.questions} questions</p></div><span className={s.duration}>{block.duration}</span>{index<blocks.length-1&&<span className={s.stepConnector} aria-hidden="true"/>}</li>)}</ol>
    </section>

    <section className={s.missionCallout} aria-labelledby="today-mission-title">
      <div className={s.calloutMark} aria-hidden="true">“</div>
      <div><div className={s.cardKicker}><span>04</span> TODAY’S MISSION</div><h2 id="today-mission-title">Your focus for this session</h2><p>{mission || 'Read for what the text supports, then use the review to check your reasoning.'}</p><div className={s.calloutFooter}><span/> {missionSource}</div></div>
    </section>

    <section className={s.beginPanel}>
      <div><p className={s.cardKicker}>YOUR DAY {String(dayNumber).padStart(2,'0')} STARTS HERE</p><h2>Ready when you are.</h2><p>{timedMinutes?`${timedMinutes} minutes timed practice`:'Timed practice details are loading'}{blocks.some(block=>block.duration==='untimed')?' · warm-up is untimed':''}</p></div>
      <button className={s.beginButton} disabled={busy || !commentary} onClick={onContinue}>{busy?'Preparing your mission...':`Begin Day ${dayNumber}`}<span aria-hidden="true">→</span></button>
    </section>
  </section>
}
