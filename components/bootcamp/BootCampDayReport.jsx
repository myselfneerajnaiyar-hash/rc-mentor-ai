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
    <header className={s.hero}><p className={s.eyebrow}>Day {String(dayNumber).padStart(2,'0')} · Complete</p><h1>Here's what today's training revealed.</h1><p>You practised, reviewed, and paused to reflect. All five blocks complete. Take the learning forward.</p>
    </header>
    <div className={s.tabs} role="tablist" aria-label="Report sections">{['debrief','analytics'].map((name,i)=><button key={name} ref={el=>{tabRefs.current[i]=el}} id={name+'-tab'} role="tab" aria-selected={tab===name} aria-controls={name+'-panel'} tabIndex={tab===name?0:-1} onClick={()=>setTab(name)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?1:1-i;setTab(['debrief','analytics'][n]);tabRefs.current[n]?.focus()}}}>{name}</button>)}</div>
    {tab==='debrief'?<div role="tabpanel" id="debrief-panel" aria-labelledby="debrief-tab"><section className={s.glance} aria-label="Today at a glance"><p className={s.eyebrow}>Today at a glance</p>
      <dl className={s.glancePrimary}>{[[r.total,'Questions',ListChecks],[percent(r.answered?r.accuracy:null),'Accuracy',Target],[duration(r.elapsed_seconds),'Activity time',Clock3]].map(([value,label,icon])=><GlanceStat key={label} value={value} label={label} icon={icon}/>)}</dl>
      <dl className={s.glanceBreakdown} aria-label="Question breakdown">{[[r.correct,'Correct',Check,'correct'],[r.incorrect,'Incorrect',X,'incorrect'],[r.skipped,'Skipped',SkipForward,'skipped'],[r.not_reached,'Not reached',ListTodo,'unreached'],...(r.timed_out>0?[[r.timed_out,'Timed out',Timer,'timedOut']]:[])].map(([value,label,icon,tone])=><GlanceStat key={label} value={value} label={label} icon={icon} tone={tone}/>)}</dl>
      {r.timed_out===0 && <dl className={s.glanceZero}><div><dt><Timer size={13} aria-hidden="true"/>Timed out</dt><dd>{r.timed_out}</dd></div></dl>}
      <p className={`${s.note} ${s.glanceNote}`}>Accuracy = correct ÷ attempted. Activity time excludes review and coaching; it is not total wall-clock session time.</p>
</section><div className={s.layout}><div className={s.main}>
      <section className={s.section}><p className={s.eyebrow}>Birbal’s read on today</p><h2>From answers to understanding.</h2><p>{commentary?.text || `You answered ${r.answered} of ${r.total} questions, with ${r.correct} correct. Today gives us specific responses to learn from, not a fixed assessment of your ability.`}</p>
        <div className={s.observationColumns}><div><h3>What you did well</h3><Observations items={d.good} empty="No correct answers were recorded today. We’ll start with one piece of supported reasoning at a time."/></div><div><h3>What needs attention</h3><Observations items={d.attention} empty="No incorrect or unanswered questions were recorded. There is no need to invent a weakness from today’s results."/></div></div>
        <div className={s.lesson}><h3>Today’s lesson</h3>{d.lessons.length?d.lessons.map((lesson,i)=><p key={i}><small>{LABELS[lesson.block]} · Q{lesson.number}</small>{lesson.text}</p>):<p>Start with one question and compare each possible answer with the supplied evidence.</p>}</div>
        <details className={s.details}><summary>What I’ll watch</summary><p>{d.watch}</p></details>
      </section>
      <section className={s.focus}><p className={s.eyebrow}>Tomorrow’s focus</p><h2>A direction, not a diagnosis.</h2><p>{d.focus}</p></section>

    </div><aside className={s.trainer} aria-label="Birbal day trainer"><header><img src="/Birbal avatar.jpeg" alt="Birbal"/><div><strong>BIRBAL</strong><span>Your VARC trainer</span></div></header><h2>The whole day matters.</h2><p>Ask me about a particular answer, compare your RC blocks, or talk through what to practise next.</p><p className={s.confidence}>{d.watch}</p><button className={s.ask} onClick={onAsk}>Ask Birbal <span aria-hidden="true">→</span></button><small>Warm-up · RC 1 · RC 2 · RC 3 · VA<br/>Grounded in your saved Day {dayNumber} responses.</small></aside></div></div>:<div role="tabpanel" id="analytics-panel" aria-labelledby="analytics-tab"><BootCampReportAnalytics report={r} dayNumber={dayNumber}/></div>}
      <footer className={s.closing}><p className={s.eyebrow}>Day {String(dayNumber).padStart(2,'0')} complete</p><h2>One day down. The training continues.</h2><div>{todayAvailable&&todayDay!==dayNumber&&<Link href={`/boot-camp/day/${todayDay}`}>Go to today's mission: Day {String(todayDay).padStart(2,'0')} &rarr;</Link>}<Link href="/boot-camp/analytics">Overall analytics &rarr;</Link><Link href="/boot-camp">Back to Boot Camp →</Link></div><p className={s.note}>Your Day {dayNumber} report is saved. Choose any open day from the calendar. Completed days remain available for review.</p></footer>
  </section>
}
