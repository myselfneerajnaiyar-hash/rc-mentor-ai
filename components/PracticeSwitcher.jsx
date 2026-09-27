'use client';
import { GRAMMAR_ENABLED } from '@/lib/mobile/features.mjs';
export default function PracticeSwitcher({view,setView}){
 const items=[['rc','Reading practice'],['vocab','Vocabulary Lab'],['speed','Speed Reading Gym'],['precision','Precision Training'],...(GRAMMAR_ENABLED?[['grammar','Grammar Lab']]:[])];
 return <div className="mobile-module-switcher"><label htmlFor="practice-module">Practice</label><select id="practice-module" value={view} onChange={e=>setView(e.target.value)}>{items.map(([key,label])=><option value={key} key={key}>{label}</option>)}</select><button onClick={()=>setView('practice')}>All practice</button></div>;
}
