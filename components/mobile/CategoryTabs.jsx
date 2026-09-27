'use client';
import { useEffect, useRef } from 'react';
export default function CategoryTabs({id,label,tabs,active,onChange}) {
 const ref=useRef(null);
 useEffect(()=>{const strip=ref.current;const selected=strip?.querySelector('[aria-selected="true"]');if(!selected)return;const left=selected.offsetLeft;if(left<strip.scrollLeft)strip.scrollLeft=left;else if(left+selected.offsetWidth>strip.scrollLeft+strip.clientWidth)strip.scrollLeft=left+selected.offsetWidth-strip.clientWidth;},[active]);
 return <div ref={ref} className="category-tabs" role="tablist" aria-label={label}>{tabs.map((tab,index)=><button type="button" key={tab.value} id={id+'-'+tab.value} role="tab" aria-selected={active===tab.value} aria-controls={id+'-panel'} tabIndex={active===tab.value?0:-1} onClick={()=>onChange(tab.value)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;onChange(tabs[next].value);ref.current?.querySelectorAll('button')[next]?.focus();}}>{tab.label}</button>)}</div>;
}
