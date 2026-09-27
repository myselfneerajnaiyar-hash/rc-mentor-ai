'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { trainingMonths } from '@/lib/bootcamp/calendar.mjs'
import s from './arena.module.css'
const months=trainingMonths()
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const labels={TODAY:'TODAY',OPEN_BACKLOG:'OPEN',IN_PROGRESS:'IN PROGRESS',COMPLETED:'COMPLETED',LOCKED:'LOCKED'}
export default function BootCampArena({ session, catalog, busy, onChat, unavailable = false }) {
  const [month,setMonth]=useState(0)
  const day=catalog?.calendar?.todayDay || null,period=catalog?.calendar?.period
  useEffect(()=>{if(catalog?.calendar?.today){setMonth(catalog.calendar.today>='2026-11-01'?1:0)}},[catalog?.calendar?.today])
  const displayDay=day?String(day).padStart(2,'0'):null
  const entry=catalog?.days?.find(d=>d.day===day),completed=session?.status==='completed'
  const action=completed?`View Day ${displayDay} Report`:session?`Continue Day ${displayDay}`:`Enter Day ${displayDay}`
  const periodTitle=period==='UPCOMING'?'Training starts October 1.':period==='CLOSED'?'This Boot Camp has ended.':period==='BUFFER'?'Time to catch up and review.':'Your practice library is open.'
  const current=months[month]
  return <section className={s.arena}>
    <div className={s.hero}>
      <div className={s.identity}><p className={s.eyebrow}>Auctor VARC Boot Camp</p><h1>50 DAYS.<br/><span>ONE MISSION.</span></h1><p className={s.intro}>50 days. One trainer. One training path.</p><p className={s.support}>October 1 - November 29, 2026. Practice access through January 31, 2027.</p>
        <div className={s.mission}><p className={s.status}><i/>{busy?'Loading':unavailable?'Unavailable':day?`DAY ${displayDay} / Today's mission`:period==='BUFFER'?'BUFFER / CATCH UP':period==='LIBRARY'?'PRACTICE LIBRARY':'50-DAY GUIDED PRACTICE'}</p><h2>{busy?'Your training calendar':day?completed?'Today\'s work is complete.':session?'Continue today\'s mission.':'Your mission for today.':periodTitle}</h2><p className={s.current}>{day?entry?.available?session?`${session.blockLabel} / ${completed?'Completed':'In progress'}`:'Five activities. One focused session.':'Today\'s content is being prepared. Please check back soon.':period==='UPCOMING'?'Each day opens on its calendar date.':period==='CLOSED'?'Your saved results are retained.':'Choose any open day, resume your progress, or view a completed report.'}</p></div>
        <ol className={s.itinerary}>{['Warm-up','RC 1','RC 2','RC 3','VA'].map(x=><li key={x}>{x}</li>)}</ol>
        {!busy&&!unavailable&&(day?(entry?.accessible?<Link className={s.primary} href={`/boot-camp/day/${day}${completed?'/report':''}`}>{action}<span aria-hidden="true">&rarr;</span></Link>:<button className={s.primary} disabled>Day {displayDay} being prepared</button>):['BUFFER','LIBRARY'].includes(period)?<a className={s.primary} href="#bootcamp-calendar">Browse open training days <span aria-hidden="true">&rarr;</span></a>:null)}
        {!busy&&catalog&&<p className={s.summary}>{catalog.completedDays} days completed{catalog.catchUpDays>0?` / ${catalog.catchUpDays} days available to catch up`:''}{catalog.calendar.daysToExam!==null?` / ${catalog.calendar.daysToExam} days to CAT`:''}</p>}
        <Link href="/boot-camp/analytics">View your training analytics &rarr;</Link><p className={s.resume}>Your progress stays with you. Past days stay open.</p>
      </div>
      <section id="bootcamp-calendar" className={s.calendar} aria-label="50-day training calendar"><div className={s.calendarTop}><span>YOUR 50-DAY JOURNEY</span><span>{day?`Today: Day ${displayDay}`:'50 training days + 10 buffer days'}</span></div>
        <div className={s.tabs} role="tablist" aria-label="Training month">{months.map((m,i)=><button key={m.key} id={`month-${i}`} role="tab" aria-selected={month===i} aria-controls="training-month" tabIndex={month===i?0:-1} onClick={()=>setMonth(i)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?months.length-1:(month+(e.key==='ArrowRight'?1:-1)+months.length)%months.length;setMonth(next);document.getElementById(`month-${next}`)?.focus()}}}>{m.label}</button>)}</div>
        <div id="training-month" role="tabpanel" aria-labelledby={`month-${month}`}><table className={s.month}><caption className={s.srOnly}>{current.label}</caption><thead><tr>{weekdays.map(d=><th key={d} scope="col">{d}</th>)}</tr></thead><tbody>{Array.from({length:current.cells.length/7},(_,week)=><tr key={week}>{current.cells.slice(week*7,week*7+7).map((cell,i)=>{
          if(!cell)return <td key={i} className={s.empty}/>
          const training=catalog?.days?.find(d=>d.day===cell.day),active=training?.isToday,done=training?.state==='COMPLETED'
          const stateLabel=training?.unlocked&&!training?.available?'PREPARING':labels[training?.state] || 'LOCKED'
          const content=<><time dateTime={cell.iso}>{String(cell.date).padStart(2,'0')}</time>{cell.day?<><strong>DAY {String(cell.day).padStart(2,'0')}</strong><small>{active&&stateLabel!=='TODAY'?'TODAY / ':''}{stateLabel}</small></>:cell.buffer?<><strong>BUFFER</strong><small>{catalog?.calendar?.today>=cell.iso?'CATCH UP':'UPCOMING'}</small></>:null}</>
          return <td key={i} data-training-day={cell.day||undefined} data-buffer={cell.buffer||undefined} className={`${active?s.active:''} ${done?s.complete:''} ${!cell.day&&!cell.buffer?s.outside:''}`}>
            {training?.accessible?<Link href={`/boot-camp/day/${cell.day}${done?'/report':''}`} aria-label={`Day ${cell.day} - ${stateLabel}`} aria-current={active?'date':undefined}>{content}</Link>:<div aria-label={`${cell.iso}, ${cell.day?`Day ${cell.day} - ${stateLabel}`:cell.buffer?'Buffer / catch up':''}`}>{content}</div>}
          </td>
        })}</tr>)}</tbody></table></div><div className={s.legend}><span><i/> Today's mission</span><span>Past days open / Future days locked</span></div>
      </section>
    </div>
    <section className={s.trainer}><div className={s.portrait}><img src="/Birbal avatar.jpeg" alt="Birbal"/></div><div className={s.trainerCopy}><p className={s.amber}>BIRBAL</p><h2>Your VARC trainer.</h2><p>Work on today's mission, or return to any open day. We'll build on your saved practice.</p></div><div className={s.trainerAction}><button onClick={onChat} disabled={busy||unavailable||!entry?.accessible}>Talk to Birbal <span aria-hidden="true">&rarr;</span></button><small>{day?`Day ${day}: your current mission.`:'Choose an open day to continue with Birbal.'}</small></div></section>
  </section>
}
