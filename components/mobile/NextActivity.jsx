'use client';
import Link from 'next/link';
import { useDailyActivity } from './DailyActivityProvider';
import { nextActivity } from '@/lib/mobile/features.mjs';
import { captureLearningEvent } from '@/lib/learningAnalytics';
export default function NextActivity({current}) {
  const daily=useDailyActivity();const next=nextActivity(daily?.activities||[],current);
  return <aside className="next-activity"><p className="mobile-eyebrow">Keep your momentum</p><h2>{next?next.completed?'Revisit what you learned':`Next: ${next.name}`:'Choose your next activity'}</h2><p>Review one useful takeaway, then continue when you’re ready.</p><Link className="mobile-secondary" href={next?.href||'/?view=today'} onClick={()=>captureLearningEvent('next_activity_click',{from:current,activity_type:next?.id||'today'})}>{next?next.completed?'Review activity':'Next activity':'Back to Today'} →</Link></aside>;
}
