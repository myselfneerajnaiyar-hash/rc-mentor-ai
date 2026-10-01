'use client'
import { useEffect, useRef, useState } from 'react'
import NumberedSentences from './NumberedSentences'
import BootCampRCActivity from './BootCampRCActivity'
import s from './bootcamp.module.css'

export default function BootCampActivity({ dayNumber=1, activity, serverNow, busy, onSave, onFinish, onExpire }) {
  const [index, setIndex] = useState(activity.current_question)
  const [remaining, setRemaining] = useState(null)
  const [draft, setDraft] = useState(undefined)
  const [saveError, setSaveError] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const visibleMs = useRef(0), clock = useRef(Date.now()), expiredSent = useRef(false)
  const questionElement = useRef(null), questionVisible = useRef(false), previousIndex = useRef(0)
  const q = activity.questions[index], saved = activity.responses[index]
  const value = draft === undefined ? saved.response : draft
  const busyRef = useRef(busy); busyRef.current = busy
  const ops = useRef({ onSave, onExpire }); ops.current = { onSave, onExpire }
  const timing = () => saved.active_ms + visibleMs.current

  useEffect(() => {
    const offset = Date.parse(serverNow) - Date.now()
    function tick() {
      if (!activity.deadline_at) return
      const seconds = Math.max(0, Math.ceil((Date.parse(activity.deadline_at) - Date.now() - offset) / 1000))
      setRemaining(seconds)
      if (!seconds && !busyRef.current && !expiredSent.current) {
        expiredSent.current = true
        Promise.resolve(ops.current.onExpire(q.id)).finally(() => { expiredSent.current = false })
      }
    }
    tick(); const timer = setInterval(tick, 500)
    return () => clearInterval(timer)
  }, [activity.deadline_at, serverNow, q.id])

  useEffect(() => {
    visibleMs.current = 0; clock.current = Date.now()
    const timer = setInterval(() => {
      const now = Date.now()
      if (document.visibilityState === 'visible' && questionVisible.current) visibleMs.current += Math.min(now - clock.current, 1500)
      clock.current = now
    }, 1000)
    return () => clearInterval(timer)
  }, [index])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => { questionVisible.current = entries[0].isIntersecting })
    if(questionElement.current)observer.observe(questionElement.current)
    return ()=>observer.disconnect()
  },[q.id])

  useEffect(() => {
    if (index !== previousIndex.current) questionElement.current?.scrollIntoView({ block: 'center' })
    previousIndex.current = index
  }, [index])

  useEffect(() => {
    const flush = async () => {
      if (busyRef.current || draft !== undefined || visibleMs.current === 0) return
      const sample = visibleMs.current
      const ok = await ops.current.onSave({ questionId: q.id, presented: true, activeMs: saved.active_ms + sample })
      if (ok) visibleMs.current = Math.max(0, visibleMs.current - sample)
    }
    const onHidden = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [q.id, saved.active_ms, draft])

  useEffect(() => {
    if (draft === undefined) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [draft])

  async function save(response) {
    setDraft(response); setSaveError(false)
    const ok = await onSave({ questionId: q.id, presented: true, response, activeMs: timing() })
    if (ok) { visibleMs.current = 0; setDraft(undefined) } else setSaveError(true)
  }
  async function move(next) {
    if (draft !== undefined || saveError) return
    if (!await onSave({ questionId: q.id, presented: true, activeMs: timing(), nextQuestionId: activity.questions[next]?.id })) return
    visibleMs.current = 0; setConfirmFinish(false); setIndex(next)
  }
  async function finish() {
    const activeMs=timing()
    if(await onFinish({ questionId: q.id, activeMs }))visibleMs.current = 0
  }
  const disabled = busy || remaining === 0
  const answered = activity.responses.filter(r => r.response !== null).length
  const content = <section className={s.panel}>
    <p className={s.eyebrow}>Question {index + 1} of {activity.questions.length} · {q.type}</p>
    {q.context && <div className={s.context}>{q.context}</div>}
    {q.sentenceToPlace && <div className={s.focus}><p className={s.eyebrow}>Sentence to place</p><p>{q.sentenceToPlace}</p></div>}
    <h2 ref={questionElement} className={s.question}>{q.text}</h2>
    {q.sentences.length > 0 && <NumberedSentences sentences={q.sentences}/>}
    {q.mode === 'MCQ' ? <div className={s.options} role="group" aria-label="Answer options">{q.options.map(o => <button key={o.id} disabled={disabled} aria-pressed={value === o.id} className={`${s.option} ${value === o.id ? s.selected : ''}`} onClick={() => save(o.id)}><span className={s.letter}>{o.id}</span><span>{o.text}</span></button>)}</div>
      : q.type === 'Para Jumble' ? <div><p className={s.muted}>Tap sentence numbers in your chosen order. Tap Undo to revise.</p><div className={s.order} aria-label="Your sentence order">{Array.isArray(value) && value.length ? value.join(' → ') : 'Your order will appear here'}</div><div className={s.numbers}>{q.sentences.map(sentence => <button key={sentence.number} className={s.number} disabled={disabled || value?.includes(sentence.number)} onClick={() => save([...(value || []),sentence.number])}>{sentence.number}</button>)}<button className={s.secondary} disabled={disabled || !value?.length} onClick={() => save(value.length > 1 ? value.slice(0,-1) : null)}>Undo</button></div></div>
      : <div><p className={s.muted}>{q.type === 'Sentence Placement' ? 'Choose the displayed insertion position. Position 4 means [4] in the paragraph.' : 'Choose the sentence that does not belong.'}</p><div className={s.numbers} role="group" aria-label="Choose position">{Array.from({ length: q.type === 'Sentence Placement' ? 4 : 5 },(_,i) => i + 1).map(n => <button key={n} disabled={disabled} className={s.number} aria-pressed={value === n} onClick={() => save(n)}>{q.type === 'Sentence Placement' ? `[${n}]` : n}</button>)}</div></div>}
    <div className={s.status} role="status">{busy ? 'Saving your progress…' : saveError ? 'This answer has not saved yet.' : saved.response !== null ? 'Answer saved' : 'You can leave this question unanswered.'}</div>
    {saveError && <button className={s.primary} disabled={busy} onClick={() => save(draft)}>Retry saving answer</button>}
    <div className={s.questionNav}><button className={s.secondary} disabled={disabled || index === 0 || draft !== undefined} onClick={() => move(index - 1)}>← Previous</button>
      {value !== null && <button className={s.secondary} disabled={disabled} onClick={() => save(null)}>Clear answer</button>}
      {index < activity.questions.length - 1 ? <button className={s.primary} disabled={disabled || draft !== undefined} onClick={() => move(index + 1)}>Next question →</button> : <button className={s.primary} disabled={disabled || draft !== undefined} onClick={() => setConfirmFinish(true)}>Finish {activity.label}</button>}
    </div>
    {!confirmFinish && index < activity.questions.length - 1 && <div className={s.actions}><button className={s.secondary} disabled={disabled || draft !== undefined} onClick={() => setConfirmFinish(true)}>Finish this block early</button></div>}
    {confirmFinish && <div className={s.focus}><p>{answered} of {activity.questions.length} questions answered. Once you finish, your answers are final and we’ll review them together.</p><div className={s.actions}><button className={s.primary} disabled={disabled} onClick={finish}>Finish and review</button><button className={s.secondary} disabled={busy} onClick={() => setConfirmFinish(false)}>Keep working</button></div></div>}
  </section>
  return <><header className={s.activityHeader}><div><p className={s.eyebrow}>Day {String(dayNumber).padStart(2,'0')} / In training</p><h1>{activity.label}</h1></div><div className={`${s.timer} ${remaining !== null && remaining < 60 ? s.urgent : ''}`} role="timer" aria-label="Time remaining">{remaining === null ? 'At your pace' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2,'0')}`}<small>{activity.deadline_at ? 'Time remaining' : 'Untimed warm-up'}</small></div></header>
    {activity.passage ? <BootCampRCActivity passage={activity.passage}>{content}</BootCampRCActivity> : <div style={{ maxWidth: 820, margin: 'auto' }}>{content}</div>}</>
}
