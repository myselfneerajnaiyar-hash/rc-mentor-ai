'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { bootcampRequest } from '@/lib/bootcamp/client'
import { BOOTCAMP_ACCESS_END, BOOTCAMP_PROGRAM_END, BOOTCAMP_START_DATE, trainingMonths } from '@/lib/bootcamp/calendar.mjs'
import s from './arena.module.css'
import BootCampLeaderboard from './BootCampLeaderboard'

const months=trainingMonths()
const displayDate=date=>new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'})
const monthForDate=date=>months.findIndex(m=>m.key===date.slice(0,7))
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const labels={TODAY:'TODAY',OPEN_BACKLOG:'CATCH-UP',IN_PROGRESS:'IN PROGRESS',ATTEMPTED:'ATTEMPTED',COMPLETED:'COMPLETED',PREVIEW:'PREVIEW',LOCKED:'LOCKED'}

function AnalyticsCard() {
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(false)
  useEffect(()=>{
    let active=true
    bootcampRequest('/analytics').then(value=>{if(active)setData(value)}).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[])
  const percent=Number.isFinite(data?.curriculumPercent)?Math.max(0,Math.min(100,data.curriculumPercent)):0
  return <article className={`${s.featureCard} ${s.performance}`}>
    <div className={s.featureTop}><span className={s.sectionIndex}>02</span><span className={s.featureEyebrow}>YOUR PERFORMANCE</span></div>
    <h3>A clearer view of your progress.</h3>
    <p className={s.featureIntro}>See what is improving, what you have covered, and where to focus next.</p>
    {loading?<p className={s.loading} role="status">Loading your training profile...</p>:error?<p className={s.loading} role="status">Your analytics are temporarily unavailable.</p>:<>
      <div className={s.progressMeta}><span>CURRICULUM</span><strong>{data.daysCompleted} <small>/ 50 days</small></strong></div>
      <div className={s.progressTrack} role="progressbar" aria-label="Training days completed" aria-valuemin={0} aria-valuemax={50} aria-valuenow={data.daysCompleted}><span style={{width:`${percent}%`}}/></div>
      <div className={s.metricGrid}>
        <div><span>QUESTIONS</span><strong>{data.questionsAttempted}</strong><small>attempted</small></div>
        <div><span>ACCURACY</span><strong>{data.accuracy===null?'—':`${Math.round(data.accuracy)}%`}</strong><small>{data.accuracy===null?'building your baseline':'completed days'}</small></div>
        <div><span>STREAK</span><strong>{data.currentStreak}</strong><small>{data.currentStreak===1?'day':'days'} active</small></div>
      </div>
    </>}
    <Link className={s.featureCta} href="/boot-camp/analytics">View My Analytics <span aria-hidden="true">↗</span></Link>
  </article>
}

export default function BootCampArena({ session, catalog, busy, onChat, unavailable = false }) {
  const [month,setMonth]=useState(0)
  const day=catalog?.calendar?.todayDay || null,period=catalog?.calendar?.period
  useEffect(()=>{if(catalog?.calendar?.today){const index=monthForDate(catalog.calendar.today);setMonth(index<0?monthForDate(BOOTCAMP_START_DATE):index)}},[catalog?.calendar?.today])
  const displayDay=day?String(day).padStart(2,'0'):null
  const entry=catalog?.days?.find(d=>d.day===day),completed=session?.status==='completed'
  const action=completed?`View Day ${displayDay} Report`:session?`Continue Day ${displayDay}`:`Start Day ${displayDay}`
  const periodTitle=period==='UPCOMING'?`Training starts ${displayDate(BOOTCAMP_START_DATE)}.`:period==='CLOSED'?'This Boot Camp has ended.':period==='BUFFER'?'Choose a day to catch up.':'Your practice library is open.'
  const current=months[month]
  const [testDate,setTestDate]=useState('')
  useEffect(()=>{setTestDate(new URLSearchParams(window.location.search).get('testDate')||sessionStorage.getItem('bootcamp-test-date')||'')},[])
  function changeTestDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return
    sessionStorage.setItem('bootcamp-test-date',value)
    const url=new URL(window.location.href);url.searchParams.set('testDate',value);window.location.assign(url.toString())
  }
  const missionText=day
    ? entry?.accessible
      ? completed?'Today’s workout is complete. Your report is ready.':session?'Pick up where you left off.':'Your scheduled workout is ready.'
      : 'Today’s session is being prepared. Browse available days in the meantime.'
    : period==='UPCOMING'?`Your 50-day calendar opens on ${displayDate(BOOTCAMP_START_DATE)}.`:period==='CLOSED'?'Your saved training and analytics remain available.':'Select an open day to continue training.'

  return <section className={s.arena}>
    {catalog?.calendar?.devPreview&&<div role="status" style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',padding:'12px 16px',marginBottom:20,border:'1px solid #b7ead1',borderRadius:8,background:'#10231c',color:'#d8f5e5'}}><strong>Test account date preview</strong><label>Simulated date <input aria-label="Simulated date" type="date" value={testDate||catalog.calendar.today} onChange={event=>changeTestDate(event.target.value)} /></label><span>Only your allowlisted test account sees this date.</span></div>}
    <header className={s.pageIntro}>
      <div><p className={s.eyebrow}>AUCTOR VARC / BOOT CAMP</p><h1>Train with intent.<br/><span>Track every day.</span></h1><p className={s.intro}>A focused 50-day path to sharper reading and more confident reasoning.</p></div>
      <div className={s.programNote}><span>THE TRAINING WINDOW</span><strong>{displayDate(BOOTCAMP_START_DATE)} — {displayDate(BOOTCAMP_PROGRAM_END)}</strong><small>Practice access through {displayDate(BOOTCAMP_ACCESS_END)}</small></div>
    </header>

    <div className={s.dashboardGrid}>
      <section id="bootcamp-calendar" className={s.training} aria-labelledby="training-title">
        <div className={s.sectionHeading}><div><p className={s.sectionLabel}><span>01</span> CONTINUE TRAINING</p><h2 id="training-title">Your next session starts here.</h2><p>Follow the calendar, continue today, or catch up on an open day.</p></div><a className={s.browseLink} href="#bootcamp-calendar">Browse Days <span aria-hidden="true">↓</span></a></div>

        <div className={s.mission}>
          <div className={s.missionCopy}><span className={s.missionTag}>{busy?'CHECKING YOUR CALENDAR':unavailable?'TRAINING UNAVAILABLE':day?`SCHEDULED TODAY / DAY ${displayDay}`:period==='BUFFER'?'CATCH-UP WINDOW':period==='CLOSED'?'PRACTICE LIBRARY':'50-DAY PROGRAM'}</span><h3>{busy?'Preparing your next step':day?completed?'A strong session, completed.':session?'Welcome back to your session.':'Today’s mission is ready.':periodTitle}</h3><p>{missionText}</p></div>
          {!busy&&!unavailable&&(day?(entry?.accessible?<Link className={s.startCta} href={`/boot-camp/day/${day}${completed?'/report':''}`}>{action}<span aria-hidden="true">→</span></Link>:<button className={s.startCta} disabled>Session being prepared</button>):['BUFFER','LIBRARY'].includes(period)||catalog?.calendar?.devPreview?<a className={s.startCta} href="#training-month">Browse open days <span aria-hidden="true">→</span></a>:null)}
        </div>

        <div className={s.calendar}>
          <div className={s.calendarTop}><div><span className={s.calendarKicker}>YOUR 50-DAY JOURNEY</span><strong>{day?`Today · Day ${displayDay}`:'50 training days + 10 buffer days'}</strong></div><span className={s.zone}>ALL RELEASES FOLLOW IST</span></div>
          <div className={s.monthTabs} role="tablist" aria-label="Training month">{months.map((m,i)=><button key={m.key} id={`month-${i}`} role="tab" aria-selected={month===i} aria-controls="training-month" tabIndex={month===i?0:-1} onClick={()=>setMonth(i)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?months.length-1:(month+(e.key==='ArrowRight'?1:-1)+months.length)%months.length;setMonth(next);document.getElementById(`month-${next}`)?.focus()}}}>{m.label}</button>)}</div>
          <div id="training-month" role="tabpanel" aria-labelledby={`month-${month}`}><table className={s.month}><caption className={s.srOnly}>{current.label}</caption><thead><tr>{weekdays.map(d=><th key={d} scope="col">{d}</th>)}</tr></thead><tbody>{Array.from({length:current.cells.length/7},(_,week)=><tr key={week}>{current.cells.slice(week*7,week*7+7).map((cell,i)=>{
            if(!cell)return <td key={i} className={s.empty}/>
            const training=catalog?.days?.find(d=>d.day===cell.day),active=training?.isToday,done=training?.state==='COMPLETED'
            const stateLabel=training?.unlocked&&!training?.available?'PREPARING':training?.available&&training.state==='OPEN_BACKLOG'?'CATCH-UP':labels[training?.state]||'LOCKED'
            const cellClass=[active?s.active:'',done?s.complete:'',training?.state==='OPEN_BACKLOG'?s.backlog:'',training?.state==='IN_PROGRESS'||training?.state==='ATTEMPTED'?s.attempted:'',training?.state==='LOCKED'?s.locked:'',!cell.day&&!cell.buffer?s.outside:''].filter(Boolean).join(' ')
            const content=<><time dateTime={cell.iso}>{String(cell.date).padStart(2,'0')}</time>{cell.day?<><strong>DAY {String(cell.day).padStart(2,'0')}</strong><small>{active&&stateLabel!=='TODAY'?'TODAY · ':''}{stateLabel}</small></>:cell.buffer?<><strong>BUFFER</strong><small>{catalog?.calendar?.today>=cell.iso?'CATCH-UP':'UPCOMING'}</small></>:null}</>
            return <td key={i} data-training-day={cell.day||undefined} data-buffer={cell.buffer||undefined} className={cellClass}>{training?.accessible?<Link href={`/boot-camp/day/${cell.day}${done?'/report':''}`} aria-label={`Day ${cell.day} - ${stateLabel}`} aria-current={active?'date':undefined}>{content}</Link>:<div aria-label={`${cell.iso}, ${cell.day?`Day ${cell.day} - ${stateLabel}`:cell.buffer?'Buffer / catch-up':''}`}>{content}</div>}</td>
          })}</tr>)}</tbody></table></div>
          <div className={s.legend} aria-label="Calendar status key"><span><i className={s.doneKey}/>Completed</span><span><i className={s.progressKey}/>In progress</span><span><i className={s.catchupKey}/>Catch-up available</span><span><i className={s.lockedKey}/>Locked until release</span></div>
        </div>
      </section>

      <aside className={s.destinations} aria-label="Your performance and leaderboards">
        <AnalyticsCard />
        <BootCampLeaderboard />
      </aside>
    </div>

    <section className={s.trainer}><div className={s.portrait}><img src="/Birbal avatar.jpeg" alt="Birbal"/></div><div className={s.trainerCopy}><p className={s.trainerEyebrow}>YOUR TRAINER</p><h2>Birbal is here to help you think clearly.</h2><p>Review your reasoning, ask questions, and build on every session.</p></div><div className={s.trainerAction}><button onClick={onChat} disabled={busy||unavailable||!entry?.accessible}>Talk to Birbal <span aria-hidden="true">→</span></button><small>{day?`Day ${day}: your current mission.`:'Choose an open day to continue with Birbal.'}</small></div></section>
  </section>
}
