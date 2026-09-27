'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/components/providers/TenantProvider';
import { supabase } from '@/lib/supabase';
import { fetchWithTimeout } from '@/lib/mobile/request';
import { launchProductTour, tourSteps } from './ProductTour';
import { tourReceipt, recordTourFinish, tourSeen, markTourSeen } from '@/lib/mobile/tourProgress.mjs';
const pending=new Map();
function statusRequest(id,token){
 if(!pending.has(id)){const request=fetchWithTimeout('/api/product-tour',{headers:{Authorization:'Bearer '+token},cache:'no-store'},1500).then(async response=>{if(!response.ok)throw Error('Status unavailable');return response.json();}).finally(()=>pending.delete(id));pending.set(id,request);}
 return pending.get(id);
}
async function syncCompletion(id){
 const {data:{session}}=await supabase.auth.getSession();
 if(session?.user?.id!==id)throw Error('Session changed');
 const response=await fetchWithTimeout('/api/product-tour',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}},3000);
 if(!response.ok)throw Error('Completion sync unavailable');
 recordTourFinish(id,false);
}
export default function ProductTourOnboarding(){
 const {user,profile,capabilities,branding}=useTenant();const params=useSearchParams();
 const [replay,setReplay]=useState(0),[notice,setNotice]=useState(null);const tour=useRef(null);
 const explicit=params.get('tour')==='replay',owner=useRef(user?.id);owner.current=user?.id;
 const manual=useRef(null);
 useEffect(()=>{const restart=()=>{manual.current=user?.id;setReplay(n=>n+1);};window.addEventListener('auctor:replay-tour',restart);return()=>window.removeEventListener('auctor:replay-tour',restart);},[user?.id]);
 useEffect(()=>{
  if(!user?.id)return;const id=user.id;
  const sync=()=>{if(tourReceipt(id).pending)syncCompletion(id).catch(()=>{});};sync();window.addEventListener('online',sync);window.addEventListener('focus',sync);return()=>{window.removeEventListener('online',sync);window.removeEventListener('focus',sync);};
 },[user?.id]);
 useEffect(()=>{
  if(!user?.id)return;
  const id=user.id,requested=explicit||manual.current===id;
  if(!requested&&(!profile||profile.profile_completed===false))return;
  let cancelled=false,observer,frame,timer,scheduled=false;
  const fail=error=>{if(cancelled)return;console.error('Product tour initialization failed',error);document.body.classList.remove('product-tour-active');setNotice({id,error:true,text:'The tour could not start. Your dashboard is still available.'});};
  const ready=()=>{
   if(cancelled||scheduled)return;
   const mobile=window.innerWidth<900;
   if(!document.querySelector(mobile?'.mobile-hub-heading':'#rc-generator'))return;
   const steps=tourSteps(capabilities.isCAT,branding.brandName,mobile,capabilities).filter(step=>!step.element||document.querySelector(step.element)?.getClientRects().length);
   if(steps.length<2)return;
   scheduled=true;observer?.disconnect();clearTimeout(timer);
   frame=requestAnimationFrame(()=>{if(cancelled)return;
    try{
     setNotice(null);
     tour.current=launchProductTour(steps,{onComplete:async()=>{
      if(owner.current!==id||cancelled)return;
      recordTourFinish(id,true);
      // Closing the local tour never waits on persistence. Retry pending saves on
      // the next mount, online event or window focus, always with the same owner.
      syncCompletion(id).catch(()=>{if(!cancelled&&owner.current===id)setNotice({id,text:'Tour finished. Account sync will retry when you reconnect.'});});
     },onClose:()=>{tour.current=null;document.body.classList.remove('product-tour-active');if(!cancelled&&new URL(location.href).searchParams.has('tour')){const url=new URL(location.href);url.searchParams.delete('tour');history.replaceState(history.state,'',url.pathname+url.search);}}});
     markTourSeen(id);manual.current=null;
    }catch(error){fail(error);}
   });
  };
  async function prepare(){
   if(!requested){
    if(profile.birbal_onboarded===true||tourReceipt(id).pending||tourSeen(id))return;
    // Status can improve cross-device/legacy detection, but cannot disable the tour.
    try{const {data:{session}}=await supabase.auth.getSession();if(cancelled||session?.user?.id!==id)return;const status=await statusRequest(id,session.access_token);if(status.completed){recordTourFinish(id,false);return;}}catch{/* Use the loaded profile and per-account receipt when offline. */}
   }
   if(cancelled)return;
   observer=new MutationObserver(ready);observer.observe(document.body,{childList:true,subtree:true});
   timer=setTimeout(()=>{observer?.disconnect();fail(Error('Dashboard targets did not mount'));},4000);ready();
  }
  prepare().catch(fail);
  return()=>{cancelled=true;observer?.disconnect();clearTimeout(timer);cancelAnimationFrame(frame);tour.current?.destroy();tour.current=null;document.body.classList.remove('product-tour-active');};
 },[user?.id,!!profile,profile?.profile_completed,profile?.birbal_onboarded,capabilities.isCAT,capabilities.showDailyRC,capabilities.showCATSectionals,branding.brandName,replay,explicit]);
 const visibleNotice=notice?.id===user?.id?notice:null;
 return visibleNotice?<aside className="tour-notice" role={visibleNotice.error?'alert':'status'}><p>{visibleNotice.text}</p>{visibleNotice.error&&<button onClick={()=>{manual.current=user.id;setReplay(n=>n+1);}}>Retry Tour</button>}<button aria-label="Dismiss tour message" onClick={()=>setNotice(null)}>Dismiss</button></aside>:null;
}
