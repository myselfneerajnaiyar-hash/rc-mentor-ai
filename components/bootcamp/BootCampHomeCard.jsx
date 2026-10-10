'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { bootcampRequest } from '@/lib/bootcamp/client'
import { canPromoteBootCampFreeDay, hasPaidBootCampAccess } from '@/lib/bootcamp/presentation.mjs'
import s from './bootcamp.module.css'
export default function BootCampHomeCard({ userId }) {
  const [home,setHome]=useState(null)
  const [access,setAccess]=useState(null)
  const [href,setHref]=useState('/boot-camp')
  const day=home?.sequenceMode==='personal'?home?.personalDay:home?.calendar?.todayDay,attempt=home?.attempt
  useEffect(()=>{let active=true;setHome(null);setAccess(null);if(userId)Promise.all([bootcampRequest(),bootcampRequest('/access')]).then(([data,accessState])=>{if(active){setHome(data);setAccess(accessState)}}).catch(()=>{});return()=>{active=false}},[userId])
  useEffect(()=>{const query=new URLSearchParams(window.location.search);if(query.size)setHref(`/boot-camp?${query.toString()}`)},[])
  const freeDayOffer=canPromoteBootCampFreeDay(access)
  const showPricing=!hasPaidBootCampAccess(access)
  const action=day?attempt?.status==='completed'?`View Day ${day} Report`:attempt?`Continue Day ${day}`:day===1?(freeDayOffer?'Start Day 1 Free':'Enter Day 1'):`Enter Day ${day}`:freeDayOffer?'Start Day 1 Free':'Open Boot Camp'
  return <section className={s.homeCard} aria-labelledby="home-bootcamp-title" data-testid="bootcamp-home-card">
    <div className={s.homeCopy}>
      <p className={s.homeKicker}><Trophy size={16} aria-hidden="true"/> Auctor VARC Boot Camp</p>
      <h2 id="home-bootcamp-title">A structured 45-day CAT VARC training experience.</h2>
      <p className={s.homeDescription}>Daily guided practice in Reading Comprehension and Verbal Ability, with Birbal-guided review and performance analysis.</p>
      <div className={s.homeOffer}>{showPricing&&<div><del>₹999</del><strong>₹799</strong></div>}{freeDayOffer&&<span>Day 1 is free to try.</span>}</div>
    </div>
    <Link className={s.homeCta} href={href}>{action}<span aria-hidden="true">→</span></Link>
  </section>
}
