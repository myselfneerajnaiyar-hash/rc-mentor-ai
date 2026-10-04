'use client'
import { useState, useRef } from 'react'
import { ListChecks, Target, Clock3, Check, X, SkipForward, ListTodo, Timer } from 'lucide-react'
import BootCampReportAnalytics from './BootCampReportAnalytics'
import Link from 'next/link'
import s from './report.module.css'
const percent=value=>value===null?'—':`${Number(value.toFixed(1))}%`
const duration=seconds=>`${Math.floor(seconds/60)}m ${Math.round(seconds%60)}s`
function GlanceStat({value,label,icon,tone}) {
  const Icon=icon
  return <div className={`${s.glanceStat} ${tone?s[tone]:''}`}><dt><Icon size={tone?14:16} aria-hidden="true"/>{label}</dt><dd>{value}</dd></div>
}
function Observations({items,empty}) {return items.length?<ul className={s.observations}>{items.map((item,i)=><li key={i}><strong>{item.observation}</strong><details><summary>Interpretation & confidence</summary><p><small>Interpretation</small>{item.interpretation}</p><p className={s.confidence}><small>Confidence</small>{item.confidence}</p></details></li>)}</ul>:<p>{empty}</p>}
export default function BootCampDayReport({report:r,commentary,onAsk,dayNumber=1,todayDay=null,todayAvailable=false}) {
  const [tab,setTab]=useState('debrief'),tabRefs=useRef([])
  const d=r.debrief,LABELS=Object.fromEntries(r.blocks.map(b=>[b.key,b.label]))
  return <section className={s.report} aria-label={`Day ${dayNumber} training report`}>
    <header className={`${s.hero} ${s.resultHero}`}><p className={s.eyebrow}>DAY {String(dayNumber).padStart(2,'0')} · COMPLETE</p><h1>Day {dayNumber} results</h1><p>{r.answered} of {r.total} questions attempted · {percent(r.answered?r.accuracy:null)} accuracy · {duration(r.elapsed_seconds)} activity time</p>
    </header>
    <div className={s.tabs} role="tablist" aria-label="Report sections">{['debrief','analytics'].map((name,i)=><button key={name} ref={el=>{tabRefs.current[i]=el}} id={name+'-tab'} role="tab" aria-selected={tab===name} aria-controls={name+'-panel'} tabIndex={tab===name?0:-1} onClick={()=>setTab(name)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?1:1-i;setTab(['debrief','analytics'][n]);tabRefs.current[n]?.focus()}}}>{name}</button>)}</div>
    {tab==='debrief'?<div role="tabpanel" id="debrief-panel" aria-labelledby="debrief-tab"><section className={s.glance} aria-label="Today at a glance"><p className={s.eyebrow}>Performance summary</p>
      <dl className={s.glancePrimary}>{[[r.total,'Questions',ListChecks],[percent(r.answered?r.accuracy:null),'Accuracy',Target],[duration(r.elapsed_seconds),'Activity time',Clock3]].map(([value,label,icon])=><GlanceStat key={label} value={value} label={label} icon={icon}/>)}</dl>
      <dl className={s.glanceBreakdown} aria-label="Question breakdown">{[[r.correct,'Correct',Check,'correct'],[r.incorrect,'Incorrect',X,'incorrect'],[r.skipped,'Skipped',SkipForward,'skipped'],[r.not_reached,'Not reached',ListTodo,'unreached'],...(r.timed_out>0?[[r.timed_out,'Timed out',Timer,'timedOut']]:[])].map(([value,label,icon,tone])=><GlanceStat key={label} value={value} label={label} icon={icon} tone={tone}/>)}</dl>
      {r.timed_out===0 && <dl className={s.glanceZero}><div><dt><Timer size={13} aria-hidden="true"/>Timed out</dt><dd>{r.timed_out}</dd></div></dl>}
      <p className={`${s.note} ${s.glanceNote}`}>Accuracy = correct ÷ attempted. Activity time excludes review and coaching; it is not total wall-clock session time.</p>
</section><div className={s.insightGrid}>
      <section className={`${s.insightCard} ${s.strengths}`}><h2>Strengths</h2><Observations items={d.good} empty="No correct answers were recorded in this session."/></section>
      <section className={`${s.insightCard} ${s.attention}`}><h2>Needs attention</h2><Observations items={d.attention} empty="No incorrect or unanswered responses need attention from this session."/></section>
      <section className={`${s.insightCard} ${s.advice}`}><p className={s.eyebrow}>BIRBAL’S ADVICE</p><p>{commentary?.text || `You attempted ${r.answered} of ${r.total} questions. Use the question evidence below to guide your next practice.`}</p><button className={s.ask} onClick={onAsk}>Ask Birbal <span aria-hidden="true">→</span></button></section>
      <section className={`${s.insightCard} ${s.nextFocus}`}><p className={s.eyebrow}>NEXT FOCUS</p><p>{d.focus}</p></section>
      <details className={`${s.details} ${s.lessons}`}><summary>Question-specific lessons ({d.lessons.length})</summary>{d.lessons.length?d.lessons.map((lesson,i)=><p key={i}><small>{LABELS[lesson.block]} · Q{lesson.number}</small>{lesson.text}</p>):<p>No question-specific lessons were generated for this session.</p>}</details>
      <details className={`${s.details} ${s.watch}`}><summary>What Birbal will watch</summary><p>{d.watch}</p></details>
    </div></div>:<div role="tabpanel" id="analytics-panel" aria-labelledby="analytics-tab"><BootCampReportAnalytics report={r} dayNumber={dayNumber}/></div>}
      <footer className={s.closing}><p className={s.note}>Your Day {dayNumber} report is saved. Choose any open day from the calendar; completed days remain available for review.</p><div className={s.reportActions}>{todayAvailable&&todayDay!==dayNumber&&<Link className={s.reportButton} href={`/boot-camp/day/${todayDay}`}>Go to today’s mission: Day {String(todayDay).padStart(2,'0')} →</Link>}<Link className={s.reportButton} href="/boot-camp/analytics">Overall Analytics</Link><Link className={`${s.reportButton} ${s.secondaryButton}`} href="/boot-camp">Back to Boot Camp</Link></div></footer>
  </section>
}
