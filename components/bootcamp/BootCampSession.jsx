'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { bootcampRequest as request } from '@/lib/bootcamp/client'
import BootCampShell from './BootCampShell'
import BootCampArena from './BootCampArena'
import BootCampChat from './BootCampChat'
import BootCampMission from './BootCampMission'
import BootCampActivity from './BootCampActivity'
import BootCampReviewWorkspace from './BootCampReviewWorkspace'
import BootCampCompletion from './BootCampCompletion'
import BootCampReviewBoundary from './BootCampReviewBoundary'
import { validateReview } from '@/lib/bootcamp/review.mjs'
import BootCampDayReport from './BootCampDayReport'
import s from './bootcamp.module.css'

export default function BootCampSession({ dayRoute = false, reportRoute = false, dayNumber = 1 }) {
  const router=useRouter()
  const [celebrating,setCelebrating]=useState(false)
  const [chat,setChat] = useState(null)
  const [catalog,setCatalog] = useState(null)
  const [session,setSession] = useState(null), [review,setReview] = useState(null)
  const [busy,setBusy] = useState(true), [error,setError] = useState(null), [retryKey,setRetryKey] = useState(0)
  const latest = useRef(null), working = useRef(false), generation = useRef(0)
  const accept = useCallback(value => { latest.current = value; setSession(value) },[])

  useEffect(() => {
    let active = true
    request(dayRoute?`?day=${dayNumber}`:'').then(home => { if (active) { setCatalog(home); accept(home.attempt) } }).catch(e => { if (active) setError(e) }).finally(() => { if (active) setBusy(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') { generation.current++; setCelebrating(false); accept(null); setReview(null); setChat(null); setError(Object.assign(new Error('Sign in to continue your session.'),{ status:401 })) }
    })
    return () => { active = false; generation.current++; subscription.unsubscribe() }
  },[accept,dayRoute,dayNumber])

  useEffect(()=>{
    if(!catalog?.calendar?.today)return
    let active=true
    const refresh=()=>request(dayRoute?`?day=${dayNumber}`:'').then(home=>{if(active){setCatalog(home);setError(null);if(!working.current && (!latest.current || home.attempt?.id!==latest.current.id || home.attempt.revision>=latest.current.revision))accept(home.attempt)}}).catch(e=>{if(active)setError(e)})
    const boundary=Date.parse(catalog.calendar.nextChangeAt)
    const timer=setTimeout(refresh,Math.max(1000,Math.min(86400000,boundary-Date.now()+1000)))
    window.addEventListener('focus',refresh)
    return ()=>{active=false;clearTimeout(timer);window.removeEventListener('focus',refresh)}
  },[catalog?.calendar?.today,dayRoute,dayNumber,accept])

  // Reviews are read-only evidence loads. No navigation or coaching mutation runs here.
  useEffect(() => {
    if (!dayRoute || !session?.id || !['review','commentary'].includes(session.phase)) return
    let active = true
    const gen = generation.current
    setReview(null); setError(null)
    request(`/attempts/${session.id}/blocks/${session.currentBlock}/review`)
      .then(value => {
        validateReview(value,session.currentBlock)
        if (active && generation.current === gen) setReview(value)
      })
      .catch(e => { if (active && generation.current === gen) setError(e) })
    return () => { active = false }
  },[session?.id,session?.currentBlock,session?.phase,retryKey,dayRoute])

  useEffect(() => {
    if (!dayRoute || !session?.id || !['mission','report'].includes(session.phase) || session.commentary) return
    let active = true
    const gen = generation.current
    setBusy(true); working.current = true
    request(`/attempts/${session.id}/coach`,'POST')
      .then(value => { if (active && generation.current === gen) accept(value) })
      .catch(e => { if (active && generation.current === gen) setError(e) })
      .finally(() => { if (active) { setBusy(false); working.current = false } })
    return () => { active = false; working.current = false }
  },[session?.id,session?.phase,retryKey,accept,dayRoute])

  useEffect(()=>{
    if(!dayRoute || busy) return
    if(session?.phase==='report' && !reportRoute && !celebrating) router.replace(`/boot-camp/day/${dayNumber}/report`)
    else if(reportRoute && session?.phase!=='report' && !error) router.replace(`/boot-camp/day/${dayNumber}`)
  },[dayRoute,reportRoute,session?.phase,busy,error,router,celebrating,dayNumber])

  async function run(path,method='POST',body) {
    if (working.current) return false
    const gen = generation.current
    working.current = true; setBusy(true); setError(null)
    try {
      const value = await request(path,method,body)
      if (gen === generation.current) {
        if (method === 'POST' && body?.reviewed && latest.current?.currentBlock === 'va' && value.phase === 'report') setCelebrating(true)
        accept(value)
      }
      return gen === generation.current
    } catch(e) { if (gen === generation.current) setError(e); return false }
    finally { working.current = false; setBusy(false) }
  }
  async function start() {
    if (working.current) return
    working.current = true; setBusy(true); setError(null)
    try { await request('/enroll','POST'); accept(await request(`/days/${dayNumber}/start`,'POST')) }
    catch(e) { setError(e) } finally { working.current = false; setBusy(false) }
  }
  function mutate(suffix,method='POST',body={}) {
    const current = latest.current
    return run(`/attempts/${current.id}${suffix}`,method,{ ...body,revision:current.revision })
  }
  async function reload() {
    if (latest.current) await run(`/attempts/${latest.current.id}`,'GET')
    else { setError(null); setBusy(true); try { const home=await request(dayRoute?`?day=${dayNumber}`:'');setCatalog(home);accept(home.attempt) } catch(e) { setError(e) } finally { setBusy(false) } }
    setRetryKey(k=>k+1)
  }
  const errorPanel = error && <div className={s.error} role="alert">{error.message}<div className={s.actions}>{error.status === 401 ? <Link className={s.primary} href="/login">Sign in</Link> : <><button className={s.secondary} disabled={busy} onClick={reload}>Reload saved progress</button>{error.status===402?<Link className={s.primary} href="/pricing">View plans</Link>:<Link href="/boot-camp">Back to Boot Camp</Link>}</>}</div></div>
  const chatPanel = chat && <BootCampChat key={`${session?.id || 'plan'}:${chat.block || 'day'}:${chat.questionId || 'block'}`} attemptId={session?.id} dayNumber={dayRoute?dayNumber:catalog?.currentDay || 1} block={chat.block} questionId={chat.questionId} open={chat.open} onClose={()=>setChat(c=>c ? {...c,open:false} : null)} />
  if (!dayRoute) return <BootCampShell>{errorPanel}<BootCampArena catalog={catalog} session={session} busy={busy} unavailable={!!error} onChat={()=>setChat({open:true})} />{chatPanel}</BootCampShell>
  const selectedDay=catalog?.days?.find(d=>d.day===dayNumber)
  if (!session && !busy && (error || !selectedDay?.accessible)) return <BootCampShell>{errorPanel}{!error&&<section className={s.hero}><h1 className={s.title}>{selectedDay?.unlocked?'This day is being prepared.':'This day is locked.'}</h1><p className={s.lead}>{selectedDay?.unlocked?'Please check back soon.':`Day ${dayNumber} opens on ${selectedDay?.releaseDate || 'its calendar date'}.`}</p><Link href="/boot-camp">Back to Boot Camp</Link></section>}</BootCampShell>
  if (!session) return <BootCampShell>{errorPanel}<section className={s.hero}><p className={s.eyebrow}>Boot Camp / Day {String(dayNumber).padStart(2,'0')}</p><h1 className={s.title}>Your training is ready.<br />Let’s sharpen your reading.</h1><p className={s.lead}>Birbal has Day {dayNumber} ready for you. A focused warm-up, three passages, and verbal reasoning—with a personal check-in after every block.</p>
    <div className={s.facts}><div className={s.fact}><strong>25 questions</strong><span>A carefully planned session</span></div><div className={s.fact}><strong>5 activities</strong><span>One step at a time</span></div><div className={s.fact}><strong>With Birbal</strong><span>Review, reflect, improve</span></div></div>
    <div className={s.actions}><button className={s.primary} disabled={busy || !!error} onClick={start}>{busy ? 'Preparing your session…' : 'Start today’s session →'}</button></div><p className={s.muted}>29 minutes of timed practice, plus your warm-up, reviews and coaching. Come back to your saved place whenever you need.</p></section></BootCampShell>
  const reviewWorkspace= ['review','commentary'].includes(session.phase)
  return <BootCampShell session={session} reviewWorkspace={reviewWorkspace || session.phase==='report'}>{errorPanel}{chatPanel}
    {session.phase === 'mission' && <BootCampMission dayNumber={dayNumber} commentary={session.commentary} busy={busy} onContinue={()=>mutate('/advance')} />}
    {session.phase === 'ready' && <BootCampMission ready blockLabel={session.blockLabel} seconds={session.seconds} busy={busy} onContinue={()=>mutate(`/blocks/${session.currentBlock}/start`)} />}
    {session.phase === 'activity' && <BootCampActivity dayNumber={dayNumber} key={`${session.id}:${session.currentBlock}`} activity={session.activity} serverNow={session.serverNow} busy={busy} onSave={body=>mutate(`/blocks/${session.currentBlock}/responses`,'PATCH',body)} onFinish={()=>mutate(`/blocks/${session.currentBlock}/finish`)} onExpire={()=>run(`/attempts/${session.id}`,'GET')} />}
    {reviewWorkspace && (review?.key === session.currentBlock ? <BootCampReviewBoundary key={`${session.id}:${session.currentBlock}:${retryKey}`} attemptId={session.id} block={session.currentBlock} onRetry={reload}><BootCampReviewWorkspace dayNumber={dayNumber} key={`${session.id}:${session.currentBlock}`} attemptId={session.id} review={review} phase={session.phase} commentary={review.commentary || session.commentary} busy={busy} onContinue={()=>mutate('/advance','POST',{reviewed:true})} onAsk={questionId=>setChat({open:true,block:session.currentBlock,questionId})}/></BootCampReviewBoundary> : !error && <p role="status">Preparing your detailed review...</p>)}
    {session.phase === 'report' && celebrating && <BootCampCompletion day={dayNumber} onContinue={()=>{setCelebrating(false);router.replace(`/boot-camp/day/${dayNumber}/report`)}}/>}
    {session.phase === 'report' && !celebrating && <BootCampDayReport dayNumber={dayNumber} todayDay={catalog?.calendar?.todayDay} todayAvailable={!!catalog?.days?.find(d=>d.isToday)?.accessible} report={session.report} commentary={session.commentary} onAsk={()=>setChat({open:true})} />}
  </BootCampShell>
}
