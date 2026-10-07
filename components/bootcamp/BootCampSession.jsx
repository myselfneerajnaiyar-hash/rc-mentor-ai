'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { bootcampRequest as request } from '@/lib/bootcamp/client'
import { bootcampPreviewRequest } from '@/lib/bootcamp/preview-client'
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

export default function BootCampSession({ dayRoute = false, reportRoute = false, dayNumber = 1, initialIstDate, preview = false }) {
  const router=useRouter()
  const requestSession = preview ? bootcampPreviewRequest : request
  const [celebrating,setCelebrating]=useState(false)
  const [chat,setChat] = useState(null)
  const [catalog,setCatalog] = useState(null)
  const [session,setSession] = useState(null), [review,setReview] = useState(null)
  const [selectedReviewKey,setSelectedReviewKey] = useState(null)
  const [responseSaveStatus,setResponseSaveStatus] = useState('idle')
  const [busy,setBusy] = useState(true), [error,setError] = useState(null), [retryKey,setRetryKey] = useState(0)
  const latest = useRef(null), working = useRef(false), generation = useRef(0)
  const responseQueue = useRef(new Map()), responseDrain = useRef(null), responseTimer = useRef(null)
  const accept = useCallback(value => { latest.current = value; setSession(value) },[])
  const drainResponses = useCallback(() => {
    if (responseDrain.current) return responseDrain.current
    const operation = (async () => {
      while (responseQueue.current.size) {
        const [questionId, change] = responseQueue.current.entries().next().value
        responseQueue.current.delete(questionId)
        const current = latest.current
        if (!current?.id || current.phase !== 'activity') return false
        try {
          const value = await requestSession(`/attempts/${current.id}/blocks/${current.currentBlock}/responses`, 'PATCH', { ...change, revision: current.revision })
          accept(value)
          setResponseSaveStatus(responseQueue.current.size ? 'saving' : 'saved')
        } catch (error) {
          const newer = responseQueue.current.get(questionId)
          responseQueue.current.set(questionId, { ...change, ...newer, activeMs: Math.max(change.activeMs || 0, newer?.activeMs || 0) })
          if (error.status === 409) {
            try {
              const refreshed = await requestSession(`/attempts/${current.id}`)
              accept(refreshed)
              if (refreshed.phase === 'activity' && refreshed.currentBlock === current.currentBlock) continue
            } catch { /* Retry below with the latest local answer retained. */ }
          }
          setResponseSaveStatus('error')
          if (!responseTimer.current) responseTimer.current = setTimeout(() => { responseTimer.current = null; void drainResponses() }, 1800)
          return false
        }
      }
      return true
    })().finally(() => { responseDrain.current = null })
    responseDrain.current = operation
    return operation
  }, [accept, requestSession])
  const flushResponses = useCallback(async () => {
    clearTimeout(responseTimer.current); responseTimer.current = null
    if (responseDrain.current) await responseDrain.current
    if (responseQueue.current.size) return drainResponses()
    return responseSaveStatus !== 'error'
  }, [drainResponses, responseSaveStatus])
  const queueResponse = useCallback((change, { flush = false } = {}) => {
    const previous = responseQueue.current.get(change.questionId)
    responseQueue.current.set(change.questionId, { ...previous, ...change, activeMs: Math.max(previous?.activeMs || 0, change.activeMs || 0) })
    setResponseSaveStatus('saving')
    clearTimeout(responseTimer.current); responseTimer.current = null
    if (flush) void flushResponses()
    else responseTimer.current = setTimeout(() => { responseTimer.current = null; void drainResponses() }, 400)
    return true
  }, [drainResponses, flushResponses])
  const resolveAttempt = useCallback(async home => {
    const selectedDay = home.days?.find(day => day.day === dayNumber)
    if (dayRoute && !home.attempt && selectedDay?.accessible) {
      if (!preview) await requestSession('/enroll','POST')
      return requestSession(`/days/${dayNumber}/start`,'POST')
    }
    return home.attempt
  },[dayRoute,dayNumber,preview,requestSession])

  useEffect(() => {
    let active = true
    requestSession(dayRoute?`?day=${dayNumber}`:'').then(async home => {
      if (!active) return
      const attempt = await resolveAttempt(home)
      if (active) { setCatalog(home); accept(attempt) }
    }).catch(e => { if (active) setError(e) }).finally(() => { if (active) setBusy(false) })
    const subscription = preview ? null : supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') { generation.current++; setCelebrating(false); accept(null); setReview(null); setChat(null); setError(Object.assign(new Error('Sign in to continue your session.'),{ status:401 })) }
    }).data.subscription
    return () => { active = false; generation.current++; subscription?.unsubscribe() }
  },[accept,dayRoute,dayNumber,preview,requestSession,resolveAttempt])

  useEffect(()=>{
    if(!catalog?.calendar?.today)return
    let active=true
    const refresh=()=>requestSession(dayRoute?`?day=${dayNumber}`:'').then(home=>{if(active){setCatalog(home);setError(null);if(!working.current && (!latest.current || home.attempt?.id!==latest.current.id || home.attempt.revision>=latest.current.revision))accept(home.attempt)}}).catch(e=>{if(active)setError(e)})
    const boundary=Date.parse(catalog.calendar.nextChangeAt)
    const timer=setTimeout(refresh,Math.max(1000,Math.min(86400000,boundary-Date.now()+1000)))
    window.addEventListener('focus',refresh)
    return ()=>{active=false;clearTimeout(timer);window.removeEventListener('focus',refresh)}
  },[catalog?.calendar?.today,dayRoute,dayNumber,accept,requestSession])

  // Reviews are read-only evidence loads. No navigation or coaching mutation runs here.
  useEffect(() => {
    if (!dayRoute || !session?.id || !['review','commentary'].includes(session.phase)) return
    let active = true
    const gen = generation.current
    setSelectedReviewKey(session.currentBlock)
    setReview(null); setError(null)
    requestSession(`/attempts/${session.id}/blocks/${session.currentBlock}/review`)
      .then(value => {
        validateReview(value,session.currentBlock)
        if (active && generation.current === gen) setReview(value)
      })
      .catch(e => { if (active && generation.current === gen) setError(e) })
    return () => { active = false }
  },[session?.id,session?.currentBlock,session?.phase,retryKey,dayRoute,requestSession])

  useEffect(() => () => clearTimeout(responseTimer.current), [])

  useEffect(() => {
    if (!dayRoute || !session?.id || !['mission','report'].includes(session.phase) || session.commentary) return
    let active = true
    const gen = generation.current
    setBusy(true); working.current = true
    requestSession(`/attempts/${session.id}/coach`,'POST')
      .then(value => { if (active && generation.current === gen) accept(value) })
      .catch(e => { if (active && generation.current === gen) setError(e) })
      .finally(() => { if (active) { setBusy(false); working.current = false } })
    return () => { active = false; working.current = false }
  },[session?.id,session?.phase,retryKey,accept,dayRoute,requestSession])

  useEffect(()=>{
    if(preview || !dayRoute || busy || !session) return
    if(session?.phase==='report' && !reportRoute && !celebrating) router.replace(`/boot-camp/day/${dayNumber}/report`)
    else if(reportRoute && session?.phase!=='report' && !error) router.replace(`/boot-camp/day/${dayNumber}`)
  },[preview,dayRoute,reportRoute,session?.phase,busy,error,router,celebrating,dayNumber])

  useEffect(()=>{if(reportRoute&&celebrating)setCelebrating(false)},[reportRoute,celebrating])

  async function run(path,method='POST',body) {
    if (working.current) return false
    const gen = generation.current
    working.current = true; setBusy(true); setError(null)
    try {
      const value = await requestSession(path,method,body)
      if (gen === generation.current) {
        if (method === 'POST' && body?.reviewed && latest.current?.currentBlock === 'va' && value.phase === 'report') setCelebrating(true)
        accept(value)
      }
      return gen === generation.current
    } catch(e) { if (gen === generation.current) setError(e); return false }
    finally { working.current = false; setBusy(false) }
  }
  function mutate(suffix,method='POST',body={}) {
    const current = latest.current
    return run(`/attempts/${current.id}${suffix}`,method,{ ...body,revision:current.revision })
  }
  async function reload() {
    if (preview) { latest.current=null; accept(null); setError(null); setBusy(true); try { const home=await requestSession(dayRoute ? '?day=' + dayNumber : '');setCatalog(home);accept(await resolveAttempt(home)) } catch(e) { setError(e) } finally { setBusy(false) } }
    else if (latest.current) await run(`/attempts/${latest.current.id}`,'GET')
    else { setError(null); setBusy(true); try { const home=await requestSession(dayRoute?`?day=${dayNumber}`:'');setCatalog(home);accept(await resolveAttempt(home)) } catch(e) { setError(e) } finally { setBusy(false) } }
    setRetryKey(k=>k+1)
  }
  async function selectReviewBlock(key) {
    if (!session?.id || !session.progress?.some(block => block.key === key && block.completed)) return
    setSelectedReviewKey(key)
    if (key === review?.key) return
    setReview(null); setError(null)
    try {
      const value = await requestSession(`/attempts/${session.id}/blocks/${key}/review`)
      validateReview(value, key)
      setReview(value)
    } catch (e) { setError(e); setSelectedReviewKey(session.currentBlock) }
  }
  const errorPanel = error && <div className={s.error} role="alert">{error.message}<div className={s.actions}>{error.status === 401 ? <Link className={s.primary} href="/login">Sign in</Link> : <><button className={s.secondary} disabled={busy} onClick={reload}>{preview ? 'Reload preview' : 'Reload saved progress'}</button>{error.status===402?<Link className={s.primary} href="/pricing">View plans</Link>:<Link href={preview ? '/cat-varc-bootcamp' : '/boot-camp'}>{preview ? 'Back to preview' : 'Back to Boot Camp'}</Link>}</>}</div></div>
  const chatPanel = !preview && chat && <BootCampChat key={`${session?.id || 'plan'}:${chat.block || 'day'}:${chat.questionId || 'block'}`} attemptId={session?.id} dayNumber={dayRoute?dayNumber:catalog?.currentDay || 1} block={chat.block} questionId={chat.questionId} open={chat.open} onClose={()=>setChat(c=>c ? {...c,open:false} : null)} />
  if (!dayRoute) return <BootCampShell>{errorPanel}<BootCampArena catalog={catalog} session={session} busy={busy} unavailable={!!error} initialIstDate={initialIstDate} onChat={()=>setChat({open:true})} />{chatPanel}</BootCampShell>
  const selectedDay=catalog?.days?.find(d=>d.day===dayNumber)
  if (!session && busy) return <BootCampShell preview={preview}>{errorPanel}<p className={s.muted} role="status">{preview ? 'Loading preview…' : 'Preparing your session…'}</p></BootCampShell>
  if (!session && !busy && (error || !selectedDay?.accessible)) return <BootCampShell preview={preview}>{errorPanel}{!error&&<section className={s.hero}><h1 className={s.title}>{selectedDay?.unlocked?'This day is being prepared.':'This day is locked.'}</h1><p className={s.lead}>{selectedDay?.unlocked?'Please check back soon.':`Day ${dayNumber} opens on ${selectedDay?.releaseDate || 'its calendar date'}.`}</p><Link href="/boot-camp">Back to Boot Camp</Link></section>}</BootCampShell>
  if (!session) return <BootCampShell preview={preview}>{errorPanel}<p className={s.muted} role="status">{preview ? 'Loading preview…' : 'Preparing your session…'}</p></BootCampShell>
  const reviewWorkspace= ['review','commentary'].includes(session.phase)
  return <BootCampShell preview={preview} session={session} reviewWorkspace={reviewWorkspace || session.phase==='report'}>{errorPanel}{chatPanel}
    {session.phase === 'mission' && <BootCampMission preview={preview} dayNumber={dayNumber} commentary={session.commentary} busy={busy} onContinue={()=>mutate('/advance')} />}
    {session.phase === 'ready' && <BootCampMission ready blockLabel={session.blockLabel} seconds={session.seconds} busy={busy} onContinue={()=>mutate(`/blocks/${session.currentBlock}/start`)} />}
    {session.phase === 'activity' && <BootCampActivity preview={preview} dayNumber={dayNumber} key={`${session.id}:${session.currentBlock}`} activity={session.activity} serverNow={session.serverNow} busy={busy} saveStatus={responseSaveStatus} onSave={queueResponse} flushResponses={flushResponses} onFinish={body=>mutate(`/blocks/${session.currentBlock}/finish`,'POST',body)} onExpire={async questionId=>{if(await flushResponses())return run(`/attempts/${session.id}?presentedQuestionId=${encodeURIComponent(questionId)}`,'GET');return false}} />}
    {reviewWorkspace && (review?.key === selectedReviewKey ? <BootCampReviewBoundary key={`${session.id}:${session.currentBlock}:${retryKey}`} attemptId={session.id} block={session.currentBlock} onRetry={reload}><BootCampReviewWorkspace preview={preview} dayNumber={dayNumber} key={`${session.id}:${session.currentBlock}`} attemptId={session.id} review={review} phase={session.phase} commentary={review.commentary || session.commentary} busy={busy} canContinue={review.key === session.currentBlock} reviewBlocks={(session.progress || []).filter(block=>block.completed)} onSelectBlock={selectReviewBlock} onContinue={()=>mutate('/advance','POST',{reviewed:true})} onAsk={questionId=>setChat({open:true,block:review.key,questionId})}/></BootCampReviewBoundary> : !error && <p role="status">Preparing your detailed review...</p>)}
    {session.phase === 'report' && celebrating && !reportRoute && <BootCampCompletion day={dayNumber} onContinue={()=>preview ? setCelebrating(false) : router.replace(`/boot-camp/day/${dayNumber}/report`)}/>}
    {session.phase === 'report' && (!celebrating || reportRoute) && <BootCampDayReport preview={preview} dayNumber={dayNumber} todayDay={catalog?.calendar?.todayDay} todayAvailable={!!catalog?.days?.find(d=>d.isToday)?.accessible} report={session.report} commentary={session.commentary} onAsk={()=>setChat({open:true})} />}
  </BootCampShell>
}
