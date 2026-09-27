const fs=require('fs');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')))}
edit('components/DailyWorkoutFlow.jsx',s=>{
 s=s.replace('import WorkoutEngine','import Recovery from "./mobile/Recovery";\nimport NextActivity from "./mobile/NextActivity";\nimport { fetchWithTimeout, withTimeout } from "@/lib/mobile/request";\nimport WorkoutEngine');
 s=s.replace('const [status, setStatus]', 'const [error,setError]=useState(null);\n  const [retry,setRetry]=useState(0);\n  const [status, setStatus]');
 const a=s.indexOf('useEffect(() => {\n  async function loadWorkout()'),b=s.indexOf('\nif (status === "alreadyAttempted")',a);
 s=s.slice(0,a)+`useEffect(() => {
 let alive=true;setStatus("building");setError(null);
 async function loadWorkout(){try{
 const {data:{session}}=await withTimeout(supabase.auth.getSession());
 if(!session)throw Error("Please sign in again to load your workout.");
 const response=await fetchWithTimeout("/api/check-attempt",{headers:{Authorization:\`Bearer \${session.access_token}\`}});
 if(!response.ok)throw Error("Your workout status could not be checked. Please retry.");
 const attempt=await response.json();if(!alive)return;
 if(attempt.attempted){setTodayAttempt(attempt.attempt);setStatus("alreadyAttempted");return;}
 const res=await fetchWithTimeout(\`/api/get-daily-workout?mode=\${mode}\`);
 if(!res.ok)throw Error("Today’s workout could not load. Please retry.");
 const data=await res.json();
 if(!["speed","vocab","rc1","rc2","micro"].every(key=>data[key]?.questions?.length))throw Error("Today’s workout is still being prepared. Try another daily activity or check again.");
 if(alive){setWorkout(data);setStatus("ready");}
 }catch(error){if(alive){setError(error.message);setStatus("error");}}}
 loadWorkout();return()=>{alive=false;};
},[mode,retry]);
if(status==="error")return <Recovery message={error} area="workout_load" onRetry={()=>setRetry(n=>n+1)}/>;
`+s.slice(b);
 s=s.replace('⚠ Attempt Exhausted','✓ Workout complete').replace('Come back tomorrow for a new challenge 🚀','Your result is saved. Review it or try another daily activity.');
 s=s.replace('{todayAttempt && (','<a className="mobile-secondary" href="/?view=workout&tab=history">Review your workout</a>\n        <NextActivity current="workout"/>\n        {todayAttempt && (');
 s=s.replace('className="min-h-screen bg-slate-950 py-8 text-white sm:py-12"','className="workout-ready min-h-screen bg-slate-950 py-8 text-white sm:py-12"');
 s=s.replace('<section className="mt-6">','<section className="workout-intro-details mt-6">').replace('<section className="mt-6 rounded-2xl','<section className="workout-intro-details mt-6 rounded-2xl').replace('className="mt-8 flex justify-center"','className="workout-start mt-8 flex justify-center"');
 return s;
});
edit('components/DailyWorkoutContainer.jsx',s=>s.replace('import { useState }','import { useSearchParams } from "next/navigation"\nimport { useState, useEffect }').replace('const [workoutRunning','const params=useSearchParams();\n  const [tab,setTab]=useState(params.get("tab")||"start");\n  useEffect(()=>{setTab(params.get("tab")||"start")},[params]);\n  const [workoutRunning').replace('<Tabs defaultValue="start"','<Tabs value={tab} onValueChange={setTab}').replace('flex gap-2 p-1','flex !justify-start gap-2 p-1'));
edit('components/WorkoutEngine.jsx',s=>{
 s=s.replace('import WorkoutShell','import Recovery from "./mobile/Recovery";\nimport NextActivity from "./mobile/NextActivity";\nimport AssessmentMode from "./assessment/AssessmentMode";\nimport { fetchWithTimeout, withTimeout } from "@/lib/mobile/request";\nimport WorkoutShell');
 s=s.replace('const [attemptSaved,','const [saveError,setSaveError]=useState(null);\nconst [saveRetry,setSaveRetry]=useState(0);\nconst [attemptSaved,');
 s=s.replace(' async function saveAttempt() {',' async function saveAttempt() {\n try {\n setSaveError(null);');
 s=s.replace('const { data: { session } } = await supabase.auth.getSession()','const { data: { session } } = await withTimeout(supabase.auth.getSession())');
 s=s.replace('console.log("No active session")\n    return','throw Error("Sign in again before saving. Your answers are still on this screen.")');
 s=s.replace('  const response = await fetch("/api/save-attempt",','  if(saveRetry>0){const existing=await fetchWithTimeout("/api/check-attempt",{headers:{Authorization:`Bearer ${session.access_token}`}});if(!existing.ok)throw Error("Could not verify the previous save. Please retry.");const data=await existing.json();if(data.attempted){if(JSON.stringify(data.attempt?.user_responses)!==JSON.stringify(answers))throw Error("A different workout is already saved today. Open History to review it.");setAttemptSaved(true);return;}}\n  const response = await fetchWithTimeout("/api/save-attempt",');
 s=s.replace('console.log("Save failed")','throw Error("Your result could not be saved. Keep this screen open and retry; your answers are preserved.")');
 s=s.replace('  saveAttempt()\n\n}, [phase])','  saveAttempt()\n\n}, [phase, saveRetry])');
 s=s.replace('}\n  saveAttempt()','} catch(error) { setSaveError(error.message); }\n}\n  saveAttempt()');
 s=s.replace('    <WorkoutReport\n','    <><AssessmentMode active={!initialAnswers && !attemptSaved}/>\n    {saveError?<Recovery area="workout_save" message={saveError} onRetry={()=>setSaveRetry(n=>n+1)}/>:<p role="status" className="p-4 text-slate-300">{initialAnswers || attemptSaved ? "Result saved" : "Saving your result…"}</p>}\n    <WorkoutReport\n');
 s=s.replace('onOpenSolutions={() => setViewMode("explanation")}\n    />','onOpenSolutions={() => setViewMode("explanation")}\n    />{(initialAnswers || attemptSaved)&&<NextActivity current="workout"/>}</>');
 return s;
});
edit('components/SpeedContainer.jsx',s=>s.replace('<div style={introDivider} />','<div className="speed-intro-details"><div style={introDivider} />').replace('</section>\n\n              <div style={ctaRow}>','</div></section>\n\n              <div style={ctaRow}>').replace('className="mt-6 px-8','className="speed-start-button mt-6 px-8'));
edit('components/SpeedGym.jsx',s=>{
 s=s.replace('import AssessmentMode','import Recovery from "./mobile/Recovery";\nimport NextActivity from "./mobile/NextActivity";\nimport { fetchWithTimeout, withTimeout } from "@/lib/mobile/request";\nimport AssessmentMode');
 s=s.replace('const [phase,','const [error,setError]=useState(null);\n  const [phase,');s=s.replace('    setResult(null);','    setResult(null);setError(null);setPhase("loading");');
 s=s.replace('await computeTarget()','await withTimeout(computeTarget())').replace('await fetch("/api/speed-generate"','await fetchWithTimeout("/api/speed-generate"');
 s=s.replace('    } catch {\n      alert("Speed drill could not load.");\n      setPhase("intro");','    } catch (error) {\n      setError(error.message || "Speed drill could not load.");\n      setPhase("error");');
 s=s.replace('<AssessmentMode active=', '{phase === "error" && <Recovery area="speed_generation" message={error} onRetry={start}/>}\n      <AssessmentMode active=');
 s=s.replace('<DetailedReport result={result} meta={meta} onRestart={start} />','<><DetailedReport result={result} meta={meta} onRestart={start} /><NextActivity current="speed"/></>');
 return s;
});
edit('components/ChatMentor.jsx',s=>{
 s=s.replace('import Image from','import { fetchWithTimeout } from "@/lib/mobile/request";\nimport Image from');
 const a=s.indexOf(' async function sendMessage()'),b=s.indexOf('async function typeMessage(',a);
 s=s.slice(0,a)+` async function sendMessage(){return sendVoiceMessage(input);}
 async function sendVoiceMessage(text){
  if(transport)return sendContextMessage(text);
  if(!text.trim()||sendingRef.current)return;
  sendingRef.current=true;setThinking(true);setChatError(null);
  const previous=messages;const updated=[...messages,{role:"user",content:text,time:new Date()}];setMessages(updated);setInput("");
  try{const response=await fetchWithTimeout("/api/birbal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:updated,userId:user?.id,passage,contextual})});const data=await response.json();if(!response.ok||!data.reply)throw Error(data.error||"Birbal could not reply. Please retry your message.");if(mountedRef.current)await typeMessage(data.reply,updated);}
  catch(error){if(mountedRef.current){setMessages(previous);setInput(text);setChatError(error.message);}}
  finally{sendingRef.current=false;if(mountedRef.current)setThinking(false);}
 }

`+s.slice(b);
 s=s.replace('aria-label={transport ? "Message Birbal" : undefined}','aria-label="Message Birbal"').replace('className="flex-1 bg-[#1b2434]','className="min-w-0 flex-1 bg-[#1b2434]').replace('disabled={!!transport && (thinking || !input.trim())}','disabled={thinking || !input.trim()}');
 const anchor='  const [messages, setMessages] = useState([';
 s=s.replace(anchor,`  useEffect(()=>{const viewport=window.visualViewport;const sync=()=>{document.documentElement.style.setProperty('--visual-height',\`\${viewport?.height||window.innerHeight}px\`);document.documentElement.style.setProperty('--visual-top',\`\${viewport?.offsetTop||0}px\`);};sync();viewport?.addEventListener('resize',sync);viewport?.addEventListener('scroll',sync);return()=>{viewport?.removeEventListener('resize',sync);viewport?.removeEventListener('scroll',sync);};},[]);
`+anchor);
 return s;
});
