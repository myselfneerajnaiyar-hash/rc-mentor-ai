"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import CategoryTabs from '@/components/mobile/CategoryTabs';
import { BookOpen, Clock, ListChecks, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import CATAnalytics from "../app/components/CATAnalytics";
import { useTenant } from "@/components/providers/TenantProvider";



export default function CATArenaLanding({
  isMobile,
  onStartRC,
  isFreeFlow,
}) {
  const { entitlement } = useTenant();
  const [attemptedMap, setAttemptedMap] = useState({});
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pyq");

  const [sectionals, setSectionals] = useState([]);
  const [testStatus, setTestStatus] = useState("loading");
  const [plan, setPlan] = useState(null);

  useEffect(() => {

  async function loadPlan() {

    const { data: authData } =
      await supabase.auth.getUser();

    if (!authData?.user) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", authData.user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    setPlan(data?.plan || null);
  }

  loadPlan();

}, []);
  useEffect(() => {
  async function loadTests() {
    const { data, error } = await supabase
      .from("sectional_test_content")
      .select("*")
      .eq("is_published", true)
      .order("test_number");

    if (!error) {
      setSectionals(data || []);
      setTestStatus("ready");
    } else {
      setTestStatus("error");
    }
  }

  loadTests();
}, []);

  useEffect(() => {
    async function loadAttempts() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data } = await supabase
  .from("mentor_test_attempts")
  .select("id,test_id")
  .eq("user_id", authData.user.id);

      const map = {};

(data || []).forEach((row) => {
  map[row.test_id] = row.id;
});

setAttemptedMap(map);
    }

    loadAttempts();
  }, []);

  
const hasFullCATAccess =
  entitlement.isInstituteStudent ||
  plan === "yearly" ||
  plan === "half_yearly";


 const tabs=[{value:'pyq',label:'Official CAT PYQs'},{value:'mock',label:'Auctor Mocks'},{value:'analytics',label:'Analytics'}];
 const tests=sectionals.filter(s=>s.test_type===activeTab);
 return <div className="sectional-arena">
  {isFreeFlow&&<aside className="arena-free-banner"><h2>Your free AI VARC mocks</h2><p>Look for the Free label on available mocks below.</p></aside>}
  <header className="arena-heading"><p className="mobile-eyebrow">Test Arena · Sectionals</p><h1>CAT Arena</h1><p>Official CAT papers, Auctor mock tests and analysis of your attempts.</p></header>
  <div className="arena-summary"><span><strong>{sectionals.length}</strong> Tests</span><span><strong>{Object.keys(attemptedMap).length}</strong> Attempted</span></div>
  <CategoryTabs id="arena-category" label="Test categories" tabs={tabs} active={activeTab} onChange={setActiveTab}/>
  <section role="tabpanel" id="arena-category-panel" aria-labelledby={'arena-category-'+activeTab} tabIndex={0}>
   {activeTab==='analytics'?<CATAnalytics/>:<>
    <div className="arena-section-heading"><h2>{activeTab==='pyq'?'Official CAT papers':'Auctor mock tests'}</h2><p>40 minutes · 24 questions per test</p></div>
    {isMobile&&<p className="arena-device-note">Start tests on desktop. You can review existing attempts here.</p>}
    <div className="sectional-grid">{tests.map(s=>{
     const attemptId=attemptedMap[s.id];const attempted=!!attemptId;const locked=!s.is_free&&!hasFullCATAccess;
     return <article className="sectional-card" key={s.id} data-attempted={attempted}>
      <div className="sectional-card-top"><span className="sectional-icon" aria-hidden="true"><BookOpen size={22}/></span><span className="sectional-badge" data-status={attempted?'attempted':locked?'locked':'available'}>{attempted?<CheckCircle2 size={14} aria-hidden="true"/>:locked?<Lock size={14} aria-hidden="true"/>:null}{attempted?'Attempted':locked?'Premium':s.is_free?'Free':'Available'}</span></div>
      <h3>{s.test_type==='pyq'?[s.exam,s.exam_year,s.exam_slot!=null?'· Slot '+s.exam_slot:null].filter(Boolean).join(' '):'Auctor Mock '+s.test_number}</h3>
      <p className="sectional-description">{s.test_type==='pyq'?'Official CAT VARC Paper':'Official Auctor VARC Mock'}</p>
      <div className="sectional-meta"><span><Clock size={16} aria-hidden="true"/>40 min</span><span><ListChecks size={16} aria-hidden="true"/>24 questions</span></div>
      {attempted?<button className="sectional-action" onClick={()=>router.push('/arena/result/'+attemptId)}>Review Analysis<ArrowRight size={18} aria-hidden="true"/></button>:<button className="sectional-action" data-locked={locked} onClick={()=>{
       if(isMobile){alert('CAT VARC tests are currently available only on desktop.');return;}
       if(locked){router.push('/pricing');return;}
       onStartRC(s.id);
      }}>{locked?'Unlock Premium':'Start Test'}<ArrowRight size={18} aria-hidden="true"/></button>}
     </article>;
    })}</div>
    {testStatus==='loading'&&<p className="arena-empty" role="status">Loading tests...</p>}
    {testStatus==='error'&&<p className="arena-empty" role="alert">Tests could not be loaded. Please reload to try again.</p>}
    {testStatus==='ready'&&!tests.length&&<p className="arena-empty">No {activeTab==='pyq'?'official papers':'mock tests'} are currently listed.</p>}
   </>}
  </section>
 </div>;
}
