'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/components/providers/TenantProvider';
import { visibleFeatures } from '@/lib/mobile/features.mjs';
import { useRouteTab } from '@/lib/mobile/useRouteTab';
import { captureLearningEvent } from '@/lib/learningAnalytics';
import PremiumLock from './PremiumLock';
import ActivityIcon from './ActivityIcon';
import CategoryTabs from './CategoryTabs';
const categories=[{value:'daily',group:'Daily',label:'Daily Practice'},{value:'reading',group:'Reading',label:'Reading'},{value:'verbal',group:'Verbal & speed',label:'Verbal & Speed'},{value:'testing',group:'Testing',label:'Testing'},{value:'tools',group:'Your tools',label:'Your Tools'}];
export default function PracticeHub(){
 const {capabilities,entitlement}=useTenant();
 const router=useRouter();const [lock,setLock]=useState(null);const features=visibleFeatures(capabilities);
 const tabs=categories.filter(category=>features.some(feature=>feature.group===category.group));
 const [active,setActive]=useRouteTab(tabs.map(tab=>tab.value),'daily');
 const selected=tabs.find(tab=>tab.value===active);
 useEffect(()=>captureLearningEvent('practice_feature_view',{features:features.map(f=>f.id)}),[capabilities.exam]);
 return <div className="mobile-hub practice-hub">
  <header className="mobile-hub-heading"><p className="mobile-eyebrow">Find your focus</p><h1>Practice</h1><p>Daily habits, focused skills and deeper challenges.</p></header>
  <CategoryTabs id="practice-category" label="Practice categories" tabs={tabs} active={active} onChange={setActive}/>
  <section className="practice-group" role="tabpanel" id="practice-category-panel" aria-labelledby={'practice-category-'+active} tabIndex={0}>
   <h2>{selected.label}</h2><div className="practice-grid">{features.filter(f=>f.group===selected.group).map(f=><button type="button" className="practice-row" data-activity={f.id} key={f.id} onClick={()=>{if(f.premium&&!entitlement.hasAccess){captureLearningEvent('premium_feature_click',{feature:f.id});setLock(f);}else{captureLearningEvent('practice_feature_start',{feature:f.id});router.push(f.href);}}}>
    <ActivityIcon id={f.id}/><span className="practice-copy"><strong>{f.name}</strong><small>{f.description}</small></span>
    <span className="practice-access"><span className="practice-badge">{f.premium?entitlement.hasAccess?'Included':'Premium':f.id==='cat'?'Explore':'Free'}</span>{f.time&&<small>{f.time}</small>}<span className="practice-arrow" aria-hidden="true">→</span></span>
   </button>)}</div>
  </section>{lock&&<PremiumLock feature={lock} onClose={()=>setLock(null)}/>}</div>;
}
