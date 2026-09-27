import s from './bootcamp.module.css'
export default function BootCampMission({ commentary, onContinue, busy, ready, blockLabel, seconds, dayNumber = 1 }) {
  return <section className={s.hero}><p className={s.eyebrow}>{ready ? 'Your next activity' : `Day ${String(dayNumber).padStart(2,'0')} / Today’s mission`}</p>
    <h1 className={s.title}>{ready ? `Let’s begin ${blockLabel}.` : commentary?.title || 'A little more clarity. One question at a time.'}</h1>
    <p className={s.lead}>{ready ? (seconds ? `You have ${seconds / 60} minutes. Your timer starts when you’re ready. We’ll review your reasoning together afterward.` : 'Five short questions to bring your reasoning into focus. There’s no countdown here; take the time you need.') : commentary?.text || 'Birbal is preparing your session.'}</p>
    {!ready && commentary?.briefing && <div className={s.briefing}>{[["What I've noticed",'noticed'],["What's changed",'changed'],["Today I'm watching",'watching'],["Today's workout",'workout']].map(([label,key])=><section key={key}><h2 className={s.eyebrow}>{label}</h2><ul>{commentary.briefing[key].map((text,i)=><li key={i}>{text}</li>)}</ul></section>)}</div>}
    {!ready && commentary?.focus && <div className={s.focus}><span className={s.eyebrow}>Today's mission</span><p>{commentary.focus}</p></div>}
    <div className={s.actions}><button className={s.primary} disabled={busy || (!ready && !commentary)} onClick={onContinue}>{busy ? 'Preparing…' : ready ? `Start ${blockLabel}` : 'Begin my warm-up'} <span aria-hidden="true">→</span></button></div>
    {ready && seconds && <p className={s.muted}>The clock continues if you refresh or leave. Saved answers stay with you.</p>}
  </section>
}
