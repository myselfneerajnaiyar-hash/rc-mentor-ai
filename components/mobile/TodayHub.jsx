'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDailyActivity } from './DailyActivityProvider';
import DailyPanel from './DailyPanel';
import ActivityIcon from './ActivityIcon';
import Recovery from './Recovery';
import { captureLearningEvent } from '@/lib/learningAnalytics';
export default function TodayHub(){
  const daily=useDailyActivity(),params=useSearchParams(),router=useRouter();
  const selected=daily.activities.find(a=>a.id===params.get('activity'))||daily.activities[0];
  useEffect(()=>{if(selected)captureLearningEvent('today_tab_view',{activity_type:selected.id});},[selected?.id]);
  return <div className="mobile-hub"><header className="mobile-hub-heading"><p className="mobile-eyebrow">Make a little progress, every day</p><h1>Today</h1><p>Your free daily activities. Pick one to begin.</p></header>{daily.loading?<p role="status">Loading today’s activities…</p>:daily.error?<Recovery message={daily.error} onRetry={daily.refresh} area="today"/>:<><div className="today-tabs today-activity-cards" role="tablist" aria-label="Free daily activities">{daily.activities.map((a,i)=><button key={a.id} data-activity={a.id} id={`today-${a.id}`} role="tab" aria-selected={selected.id===a.id} aria-controls="today-panel" tabIndex={selected.id===a.id?0:-1} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?daily.activities.length-1:(i+(e.key==='ArrowRight'?1:-1)+daily.activities.length)%daily.activities.length;router.replace(`/?view=today&activity=${daily.activities[index].id}`,{scroll:false});document.getElementById(`today-${daily.activities[index].id}`)?.focus();}}} onClick={()=>router.replace(`/?view=today&activity=${a.id}`,{scroll:false})}><ActivityIcon id={a.id}/>{a.id==='daily_rc'?'Daily RC':a.id==='workout'?'Workout':'Word Hunt'}{a.completed&&<span aria-label="completed"> ✓</span>}<span className="today-card-status" aria-hidden="true">{a.completed?'Completed':a.available?a.time:'Coming soon'}</span></button>)}</div>{selected&&<div role="tabpanel" id="today-panel" aria-labelledby={`today-${selected.id}`}><DailyPanel activity={selected}/></div>}<p className="mobile-note">{daily.activities.filter(a=>a.completed).length} of {daily.activities.length} completed today. Your saved results stay in your history.</p></>}</div>;
}
