// Completed-day presentation and protected trainer context. No scoring mutations.
export function completedEvidence(record) {
  return record.state.blocks.flatMap((block,i)=>block.status!=='completed'?[]:[{
    key:block.key,result:block.result,passage:record.snapshot.blocks[i].passage || null,
    passageEnrichment:record.snapshot.blocks[i].passageAnalysis || null,
    questions:record.snapshot.blocks[i].questions.map((q,n)=>({...q,block:block.key,number:n+1,
      passageId:record.snapshot.blocks[i].passage?.id || null,response:block.questions[n].response,
      outcome:block.questions[n].outcome,activeMs:block.questions[n].active_ms}))
  }])
}
export function reportDetails(record,report) {
  const blocks=completedEvidence(record),types=new Map();
  const questions=blocks.flatMap(b=>b.questions);
  for(const q of questions) {
    if(!types.has(q.type))types.set(q.type,{type:q.type,total:0,attempted:0,correct:0,incorrect:0,skipped:0,not_reached:0,timed_out:0});
    const row=types.get(q.type);row.total++;row[q.outcome]++;if(['correct','incorrect'].includes(q.outcome))row.attempted++;
  }
  const questionTypes=[...types.values()].map(r=>({...r,accuracy:r.attempted?r.correct/r.attempted*100:null}));
  const observed=questions.filter(q=>Number.isFinite(q.activeMs)&&q.activeMs>0);
  const ranked=[...observed].sort((a,b)=>a.activeMs-b.activeMs);
  const timingRef=q=>q?{block:q.block,number:q.number,seconds:q.activeMs/1000}:null;
  const good=questionTypes.filter(r=>r.correct).sort((a,b)=>b.correct-a.correct).slice(0,3).map(r=>({
    observation:`${r.type}: ${r.correct} correct from ${r.attempted} attempted (${r.total} in the session).`,
    interpretation:'These saved answers matched the expected answers today.',confidence:'Direct evidence of today’s results; not yet evidence of a lasting strength.'}));
  const attention=questionTypes.filter(r=>r.incorrect).sort((a,b)=>b.incorrect-a.incorrect).slice(0,3).map(r=>({
    observation:`${r.type}: ${r.incorrect} incorrect from ${r.attempted} attempted.`,
    interpretation:'Revisit the supporting evidence and compare your answer with the expected reasoning.',confidence:r.incorrect>1?'Repeated misses today; the cause is still uncertain.':'One response is not enough to establish a pattern.'}));
  if(report.skipped+report.not_reached+report.timed_out)attention.push({observation:`${report.skipped} skipped, ${report.not_reached} not reached, ${report.timed_out} timed out.`,interpretation:'Unanswered questions limit what we can infer about reasoning. Review completion alongside accuracy.',confidence:'The saved outcome is known; why it happened is not.'});
  const misses=questions.filter(q=>q.outcome==='incorrect');
  const lessonQuestions=(misses.length?misses:questions.filter(q=>q.outcome==='correct')).filter(q=>q.analysis?.idealThinkingProcess?.length).slice(0,2);
  const lessons=lessonQuestions.map(q=>({block:q.block,number:q.number,text:q.analysis.idealThinkingProcess[0]}));
  return {...report,questionTypes,timing:{observed:observed.length,total:questions.length,
    averageSeconds:observed.length?observed.reduce((n,q)=>n+q.activeMs,0)/observed.length/1000:null,
    fastest:observed.length>1?timingRef(ranked[0]):null,slowest:observed.length>1?timingRef(ranked.at(-1)):null},
    debrief:{good,attention:attention.slice(0,3),lessons,
      watch:'I’ll watch whether today’s outcomes repeat across future sessions. A single day cannot establish a stable cognitive weakness.',
      focus:misses.length?`Tomorrow, give ${misses[0].type} a little extra attention. ${misses[0].analysis.idealThinkingProcess?.[0] || 'Compare the expected reasoning with your saved response.'} This is a provisional focus from today’s evidence.`:report.answered?'Tomorrow, carry forward the reasoning you verified today. Check why the closest alternative fails; there is no need to manufacture a weakness.':'Tomorrow, begin with one supported answer at a time. Today provides no answered-question evidence for a skill diagnosis.'}}
}
