const fs=require('fs');
function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')))}
edit('app/page.js',s=>{
 s=s.replace('import { useState, useEffect, useRef } from "react";','import { useState, useEffect, useRef } from "react";\nimport dynamicImport from "next/dynamic";\nimport MobileHome from "@/components/mobile/MobileHome";\nimport TodayHub from "@/components/mobile/TodayHub";\nimport PracticeHub from "@/components/mobile/PracticeHub";\nimport PremiumLock from "@/components/mobile/PremiumLock";\nimport { allowActivityExit } from "@/components/mobile/MobileShell";\nimport { BOOTCAMP_ENABLED, GRAMMAR_ENABLED, FEATURES } from "@/lib/mobile/features.mjs";\nimport LeaderboardSection from "@/components/home-v2/LeaderboardSection";');
 for(const name of ['RCView','SpeedContainer','VocabLab','CATArenaLanding','RCSectionalContainer','ChatMentor','PrecisionTraining','ProfileView','DailyWorkoutContainer','HangmanView','GrammarLab'])s=s.replace(new RegExp('import '+name+' from "([^"]+)";?'),(_,p)=>`const ${name} = dynamicImport(() => import("${p}"), { loading: () => <p role="status">Opening your practice…</p> });`);
 s=s.replace('const SHOW_GRAMMAR_LAB = false;','const SHOW_GRAMMAR_LAB = GRAMMAR_ENABLED;');
 s=s.replace('const [view, setView] = useState("home");','const [view, setViewState] = useState("home");\n  const [lockedFeature, setLockedFeature] = useState(null);\n  function setView(next) {\n    if (!allowActivityExit()) return;\n    const feature = FEATURES.find(f => f.id === next);\n    if (feature?.premium && !hasPremiumAccess) { captureLearningEvent("premium_feature_click", {feature:next}); setLockedFeature(feature); return; }\n    router.push(`/?view=${next}`);\n  }');
 s=s.replace('const [isMobile, setIsMobile] = useState(false);','const [isMobile, setIsMobile] = useState(null);');
 const start=s.indexOf('useEffect(() => {\n  console.log("view query');const end=s.indexOf('}, [searchParams]);',start);
 if(start<0)throw Error('query effect not found');
 s=s.slice(0,start)+`useEffect(() => {
  if (window.__auctorCancelledBack) { window.__auctorCancelledBack=false; return; }
  const requested=searchParams.get("view") || "home";
  const allowed=["home","today","practice","profile","workout","hangman","rc","speed","vocab","precision","cat","mentor","leaderboards",...(GRAMMAR_ENABLED?["grammar"]:[])];
  const next=allowed.includes(requested)?requested:"home";
  const feature=FEATURES.find(f=>f.id===next);
  if(feature?.premium && !hasPremiumAccess){setLockedFeature(feature);setViewState("practice");return;}
  setViewState(next);
  document.body.scrollTop=0;document.documentElement.scrollTop=0;mainRef.current?.scrollTo(0,0);
}, [searchParams, hasPremiumAccess]);`+s.slice(end+'}, [searchParams]);'.length);
 const lockStart=s.indexOf('useEffect(() => {\n\n  const freeViews');const lockEnd=s.indexOf('}, [view, hasPremiumAccess])',lockStart);
 if(lockStart>=0)s=s.slice(0,lockStart)+s.slice(lockEnd+'}, [view, hasPremiumAccess])'.length);
 s=s.replace('<a href="/boot-camp"','{BOOTCAMP_ENABLED && <a href="/boot-camp"').replace(' />Boot Camp</a>',' />Boot Camp</a>}');
 s=s.replace('{!isMobile &&','{isMobile === false &&');
 s=s.replace('{view === "home" && (','{view === "home" && isMobile === true && <MobileHome />}\n  {view === "today" && <TodayHub />}\n  {view === "practice" && <PracticeHub />}\n  {view === "leaderboards" && <LeaderboardSection exam={exam}/>}\n  {lockedFeature && <PremiumLock feature={lockedFeature} onClose={()=>setLockedFeature(null)}/>}\n  {view === "home" && isMobile === false && (');
 s=s.replace('className="w-full px-4 md:px-8 py-6 md:py-10"','className="root-content w-full px-4 md:px-8 py-6 md:py-10"');
 s=s.replace('<ChatMentor\n    setView={setView}', '<div className="mobile-conversation"><ChatMentor\n    setView={setView}').replace('onClose={() => setView("home")}\n  />','onClose={() => setView("home")}\n  /></div>');
 const navStart=s.indexOf('      <div className="md:hidden">\n        <MobileBottomNav');const navEnd=s.indexOf('      </div>',navStart);
 if(navStart>=0)s=s.slice(0,navStart)+s.slice(navEnd+'      </div>'.length);
 s=s.replace('{!grammarSessionActive && <BirbalFloatingButton','{!grammarSessionActive && view !== "mentor" && <BirbalFloatingButton');
 return s;
});
edit('components/home-v2/ShadowHomeView.jsx',s=>s.replace('import BootCampHomeCard','import { BOOTCAMP_ENABLED } from "@/lib/mobile/features.mjs"\nimport BootCampHomeCard').replace('<BootCampHomeCard userId={user?.id} />','{BOOTCAMP_ENABLED && <BootCampHomeCard userId={user?.id} />}'));
edit('components/home-v2/BirbalFloatingButton.jsx',s=>s.replace('window.innerWidth < 768','window.innerWidth < 900').replace('src="/Birbal avatar.jpeg"','sizes="64px"\n        src="/Birbal avatar.jpeg"'));
edit('lib/learningAnalytics.js',s=>s.replace('captureLearningEvent("activity_completed", dimensions);','captureLearningEvent("activity_completed", dimensions);\n  window.dispatchEvent(new Event("auctor:activity-saved"));'));
