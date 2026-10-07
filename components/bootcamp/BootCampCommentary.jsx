import BirbalMessage from '@/components/BirbalMessage'
import s from './bootcamp.module.css'
import { reviewObservation } from '@/lib/bootcamp/review.mjs'
export default function BootCampCommentary({ commentary, onContinue, busy, block, review, onAsk }) {
  const evidence = reviewObservation(review)
  return <section className={s.hero}><div className={s.coachHeader}><img src="/birbal.png" alt="Birbal" className={s.avatar} /><span>A moment with your trainer</span></div>
    <h1 className={s.title}>{commentary?.title || 'Let’s look at what you learned.'}</h1>
    {evidence && <dl className={s.analysisBody}>{[["What you chose",evidence.observation],["Why it fails",evidence.interpretation],...(evidence.tempting?[["Why it looked tempting",evidence.tempting]]:[]),...(evidence.trap?[["Trap",evidence.trap]]:[]),...(evidence.takeForward?[["What to notice next time",evidence.takeForward]]:[])].map(([label,value])=><div key={label} className={s.detail}><dt className={s.eyebrow}>{label}</dt><dd>{value}</dd></div>)}</dl>}
    {commentary ? <><BirbalMessage text={commentary.text} /><div className={s.focus}><p className={s.eyebrow}>Take this forward</p><p>{commentary.focus}</p></div></> : <p role="status" className={s.lead}>Birbal is looking at your saved performance…</p>}
    <div className={s.actions}><button className={s.secondary} onClick={onAsk}>Ask Birbal</button><button className={s.primary} disabled={busy || !commentary} onClick={onContinue}>{{warmup:'Continue to RC 1',rc1:'Continue to RC 2',rc2:'Continue to RC 3',rc3:'Continue to Verbal Ability',va:"See Today's Debrief"}[block]} <span aria-hidden="true">→</span></button></div>
  </section>
}
