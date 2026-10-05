'use client'
import { useEffect, useState } from 'react'
import { bootcampRequest } from '@/lib/bootcamp/client'
import s from './leaderboard.module.css'

export default function BootCampLeaderboard() {
  const [mode,setMode]=useState('daily')
  const [data,setData]=useState(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [expanded,setExpanded]=useState(false)
  useEffect(()=>{
    let active=true
    setLoading(true);setError('');setData(null)
    bootcampRequest(`/leaderboard?mode=${mode}`).then(value=>{if(active)setData(value)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[mode])
  const dateLabel=data?mode==='daily'?data.window.startDate:`${data.window.startDate} - ${data.window.endDate}`:''
  const hasWorkout=!!data?.current.workouts
  return <article className={`${s.card} ${s.compete}`}>
    <div className={s.top}><span className={s.index}>04</span><span className={s.kicker}>COMPETE</span><div className={s.toggle} role="tablist" aria-label="Leaderboard period">{['daily','weekly'].map(value=><button key={value} type="button" role="tab" aria-selected={mode===value} onClick={()=>{setMode(value);setExpanded(false)}}>{value==='daily'?'Daily':'Weekly'}</button>)}</div></div>
    <h3>Put today’s work on the board.</h3>
    <p className={s.subhead}>{data?`${mode==='daily'?'Daily board':'Week of'} ${dateLabel} · IST`:`${mode==='daily'?'Daily':'Weekly'} leaderboard · IST`}</p>
    {loading?<p className={s.message} role="status">Checking your position...</p>:error?<p className={s.message} role="alert">{error}</p>:<div className={s.preview}>
      {hasWorkout?<><div><span className={s.previewLabel}>YOUR POSITION</span><strong className={s.rank}>{data.current.rank?`#${data.current.rank}`:'—'}</strong></div><div className={s.score}><strong>{data.current.score}</strong><span>correct</span></div><div className={s.workouts}><strong>{data.current.workouts}</strong><span>eligible {data.current.workouts===1?'workout':'workouts'}</span></div></>:<div className={s.notEntered}><span className={s.dot}/><span>{mode==='daily'?"Complete today’s workout to enter.":'Complete an on-time workout to enter this week’s board.'}</span></div>}
    </div>}
    <button className={s.cta} type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Hide Leaderboard':'View Leaderboard'}<span aria-hidden="true">{expanded?'↑':'→'}</span></button>
    {expanded&&!loading&&!error&&data&&<div className={s.details}>
      <p className={s.rule}>A workout counts only when all five activities are completed before midnight IST on its scheduled date. Late catch-up stays in your learning progress, but does not enter the board.</p>
      {data.entries.length?<div className={s.tableWrap}><table><thead><tr><th>Rank</th><th>Student</th><th>Correct</th><th>Workouts</th></tr></thead><tbody>{data.entries.map((row,i)=><tr key={`${row.rank}-${i}`} className={row.isCurrentUser?s.mine:''}><td>{row.rank}</td><td>{row.name}{row.isCurrentUser?' (you)':''}</td><td>{row.score}</td><td>{row.workouts}</td></tr>)}</tbody></table></div>:<p className={s.message}>No eligible completed workouts for this period yet.</p>}
      {data.current.rank&&!data.entries.some(row=>row.isCurrentUser)&&<p className={s.ownPosition}>Your position: <strong>#{data.current.rank}</strong> · {data.current.score} correct · {data.current.workouts} eligible workouts</p>}
      <p className={s.foot}>Equal scores share a rank. Workout count is context only.</p>
    </div>}
  </article>
}
