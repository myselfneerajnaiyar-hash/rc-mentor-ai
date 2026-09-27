'use client';
import { allowActivityExit } from './mobile/MobileShell';
export default function TabGroup({tabs,active,onChange}){
 const change=value=>{if(value!==active&&allowActivityExit())onChange(value);};
 const items=tabs.map(t=>typeof t==='string'?{value:t,label:t}:t);
 return <><label className="generic-tab-select">View<select value={active} onChange={e=>change(e.target.value)}>{items.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label><div className="generic-tabs" role="group" aria-label="Views">{items.map(t=><button key={t.value} aria-pressed={active===t.value} onClick={()=>change(t.value)}>{t.label}</button>)}</div></>;
}
