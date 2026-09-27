'use client'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import s from './completion.module.css'
export default function BootCampCompletion({day=1,onContinue}) {
  const reduced = useReducedMotion()
  const number = String(day).padStart(2,'0')
  const entrance = delay => ({initial:{opacity:0,y:reduced?0:12},animate:{opacity:1,y:0},transition:{duration:reduced ? .2 : .5,delay:reduced?0:delay}})
  return <section className={s.complete} aria-label="Training complete">
    <div className={s.particles} aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i}}/>)}</div>
    <Motion.div className={s.portrait} initial={{opacity:0,scale:reduced?1:.55}} animate={{opacity:1,scale:1}} transition={reduced?{duration:.2}:{type:'spring',stiffness:180,damping:13,mass:1.1}}><img src="/Birbal avatar.jpeg" alt="Birbal, your trainer"/></Motion.div>
    <Motion.p className={s.eyebrow} {...entrance(.35)}>TRAINING DAY COMPLETE</Motion.p>
    <Motion.h1 {...entrance(.55)}>DAY {number} COMPLETE</Motion.h1>
    <Motion.p className={s.lead} {...entrance(.8)}>You put in the work.<br/>Now let's see what the work revealed.</Motion.p>
    <Motion.button {...entrance(1.9)} onClick={onContinue}>See my Day {number} report <span aria-hidden="true">&rarr;</span></Motion.button>
  </section>
}
