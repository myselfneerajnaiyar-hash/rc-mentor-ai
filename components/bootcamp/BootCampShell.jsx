'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import s from './bootcamp.module.css'
export default function BootCampShell({ session, children, reviewWorkspace = false }) {
  useEffect(() => {
    const elements = [document.documentElement, document.body]
    const previous = elements.map(element => ({ height: element.style.height, background: element.style.background }))
    elements.forEach(element => { element.style.height = 'auto'; element.style.background = '#0b121c' })
    return () => elements.forEach((element, i) => { element.style.height = previous[i].height; element.style.background = previous[i].background })
  }, [])
  useEffect(() => { window.scrollTo(0,0); document.body.scrollTo(0,0) }, [session?.phase,session?.currentBlock])
  return <main className={`${s.root} ${reviewWorkspace ? s.reviewRoot : ''}`}><header className={s.top}><div className={s.brand}><img className={s.avatar} src="/birbal.png" alt="" /><span>Auctor / Boot Camp</span></div><Link href="/">Back to Home</Link></header><div className={s.container}>
    {session && <ol className={s.steps} aria-label={`Day ${session.dayNumber} progress`}>{session.progress.map(b => <li key={b.key} aria-current={session.phase !== 'report' && session.currentBlock === b.key ? 'step' : undefined} className={`${s.step} ${session.phase !== 'report' && session.currentBlock === b.key ? s.current : b.completed ? s.complete : ''}`}>{b.completed ? '✓ ' : ''}{b.label}</li>)}</ol>}
    {children}</div></main>
}
