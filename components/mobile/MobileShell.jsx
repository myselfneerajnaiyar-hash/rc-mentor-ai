'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/components/providers/TenantProvider';
import MobileBottomNav from '@/app/components/MobileBottomNav';
import { destination } from '@/lib/mobile/features.mjs';
import DailyActivityProvider from './DailyActivityProvider';
const publicRoutes=['/login','/signup','/welcome','/preview','/preview-ad','/bootcamp-2026','/about','/contact','/payment-success','/birbal-test','/shadow-test','/test-diagnosis','/result-preview'];
export function allowActivityExit(){
 if(window.__auctorExitAllowed)return true;
 if(!document.body.classList.contains('assessment-mode-active'))return true;
 if(window.confirm('Leave this activity? Your unfinished answers may not be saved. Timed activities cannot be paused. Stay to finish, or leave deliberately.')){window.__auctorExitAllowed=true;return true;}
 return false;
}
export default function MobileShell({children}){
 const {user}=useTenant(),path=usePathname(),params=useSearchParams(),router=useRouter();
 const [active,setActive]=useState(false);const previous=useRef('');
 const isStudent=!!user&&!publicRoutes.some(p=>path===p||path.startsWith(p+'/'))&&!path.startsWith('/boot-camp');
 const view=path==='/'?params.get('view')||'home':path.startsWith('/daily-challenge')||path.startsWith('/rc-session')||path==='/rc-history'?'today':'practice';
 const navigate=href=>{if(allowActivityExit())router.push(href);};
 useEffect(()=>{
   const sync=()=>setActive(document.body.classList.contains('assessment-mode-active'));
   sync();const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
   const unload=e=>{if(document.body.classList.contains('assessment-mode-active')){e.preventDefault();e.returnValue='';}};
   const click=e=>{const a=e.target.closest?.('a[href]');if(!a||a.hash&&a.pathname===location.pathname)return;if(document.body.classList.contains('assessment-mode-active')&&!window.__auctorExitAllowed&&!allowActivityExit()){e.preventDefault();e.stopPropagation();}};
   const back=()=>{if(document.body.classList.contains('assessment-mode-active')&&!window.__auctorExitAllowed&&!allowActivityExit()){window.__auctorCancelledBack=true;history.forward();}};
   window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);window.addEventListener('popstate',back);
   return()=>{observer.disconnect();window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);window.removeEventListener('popstate',back);};
 },[]);
 useEffect(()=>{
   const key=path+'?'+params.toString();
   if(previous.current!==key){document.body.scrollTop=0;document.documentElement.scrollTop=0;window.scrollTo(0,0);previous.current=key;window.__auctorExitAllowed=false;}
 },[path,params]);
 useEffect(()=>{document.body.classList.toggle('mobile-student-shell',isStudent);return()=>document.body.classList.remove('mobile-student-shell');},[isStudent]);
 return <DailyActivityProvider>{isStudent&&active&&path!=='/daily-challenge/test'&&<button className="assessment-exit" onClick={()=>navigate('/?view=today')}>Exit activity</button>}{children}{isStudent&&!active&&view!=='mentor'&&<MobileBottomNav view={destination(view)} onNavigate={navigate}/>}</DailyActivityProvider>;
}
