const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));
edit('app/daily-challenge/test/page.jsx',s=>s.replace('@/components/AssessmentMode','@/components/assessment/AssessmentMode'));
edit('app/mobile.css',s=>s.replace('overflow-x:clip','overflow-x:visible'));
edit('components/HangmanView.js',s=>{
s=s.replace('export default function', 'import Recovery from "@/components/mobile/Recovery";\nimport NextActivity from "@/components/mobile/NextActivity";\nimport AssessmentMode from "@/components/assessment/AssessmentMode";\nimport { fetchWithTimeout, withTimeout } from "@/lib/mobile/request";\n\nexport default function');
s=s.replace('const [puzzle,', 'const [loadError,setLoadError]=useState(null);\nconst [retry,setRetry]=useState(0);\nconst [saveError,setSaveError]=useState(null);\nconst [saving,setSaving]=useState(false);\nconst savingRef=useRef(false);\nconst [puzzle,');
s=s.replaceAll('await fetch(', 'await fetchWithTimeout(').replace('if (!userId) return;', 'if (!userId) throw new Error("Please sign in to load Word Hunt.");').replace('console.error("No puzzle found for today");\n      return;', 'throw new Error("Today’s Word Hunt is unavailable. Please retry.");').replace('loadPuzzle();\n}, []);','setLoadError(null);withTimeout(loadPuzzle()).catch(e=>setLoadError(e.message));\n}, [retry]);').replace('if (attemptMessage) {','if(loadError)return <Recovery area="word_hunt_load" message={loadError} onRetry={()=>setRetry(n=>n+1)}/>;\nif (attemptMessage) {').replace('<div className="max-w-4xl mx-auto p-6">','<div className="max-w-4xl mx-auto p-6"><NextActivity current="hangman"/>');
s=s.replace('console.log("Submitting...");','if(savingRef.current)return;\n savingRef.current=true;setSaving(true);setSaveError(null);\n try {');
s=s.replace('if (data.success) {','if(!res.ok || !data.success)throw new Error(data.error || "Your result could not save. Please retry.");\n if (data.success) {');
s=s.replace('setFinalScore(score);\n};','setFinalScore(score);\nwindow.dispatchEvent(new Event("auctor:activity-saved"));\n }catch(e){setSaveError(e.message);}finally{savingRef.current=false;setSaving(false);}\n};');
// second occurrence belongs to active game
const pos=s.indexOf(' return (\n  <div className="max-w-4xl mx-auto p-6"><NextActivity current="hangman"/>');
if(pos>=0)s=s.slice(0,pos)+s.slice(pos).replace('<NextActivity current="hangman"/>','<AssessmentMode active={finalScore===null}/>{finalScore!==null&&<NextActivity current="hangman"/>}{saving&&<p role="status">Saving result…</p>}{saveError&&<Recovery area="word_hunt_save" message={saveError} onRetry={handleSubmit}/>}');
return s;
});
edit('components/SpeedGym.jsx',s=>{
s=s.replace('const [error,setError]', 'const [saveError,setSaveError]=useState(null);\n  const [saving,setSaving]=useState(false);\n  const savePayload=useRef(null);\n  const [error,setError]'); // ensure useRef imported below
s=s.replace('useEffect, useState','useEffect, useRef, useState').replace('useState, useEffect','useState, useRef, useEffect');
const a=s.indexOf('    const { data: authData } = await supabase.auth.getUser();',s.indexOf('async function finish'));const b=s.indexOf('    setResult(record);',a);
const block=s.slice(a,b);const payload=block.slice(block.indexOf('user_id:'),block.indexOf('\n        },'));
s=s.slice(0,a)+`    savePayload.current={${payload.replace('user_id: authData.user.id,','')}};\n    saveResult();\n`+s.slice(b);
s=s.replace('  const totalAllowed =',`  async function saveResult(){
    setSaving(true);setSaveError(null);
    try {const {data}=await withTimeout(supabase.auth.getUser());if(!data.user)throw new Error('Please sign in to save your result.');
    const {error}=await supabase.from('speed_sessions').insert({...savePayload.current,user_id:data.user.id});if(error)throw error;
    }catch(e){setSaveError(e.message || 'Your result could not save.');}finally{setSaving(false);}
  }
  const totalAllowed =`);
s=s.replace('<DetailedReport result={result}', '<>{saving&&<p role="status">Saving result…</p>}{saveError&&<Recovery area="speed_save" message={saveError} onRetry={saveResult}/>}</><DetailedReport result={result}');
return s;
});
edit('components/VocabLab.jsx',s=>s.replace('import { supabase', 'import NextActivity from "@/components/mobile/NextActivity";\nimport { supabase').replace('<div className="space-y-6">\n       <div', '<div className="space-y-6">\n       <NextActivity current="vocab"/><div').replace('Lesson Test Complete\n</h2>', 'Lesson Test Complete\n</h2><NextActivity current="vocab"/>'));
edit('components/DailyRCResult.jsx',s=>s.replace('import { supabase', 'import { supabase')); // add independently, source uses hook
edit('components/DailyRCResult.jsx',s=>s.replace('"use client";', '"use client";\nimport NextActivity from "@/components/mobile/NextActivity";').replace('<div className="mt-5 grid gap-4 md:grid-cols-2">','<NextActivity current="daily_rc"/><div className="mt-5 grid gap-4 md:grid-cols-2">'));
edit('components/PrecisionTraining.jsx',s=>s.replace('"use client"','"use client"\nimport NextActivity from "@/components/mobile/NextActivity";').replace('Precision complete</div>', 'Precision complete</div>').replace('  if (phase === "finished" && result) {','  if (phase === "finished" && result) {').replace('<h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Session complete</h1>', '<h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Session complete</h1>'));
edit('app/birbal-v2/page.jsx',s=>{
s=s.replace('const [phase,', 'const [analysisError,setAnalysisError]=useState(null)\nconst [phase,');
s=s.replace('async function extractEditorial() {','async function extractEditorial() {\nlet messageInterval;setAnalysisError(null);').replace('const messageInterval = setInterval','messageInterval = setInterval');
s=s.replace('import { supabase', 'import Recovery from "@/components/mobile/Recovery";\nimport NextActivity from "@/components/mobile/NextActivity";\nimport { fetchWithTimeout } from "@/lib/mobile/request";\nimport { supabase');
s=s.replace('const response = await fetch(', 'const response = await fetchWithTimeout(');
const a=s.indexOf('if (!response.ok) {',s.indexOf('async function extractEditorial'));const b=s.indexOf('const data = await response.json()',a);
s=s.slice(0,a)+'if (!response.ok) throw new Error("Analysis could not finish. Retry with the same files or choose clearer screenshots.");\n'+s.slice(b);
const c=s.indexOf('  alert(',s.indexOf('} catch (err) {',s.indexOf('async function extractEditorial')));const d=s.indexOf('\n}\n}',c);
s=s.slice(0,c)+'  setAnalysisError(err.message || "Analysis failed. Please retry.");\n  setPhase("idle");\n} finally {clearInterval(messageInterval);}\n}'+s.slice(d+4);
// render before upload action, preserving error even idle
s=s.replace('onClick={extractEditorial}', 'onClick={extractEditorial}');
const ret=s.indexOf('return (',s.indexOf('const fullText'));
const root=s.indexOf('>',s.indexOf('<div',ret));
s=s.slice(0,root+1)+'\n{analysisError&&<Recovery area="editorial" message={analysisError} onRetry={extractEditorial}/>}\n{phase==="complete"&&<NextActivity current="editorial"/>}\n'+s.slice(root+1);
return s;
});
