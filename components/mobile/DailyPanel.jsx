'use client';
import Link from 'next/link';
import ActivityIcon from './ActivityIcon';
import { useEffect, useRef } from 'react';
import { captureLearningEvent } from '@/lib/learningAnalytics';
export default function DailyPanel({activity,primary=false,loading=false}) {
  const ref=useRef(null);
  useEffect(()=>{if(loading||!primary||!ref.current)return;const observer=new IntersectionObserver(([e])=>{if(e.isIntersecting){captureLearningEvent('mobile_primary_cta_view',{activity_type:activity.id});observer.disconnect();}},{threshold:.5});observer.observe(ref.current);return()=>observer.disconnect();},[primary,activity.id,activity.completed,loading]);
  return <article className="daily-focus" data-activity={activity.id} id={activity.id==='daily_rc'?'daily-rc':activity.id==='workout'?'daily-workout':'word-hunt'} aria-busy={loading}><ActivityIcon id={activity.id}/><div className="daily-focus-meta"><span>{loading?'Checking today':activity.completed?'Completed today':'Free daily practice'}</span><span>{activity.time}</span></div><h2>{activity.name}</h2><p>{activity.description}</p>{loading?<div className="daily-loading-bar" role="status">Loading daily status...</div>:activity.available?<Link ref={ref} className="mobile-primary" href={activity.href} onClick={()=>{captureLearningEvent(primary?'mobile_primary_cta_click':'today_activity_start',{activity_type:activity.id,action:activity.completed?'review':'start'});}}>{activity.completed?'Review': 'Start'} {activity.id==='daily_rc'?'Challenge':activity.id==='workout'?'Workout':'Word Hunt'} <span aria-hidden="true">→</span></Link>:<p className="mobile-note">Today’s activity is not available yet. Try another free activity.</p>}</article>;
}
