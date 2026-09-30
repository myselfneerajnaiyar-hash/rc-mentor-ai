'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { bootcampRequest } from '@/lib/bootcamp/client'
import { BOOTCAMP_START_DATE } from '@/lib/bootcamp/calendar.mjs'
import s from './bootcamp.module.css'
export default function BootCampHomeCard({ userId }) {
  const [home,setHome]=useState(null)
  const day=home?.calendar?.todayDay,attempt=home?.attempt
  useEffect(()=>{let active=true;setHome(null);if(userId)bootcampRequest().then(data=>{if(active)setHome(data)}).catch(()=>{});return()=>{active=false}},[userId])
  const startLabel=new Date(`${BOOTCAMP_START_DATE}T00:00:00Z`).toLocaleDateString('en-US',{month:'long',day:'numeric'})
  return <section className={s.inlineCard}><div><p>BOOT CAMP{day?` / DAY ${String(day).padStart(2,'0')}`:''}</p><h2>{day?"Today's mission with Birbal.":home?.calendar?.period==='UPCOMING'?`Training starts ${startLabel}.`:home?.calendar?.period==='CLOSED'?'This Boot Camp has ended.':'Your guided practice calendar.'}</h2><p>Past days stay open. Your progress stays with you.</p></div><Link href="/boot-camp">{day?attempt?.status==='completed'?`View Day ${day} Report`:attempt?`Continue Day ${day}`:`Enter Day ${day}`:'Open Boot Camp'} &rarr;</Link></section>
}
