'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { supabase } from '@/lib/supabase';
import { fetchWithTimeout } from '@/lib/mobile/request';
const Context=createContext(null);
const empty={loading:true,activities:[],recent:null,error:null};
export default function DailyActivityProvider({children}){
 const {user,capabilities,profile}=useTenant();
 const key=user?.id+':'+capabilities.showDailyRC+':'+!!profile;
 const current=useRef(key);current.current=key;
 const flight=useRef(null),saved=useRef(null);
 const [state,setState]=useState({...empty,key});
 const refresh=useCallback((force=true)=>{
  if(!user?.id||!profile)return Promise.resolve();
  const dateKey=new Date().toISOString().slice(0,10)+':'+new Date(Date.now()+19800000).toISOString().slice(0,10);
  if(flight.current?.key===key){if(force)flight.current.again=true;return flight.current.promise;}
  if(!force&&saved.current?.key===key&&saved.current.day===dateKey&&Date.now()-saved.current.at<60000)return Promise.resolve();
  setState(s=>s.key===key?{...s,loading:true,error:null}:{...empty,key});
  const promise=(async()=>{try{
   const {data:{session}}=await supabase.auth.getSession();
   if(session?.user?.id!==user.id)throw Error('Your session changed. Please retry.');
   const response=await fetchWithTimeout('/api/daily-status',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
   if(!response.ok)throw Error('Your daily progress could not be loaded. Please retry.');
   const data=await response.json();
   if(current.current!==key)return;
   saved.current={key,day:dateKey,at:Date.now()};setState({...data,key,loading:false,error:null});
  }catch(error){if(current.current===key)setState({...empty,key,loading:false,error:error.message});}
  finally{if(flight.current?.promise===promise){const again=flight.current.again;flight.current=null;if(again&&current.current===key)refresh(true);}}})();
  flight.current={key,promise};return promise;
 },[key,user?.id,!!profile]);
 useEffect(()=>{saved.current=null;refresh(false);},[refresh]);
 useEffect(()=>{const update=()=>refresh(true),focus=()=>refresh(false);window.addEventListener('auctor:activity-saved',update);window.addEventListener('focus',focus);const timer=setInterval(focus,60000);return()=>{window.removeEventListener('auctor:activity-saved',update);window.removeEventListener('focus',focus);clearInterval(timer);};},[refresh]);
 return <Context.Provider value={{...(state.key===key?state:empty),profile,refresh}}>{children}</Context.Provider>;
}
export function useDailyActivity(){return useContext(Context);}
