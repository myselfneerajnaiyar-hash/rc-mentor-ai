'use client'

import { useEffect, useState } from 'react'
import s from './page.module.css'
import BootcampAccessCTA from '@/components/bootcamp/BootcampAccessCTA'

export default function StickyStartCTA({ href, daysLeft }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('bc26-hero')
    const final = document.getElementById('final-cta')
    if (!hero || !final) return
    let pastHero = false
    let nearFinal = false
    const update = () => setVisible(pastHero && !nearFinal)
    const heroObserver = new IntersectionObserver(([entry]) => { pastHero = !entry.isIntersecting; update() }, { threshold: 0 })
    const finalObserver = new IntersectionObserver(([entry]) => { nearFinal = entry.isIntersecting; update() }, { rootMargin: '0px 0px 160px 0px' })
    heroObserver.observe(hero)
    finalObserver.observe(final)
    return () => { heroObserver.disconnect(); finalObserver.disconnect() }
  }, [])

  return <div className={`${s.stickyCta} ${visible ? s.stickyVisible : ''}`} aria-hidden={!visible}>
    <span className={s.stickyLabel}>CAT 2026 · {daysLeft} DAYS LEFT<strong>₹499</strong></span>
    <BootcampAccessCTA href={href} tabIndex={visible ? 0 : -1} />
  </div>
}
