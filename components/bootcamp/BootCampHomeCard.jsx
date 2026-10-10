'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, CalendarCheck, CheckCircle, Target, Trophy } from 'lucide-react'
import { bootcampRequest } from '@/lib/bootcamp/client'
import { buildAttributedPath, readBrowserAttribution } from '@/lib/attribution.mjs'
import { getBootCampHomeBannerState, getBootCampHomeCardVariant } from '@/lib/bootcamp/presentation.mjs'
import s from './bootcamp.module.css'
export default function BootCampHomeCard({ userId }) {
  const [catalog,setCatalog]=useState(null)
  const [access,setAccess]=useState(null)
  const [routes,setRoutes]=useState({query:'',purchase:'/pricing?offer=bootcamp'})
  useEffect(()=>{let active=true;setCatalog(null);setAccess(null);if(userId){Promise.allSettled([bootcampRequest(),bootcampRequest('/access')]).then(([catalogResult,accessResult])=>{if(!active)return;if(catalogResult.status==='fulfilled')setCatalog(catalogResult.value);if(accessResult.status==='fulfilled')setAccess(accessResult.value)})}return()=>{active=false}},[userId])
  useEffect(()=>{const query=new URLSearchParams(window.location.search);setRoutes({query:query.size?`?${query.toString()}`:'',purchase:buildAttributedPath('/pricing',readBrowserAttribution(),{offer:'bootcamp'})})},[])
  const variant=getBootCampHomeCardVariant(access)
  const included=variant==='included'
  const banner=getBootCampHomeBannerState(access,catalog)
  const href=banner.destination==='purchase'?routes.purchase:`${banner.href}${routes.query}`
  const liveAt=banner.headline.indexOf('live.')
  const headline=liveAt<0?banner.headline:<>{banner.headline.slice(0,liveAt)}<span className={s.homeLive}>live.</span>{banner.headline.slice(liveAt+5)}</>
  return <section className={s.homeCard} aria-labelledby="home-bootcamp-title" data-testid="bootcamp-home-card" data-variant={variant}>
    <div className={s.homeCopy}>
      <p className={s.homeKicker}><Trophy size={17} aria-hidden="true"/><span>JUST LAUNCHED</span><i aria-hidden="true">·</i><span>AUCTOR VARC BOOT CAMP</span></p>
      <h2 id="home-bootcamp-title">{headline}</h2>
      {banner.message&&<p className={s.homeMessage}>{banner.message}</p>}
      <ul className={s.homeFeatures} aria-label="Boot Camp features">
        <li><CalendarCheck aria-hidden="true"/>Guided practice</li>
        <li><Target aria-hidden="true"/>Gap analysis</li>
        <li><Activity aria-hidden="true"/>Fix-it plan</li>
      </ul>
    </div>
    <div className={s.homeAction}>
      {included ? <div className={s.homeIncluded}><CheckCircle aria-hidden="true"/>Included in your plan</div> : <div className={s.homeLaunchOffer}>
        <div className={s.homeOfferLabel}><strong>LAUNCH<br/>OFFER</strong><span>All 45 days</span></div>
        <div className={s.homeOfferPrice}><span className={s.homeSaving}>SAVE ₹200</span><div><del>₹999</del><strong>₹799</strong></div></div>
      </div>}
      <Link className={s.homeCta} href={href}>{banner.cta}<span aria-hidden="true">→</span></Link>
    </div>
  </section>
}
