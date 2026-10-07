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
const typeFocus = {
  'Main Idea':'identify the central claim while keeping its scope and qualifications intact',
  'Inference':'separate what the passage warrants from what merely sounds plausible',
  'Author Tone':'read the author’s attitude from evaluative language and qualify its intensity',
  'Strengthen':'test which evidence most directly supports the argument’s premise or conclusion',
  'Weaken':'find what challenges a premise, breaks a link, or undercuts the conclusion',
  'Detail':'match the requested fact precisely and retain its stated conditions',
  'Detail/Fact':'match the requested fact precisely and retain its stated conditions',
  'Purpose/Function':'connect the sentence or example to the role it plays in the author’s argument',
  'Para Jumble':'sequence ideas through references, connectors, and paragraph cohesion',
  'Para Summary':'preserve the central idea and scope while leaving out minor examples',
  'Odd Sentence Out':'find the sentence that breaks the shared topic or logical progression',
  'Sentence Placement':'use the references before and after a sentence to find its coherent position',
  'Sentence Completion':'complete the thought in a way that follows the passage’s logic and tone'
}
function responseLabel(q) {
  if (q.response === null || q.response === undefined) return 'no response was saved'
  if (q.mode === 'MCQ') {
    const option = q.options?.find(item => item.id === q.response)
    return `you chose “${option?.text || q.response}”`
  }
  return `you entered ${Array.isArray(q.response) ? q.response.join(' → ') : q.response}`
}
function questionFeedback(q, expectedOutcome) {
  if (!q || !['correct','incorrect'].includes(q.outcome) || !['correct','incorrect'].includes(expectedOutcome)) return 'There is not enough answered-question evidence to interpret this skill.'
  const focus = typeFocus[q.type] || q.analysis?.primarySkill?.toLowerCase()
  if (!focus) return 'The saved result is available, but the question has no specific skill label to support a coaching interpretation.'
  const process = q.analysis?.idealThinkingProcess?.[0]
  const authored = process || q.analysis?.explanation
  const response = responseLabel(q)
  const result = q.outcome === 'correct'
    ? `Your response matched the key. ${q.type} questions ask you to ${focus}.`
    : `Your response missed the key. For ${q.type}, revisit how to ${focus}.`
  return `${result}${authored ? ` The authored review points to this move: ${authored}` : ''} Saved response: ${response}.`
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
  const good=questionTypes.filter(r=>r.correct).sort((a,b)=>b.correct-a.correct).slice(0,3).map(r=>{
    const q=questions.find(item=>item.type===r.type&&item.outcome==='correct')
    return {observation:`${r.type}: ${r.correct} correct from ${r.attempted} attempted (${r.total} in the session).`,
      interpretation:questionFeedback(q,'correct'),confidence:'Direct evidence of today’s results; not yet evidence of a lasting strength.'}
  });
  const attention=questionTypes.filter(r=>r.incorrect).sort((a,b)=>b.incorrect-a.incorrect).slice(0,3).map(r=>{
    const q=questions.find(item=>item.type===r.type&&item.outcome==='incorrect')
    return {observation:`${r.type}: ${r.incorrect} incorrect from ${r.attempted} attempted.`,
      interpretation:questionFeedback(q,'incorrect'),confidence:r.incorrect>1?'Repeated misses today; the cause is still uncertain.':'One response is not enough to establish a pattern.'}
  });
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
