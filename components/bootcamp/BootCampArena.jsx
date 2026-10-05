'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { bootcampRequest } from '@/lib/bootcamp/client'
import { BOOTCAMP_CALENDAR, BOOTCAMP_BUFFER_DAYS, BOOTCAMP_START_DATE, BOOTCAMP_TRAINING_DAYS, trainingMonths } from '@/lib/bootcamp/calendar.mjs'
import { calendarCellLabel } from '@/lib/bootcamp/calendar-display.mjs'
import { catDaysRemaining, nextIstMidnight } from '@/lib/bootcamp/countdown.mjs'
import { ArrowRight, BookOpen, BrainCircuit, CalendarDays, Clock3, FileText, Flame, ListChecks, Zap } from 'lucide-react'
import s from './arena.module.css'
import BootCampLeaderboard from './BootCampLeaderboard'

const months=trainingMonths()
const displayDate=date=>new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'})
const monthForDate=date=>months.findIndex(m=>m.key===date.slice(0,7))
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function AnalyticsCard({ data, loading, error }) {
  return <article className={`${s.featureCard} ${s.performance}`}>
    <div className={s.featureTop}><span className={s.sectionIndex}>03</span><span className={s.featureEyebrow}>MY PERFORMANCE</span></div>
    <h3>Your progress</h3>
    {loading?<p className={s.loading} role="status">Loading your training profile...</p>:error?<p className={s.loading} role="status">Your analytics are temporarily unavailable.</p>:<>
      <div className={s.metricGrid}>
        <div><span>COMPLETED DAYS</span><strong>{data.daysCompleted}<small> / 50</small></strong><small>training days</small></div>
        <div><span>ACCURACY</span><strong>{data.accuracy===null?'—':`${Math.round(data.accuracy)}%`}</strong><small>{data.accuracy===null?'building your baseline':'completed days'}</small></div>
        <div><span>STREAK</span><strong>{data.currentStreak}</strong><small>{data.currentStreak===1?'day':'days'} active</small></div>
      </div>
    </>}
    <Link className={s.featureCta} href="/boot-camp/analytics">Explore My Performance <span aria-hidden="true">↗</span></Link>
  </article>
}

export default function BootCampArena({ session, catalog, busy, onChat, unavailable = false, initialIstDate }) {
  const [month,setMonth]=useState(0),[showAllRows,setShowAllRows]=useState(false)
  const [performance,setPerformance]=useState(null),[performanceLoading,setPerformanceLoading]=useState(true),[performanceError,setPerformanceError]=useState(false)
  const [catDays,setCatDays]=useState(()=>initialIstDate ? catDaysRemaining(new Date(`${initialIstDate}T12:00:00+05:30`)) : null)
  useEffect(()=>{
    let timer,active=true
    const update=()=>{if(!active)return;const now=new Date();setCatDays(catDaysRemaining(now));timer=setTimeout(update,Math.max(1000,nextIstMidnight(now)-now.getTime()+100))}
    update()
    return ()=>{active=false;clearTimeout(timer)}
  },[])
  useEffect(()=>{
    let active=true
    bootcampRequest('/analytics').then(value=>{if(active)setPerformance(value)}).catch(()=>{if(active)setPerformanceError(true)}).finally(()=>{if(active)setPerformanceLoading(false)})
    return ()=>{active=false}
  },[])
  const day=catalog?.calendar?.todayDay||null,period=catalog?.calendar?.period
  useEffect(()=>{if(catalog?.calendar?.today){const index=monthForDate(catalog.calendar.today);setMonth(index<0?monthForDate(BOOTCAMP_START_DATE):index)}},[catalog?.calendar?.today])
  const displayDay=day?String(day).padStart(2,'0'):null
  const entry=catalog?.days?.find(d=>d.day===day),completed=session?.status==='completed'
  const action=completed?`View Day ${displayDay} Report`:session?`Continue Day ${displayDay}`:`Start Day ${displayDay}`
  const backlogDays=catalog?.days?.filter(d=>d.accessible&&!d.isToday&&d.status!=='completed').length||0
  const openDays=(catalog?.days||[]).filter(d=>d.accessible&&!d.isToday&&d.status!=='completed')
  const completedDays=catalog?.completedDays??performance?.daysCompleted??0
  const daysToGo=Math.max(0,BOOTCAMP_TRAINING_DAYS-completedDays-openDays.length)
  const firstVisit=(catalog?.completedDays||0)===0&&!session&&(catalog?.days||[]).every(d=>d.status==='not_started')
  const behind=backlogDays>0
  const periodTitle=period==='UPCOMING'?`Training starts ${displayDate(BOOTCAMP_START_DATE)}.`:period==='CLOSED'?'This Boot Camp has ended.':period==='BUFFER'?'Choose an open day to catch up.':'Your practice library is open.'
  const current=months[month]
  const todayCell=current?.cells.findIndex(cell=>cell?.iso===catalog?.calendar?.today)??-1
  const firstVisibleRow=todayCell>=0?Math.floor(todayCell/7):0
  const rowCount=current?.cells.length/7||0
  const visibleRowCount=Math.min(2,Math.max(0,rowCount-firstVisibleRow))
  const hiddenRowCount=Math.max(0,rowCount-visibleRowCount)
  const [testDate,setTestDate]=useState('')
  useEffect(()=>{setTestDate(new URLSearchParams(window.location.search).get('testDate')||sessionStorage.getItem('bootcamp-test-date')||'')},[])
  function changeTestDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return
    sessionStorage.setItem('bootcamp-test-date',value)
    const url=new URL(window.location.href);url.searchParams.set('testDate',value);window.location.assign(url.toString())
  }
  const stateTitle=busy?'Finding your next step':unavailable?'Training is temporarily unavailable':day?completed?'Today’s workout is complete.':behind?`You’re ${backlogDays} day${backlogDays===1?'':'s'} behind.`:firstVisit?'Your first workout is ready.':'You’re on track.':periodTitle
  const missionText=day
    ?entry?.accessible
      ?completed?`Day ${displayDay} is saved. Your report is ready whenever you want to review it.`:behind?`CAT won’t wait. Day ${displayDay} is live.`:session?`Day ${displayDay} is saved in progress. Pick up where you left off.`:`Day ${displayDay} is live and ready when you are.`
      :`Day ${displayDay} is being prepared. You can choose an available day in your calendar.`
    :period==='UPCOMING'?`Your 50-day calendar opens on ${displayDate(BOOTCAMP_START_DATE)}.`:period==='CLOSED'?'Your saved training and analytics remain available.':'Choose an open day in your calendar to continue.'

  const bootCampOutcome=day?completed?`Day ${displayDay} complete · report ready`:entry?.accessible?`Day ${displayDay} is live`:`Day ${displayDay} is being prepared`:period==='UPCOMING'?`Starts ${displayDate(BOOTCAMP_START_DATE)}`:period==='CLOSED'?'Training complete · reports remain available':'Your practice library is open'

  return <section className={s.arena}>
    {catalog?.calendar?.devPreview&&<div role="status" className={s.datePreview}><strong>Test account date preview</strong><label>Simulated date <input aria-label="Simulated date" type="date" value={testDate||catalog.calendar.today} onChange={event=>changeTestDate(event.target.value)} /></label><span>Only your allowlisted test account sees this date.</span></div>}

    <div className={s.topGrid}>
    <section className={s.todaySection} aria-labelledby="today-title">
      <div className={s.todayHero}>
        <div className={s.todayCopy}>
        <p className={s.eyebrow}>50 DAYS VARC BOOT CAMP</p>

<div className={s.heroBadges}>
  <div className={s.heroCatBadge}>CAT 2026</div>
 <div className={s.heroCountdown}>
  <Clock3 aria-hidden="true" />
  <strong>{catDays ?? '—'}</strong>
  <span>DAYS LEFT</span>
</div>
</div>

          <p className={s.todayKicker}>TODAY {day ? `· DAY ${displayDay}` : ""}</p>

<h1 id="today-title">
  50 days to sharpen your VARC <span>before CAT 2026.</span>
</h1>
          <div className={s.todayState}>
  <strong>{stateTitle}</strong>
  <p>{missionText}</p>
</div>
          {day&&entry?.accessible&&<div className={s.workoutGrid} aria-label="Today's workout"><div><FileText/><span>5-question</span><strong>WARM-UP</strong><small>untimed</small></div><div><BookOpen/><span>3 RC passages</span><strong>12 questions</strong><small>21 min</small></div><div><ListChecks/><span>8 VA questions</span><strong>8 min</strong><small>timed practice</small></div><div><BrainCircuit/><span>Birbal review</span><strong>after each block</strong><small>targeted feedback</small></div></div>}
          {day&&entry?.accessible&&<p className={s.minutesToday}>29 timed minutes today.</p>}
          <div className={s.todayActions}>
            {!busy&&!unavailable&&(day?(entry?.accessible?<Link className={s.startCta} href={`/boot-camp/day/${day}${completed?'/report':''}`}>{action}<span aria-hidden="true">→</span></Link>:<button className={s.startCta} disabled>Session being prepared</button>):['BUFFER','LIBRARY'].includes(period)||catalog?.calendar?.devPreview?<a className={s.startCta} href="#training-month">Browse open days <span aria-hidden="true">→</span></a>:null)}
          </div>
        </div>
        {day&&<div className={s.todayNumber} aria-hidden="true"><span>DAY</span><strong>{displayDay}</strong><small>OF 50</small></div>}
      </div>
    </section>
    <aside className={s.topAside} aria-label="CAT countdown and today's board">
      <article className={s.planCard} aria-labelledby="plan-title">
        <div className={s.planTop}><p id="plan-title">THE 50-DAY PLAN</p></div>
        <div className={s.planMetrics}>
          <div className={s.metricRc}><BookOpen aria-hidden="true"/><strong>150</strong><span>RC passages</span><small>50 × 3</small></div>
          <div className={s.metricQuestions}><ListChecks aria-hidden="true"/><strong>1,250</strong><span>practice questions</span><small>25 × 50</small></div>
          <div className={s.metricDays}><CalendarDays aria-hidden="true"/><strong>{BOOTCAMP_TRAINING_DAYS}</strong><span>training days</span><small>{displayDate(BOOTCAMP_START_DATE)} – {displayDate(BOOTCAMP_CALENDAR.at(-1).date)}</small></div>
          <div className={s.metricBuffer}><Zap aria-hidden="true"/><strong>{BOOTCAMP_BUFFER_DAYS}</strong><span>buffer days</span><small>after Day 50</small></div>
        </div>
        <div className={s.streakSummary}><div><strong>YOUR STREAK AT A GLANCE</strong><span>{completedDays} done · {openDays.length} open · {day?'today':'up next'} · {daysToGo} to go</span></div><div className={s.streakNow}><Flame aria-hidden="true"/><strong>{performance?.currentStreak??0}</strong><span>{performance?.currentStreak===1?'day':'days'}</span></div><div className={s.streakTrack} aria-label={`${completedDays} days completed, ${openDays.length} open for catch-up`}>
          {(catalog?.days||[]).slice(0,15).map(item=><i key={item.day} className={item.state==='COMPLETED'?s.streakDone:item.isToday?s.streakToday:item.state==='OPEN_BACKLOG'?s.streakOpen:s.streakLocked}/>)}</div>
        </div>
        <div className={s.catchupStrip}>
          <Clock3 aria-hidden="true"/>
          <p>{openDays.length?`${openDays.length} open day${openDays.length===1?'':'s'} to catch up · ${openDays.slice(0,3).map(item=>`Day ${String(item.day).padStart(2,'0')}`).join(', ')}`:day&&completed?'Today complete · keep your rhythm going':`No open days to catch up · ${bootCampOutcome}`}</p>
          <a href="#bootcamp-calendar">VIEW DAYS <ArrowRight aria-hidden="true"/></a>
        </div>
      </article>
      <AnalyticsCard
  data={performance}
  loading={performanceLoading}
  error={performanceError}
/>
    </aside>
    </div>

    <section className={s.trainingSteps} aria-label="How this trains your VARC">
      <p>HOW IT BUILDS YOUR VARC</p>
      <div><article><BookOpen/><span>01</span><section><strong>READ</strong><small>Daily CAT-level RC practice.</small></section></article><ArrowRight/><article><Zap/><span>02</span><section><strong>SOLVE</strong><small>Timed RC + VA builds speed and accuracy.</small></section></article><ArrowRight/><article><BrainCircuit/><span>03</span><section><strong>REVIEW</strong><small>Birbal turns mistakes into targeted practice.</small></section></article></div>
    </section>

    <div className={s.calendarGrid}>
    <section id="bootcamp-calendar" className={s.journeySection} aria-labelledby="training-title">
      <div className={s.sectionHeading}><div><p className={s.sectionLabel}><span>02</span> MY 50-DAY JOURNEY</p><h2 id="training-title">Your calendar, at a glance.</h2><p>Open days are ready when you are. Locked days will open on schedule.</p></div><a className={s.browseLink} href="#bootcamp-calendar">Browse Days <span aria-hidden="true">↓</span></a></div>
      {backlogDays>0&&<p className={s.catchupInline}>{backlogDays} open day{backlogDays===1?'':'s'} available to catch up · Choose any amber day below.</p>}
      <div className={s.calendar}>
        <div className={s.calendarTop}><div><span className={s.calendarKicker}>YOUR 50-DAY JOURNEY</span><strong>{day?`Today · Day ${displayDay}`:'50 training days + 10 buffer days'}</strong></div><span className={s.zone}>ALL RELEASES FOLLOW IST</span></div>
        <div className={s.monthTabs} role="tablist" aria-label="Training month">{months.map((m,i)=><button key={m.key} id={`month-${i}`} role="tab" aria-selected={month===i} aria-controls="training-month" tabIndex={month===i?0:-1} onClick={()=>{setMonth(i);setShowAllRows(false)}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?months.length-1:(month+(e.key==='ArrowRight'?1:-1)+months.length)%months.length;setMonth(next);setShowAllRows(false);document.getElementById(`month-${next}`)?.focus()}}}>{m.label}</button>)}</div>
        <div id="training-month" role="tabpanel" aria-labelledby={`month-${month}`} className={s.monthViewport}><table className={s.month}><caption className={s.srOnly}>{current.label}</caption><thead><tr>{weekdays.map(d=><th key={d} scope="col">{d}</th>)}</tr></thead><tbody>{Array.from({length:current.cells.length/7},(_,week)=><tr key={week} hidden={!showAllRows&&(week<firstVisibleRow||week>=firstVisibleRow+2)}>{current.cells.slice(week*7,week*7+7).map((cell,i)=>{
          if(!cell)return <td key={i} className={s.empty}/>
          const training=catalog?.days?.find(d=>d.day===cell.day),active=training?.isToday,done=training?.state==='COMPLETED'
          const stateLabel=calendarCellLabel(training,active)
          const cellClass=[active?s.active:'',done?s.complete:'',training?.state==='OPEN_BACKLOG'?s.backlog:'',training?.state==='IN_PROGRESS'||training?.state==='ATTEMPTED'?s.attempted:'',training?.state==='LOCKED'?s.locked:'',!cell.day&&!cell.buffer?s.outside:''].filter(Boolean).join(' ')
          const isCatchup=!!training?.accessible&&!done&&!active&&training.state==='OPEN_BACKLOG'
          const content=<><time dateTime={cell.iso}>{String(cell.date).padStart(2,'0')}</time>{cell.day?<><strong>DAY {String(cell.day).padStart(2,'0')}</strong>{isCatchup?<span className={s.catchupBadge}>CATCH-UP AVAILABLE · START</span>:<small>{stateLabel}</small>}</>:cell.buffer?<><strong>BUFFER</strong><small>{catalog?.calendar?.today>=cell.iso?'CATCH-UP':'UPCOMING'}</small></>:null}</>
          return <td key={i} data-training-day={cell.day||undefined} data-buffer={cell.buffer||undefined} className={cellClass}>{training?.accessible?<Link href={`/boot-camp/day/${cell.day}${done?'/report':''}`} aria-label={`Day ${cell.day} - ${isCatchup?'Catch up - start':stateLabel}`} aria-current={active?'date':undefined}>{content}</Link>:<div aria-label={`${cell.iso}, ${cell.day?`Day ${cell.day} - ${stateLabel}`:cell.buffer?'Buffer / catch-up':''}`}>{content}</div>}</td>
        })}</tr>)}</tbody></table></div>
        {hiddenRowCount>0&&<div className={s.rowControl}><button type="button" aria-expanded={showAllRows} aria-controls="training-month" onClick={()=>setShowAllRows(value=>!value)}>{showAllRows?'SHOW FEWER DAYS ↑':'SHOW MORE DAYS ↓'}</button></div>}
        <div className={s.legend} aria-label="Calendar status key"><span><i className={s.doneKey}/>Completed</span><span><i className={s.progressKey}/>In progress</span><span><i className={s.catchupKey}/>Open / catch-up</span><span><i className={s.todayKey}/>Today</span><span><i className={s.lockedKey}/>Locked</span></div>
      </div>
    </section>

  <aside className={s.calendarAside} aria-label="Today's board">
  <BootCampLeaderboard />

  <section className={s.birbalStrip} aria-label="Birbal, your trainer">
    <div className={s.portrait}>
      <img src="/Birbal avatar.jpeg" alt="Birbal" />
    </div>

    <div className={s.trainerCopy}>
      <p className={s.trainerEyebrow}>BIRBAL · YOUR TRAINER</p>
      <h2>Guidance grounded in your work.</h2>
      <p>
        {performance?.birbal?.focus ||
          performance?.birbal?.observation ||
          'Birbal will use your saved answers to suggest what to focus on next.'}
      </p>
    </div>

    <div className={s.trainerAction}>
      <button
        onClick={onChat}
        disabled={busy || unavailable || !entry?.accessible}
      >
        Talk to Birbal <ArrowRight aria-hidden="true" />
      </button>
    </div>
  </section>
</aside>
    </div>

  </section>
}
