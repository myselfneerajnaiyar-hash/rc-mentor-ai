'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import BootCampHomeCard from '@/components/bootcamp/BootCampHomeCard';
import { useDailyActivity } from './DailyActivityProvider';
import { FEATURES, nextActivity } from '@/lib/mobile/features.mjs';
import { captureLearningEvent } from '@/lib/learningAnalytics';
import DailyPanel from './DailyPanel';
import Recovery from './Recovery';
import ActivityIcon from './ActivityIcon';
import TrialConversionBanner from '@/components/TrialConversionBanner';
export default function MobileHome(){
  const {profile,capabilities}=useTenant();
  const daily=useDailyActivity();const next=nextActivity(daily.activities);
  const completed=daily.activities.filter(a=>a.completed).length;
  useEffect(()=>captureLearningEvent('mobile_home_view'),[]);
  return <div className="mobile-hub"><header className="mobile-hub-heading"><p className="mobile-eyebrow">Your daily reading practice</p><h1>Welcome{profile?.name?`, ${profile.name.split(' ')[0]}`:''}.</h1><p>A little practice. A stronger reader.</p></header>
    {capabilities.isCAT&&<BootCampHomeCard userId={profile?.user_id}/>}
    <TrialConversionBanner />
    <section className="mobile-home-daily" data-daily-ready={!daily.loading&&!daily.error} aria-busy={daily.loading}><h2 className="mobile-daily-title">Today's Activities</h2>
    {daily.error?<Recovery message={daily.error} onRetry={daily.refresh} area="daily_progress"/>:<>{(daily.loading?FEATURES.filter(a=>a.group==='Daily'&&(!a.capability||capabilities[a.capability])):next?[next,...daily.activities.filter(a=>a.id!==next.id)]:daily.activities).map((a,i)=><div key={a.id} className={i===0?'':'mobile-daily-secondary'}><DailyPanel activity={a} primary={!daily.loading&&a.id===next?.id} loading={daily.loading}/></div>)}</>}
    {!daily.loading&&!daily.error&&!daily.activities.length&&<Link className="mobile-primary" href="/?view=practice">Find your next practice</Link>}</section>
    <Link className="mobile-text-action" href="/?view=today">See all free daily activities →</Link>
    {daily.recent&&<section className="mobile-recent"><div><p className="mobile-eyebrow">Your recent result</p><h2>{daily.recent.name}</h2><p>{daily.recent.accuracy!=null?`${Math.round(daily.recent.accuracy)}% accuracy · `:''}{new Date(daily.recent.completed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p></div><Link href={daily.recent.href}>Review <span aria-hidden="true">→</span></Link></section>}
    <section><div className="mobile-section-heading"><h2>Build your skills</h2><Link id="practice-discovery" href="/?view=practice">All practice →</Link></div><div className="mobile-shortcuts"><Link id="rc-generator" data-activity="rc" href="/?view=rc"><ActivityIcon id="rc"/>Reading <span>Generate or paste RC</span></Link><Link id="vocab-lab" data-activity="vocab" href="/?view=vocab"><ActivityIcon id="vocab"/>Vocabulary <span>Learn and recall</span></Link><Link id="speed-drill" data-activity="speed" href="/?view=speed"><ActivityIcon id="speed"/>Speed <span>Read with focus</span></Link></div></section>
    <section className="mobile-progress"><h2>Your momentum</h2><div className="mobile-stat-grid"><div data-activity="hangman"><ActivityIcon id="hangman"/><strong>{daily.loading||daily.error?'--':completed+'/'+daily.activities.length}</strong><span>Done today</span></div><div data-activity="workout"><ActivityIcon id="workout"/><strong>{Number(profile?.streak_count)||0}<small> days</small></strong><span>Workout streak</span></div></div>{!daily.loading&&!daily.error&&<progress aria-label="Daily activity completion" value={completed} max={daily.activities.length||1}/>} {daily.activities.some(a=>a.completed)?<p>{daily.activities.filter(a=>a.completed).length} of {daily.activities.length} daily activities complete.</p>:<p>Your first completed activity starts your progress.</p>}{Number(profile?.streak_count)>0&&<p>{profile.streak_count} day workout streak</p>}<Link href="/?view=profile">History and progress →</Link></section>
    <section className="mobile-discovery">{capabilities.showCATSectionals&&<Link id="sectionals" data-activity="cat" href="/?view=cat"><ActivityIcon id="cat"/>CAT test series <span>Explore papers and mock tests →</span></Link>}<Link data-activity="leaderboards" href="/?view=leaderboards"><ActivityIcon id="leaderboards"/>Your learning community <span>See the leaderboards →</span></Link></section>
  </div>;
}
