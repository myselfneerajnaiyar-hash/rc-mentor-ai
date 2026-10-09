// Completed-day presentation and protected trainer context. No scoring mutations.
import { normalizeTrapType, trapDescription, trapLesson } from './traps.mjs'

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
  // Keep mixed outcomes in Needs attention so the same question type is never
  // presented as both a strength and a weakness in one day's report.
  const good=questionTypes.filter(r=>r.correct && !r.incorrect).sort((a,b)=>b.correct-a.correct).slice(0,3).map(r=>{
    const q=questions.find(item=>item.type===r.type&&item.outcome==='correct')
    return {observation:`${r.type}: ${r.correct} correct from ${r.attempted} attempted (${r.total} in the session).`,interpretation:questionFeedback(q,'correct')}
  });
  const attention=questionTypes.filter(r=>r.incorrect).sort((a,b)=>b.incorrect-a.incorrect).slice(0,3).map(r=>{
    const q=questions.find(item=>item.type===r.type&&item.outcome==='incorrect')
    return {observation:`${r.type}: ${r.incorrect} incorrect from ${r.attempted} attempted${r.correct?` · ${r.correct} also correct`:''}.`,interpretation:questionFeedback(q,'incorrect')}
  });
  if(report.skipped+report.not_reached+report.timed_out)attention.push({observation:`${report.skipped} skipped, ${report.not_reached} not reached, ${report.timed_out} timed out.`,interpretation:'Review completion alongside accuracy. No answer was saved for these questions, so there is no selected-option reasoning to explain.'})
  const misses=questions.filter(q=>q.outcome==='incorrect');
  const trapRows=misses.flatMap(q=>{const option=q.analysis?.optionAnalysis?.find(o=>o.optionId===q.response),trap=normalizeTrapType(option?.trapType);return trap?[{q,trap}]:[]})
  const trapCounts=new Map();for(const {trap} of trapRows)trapCounts.set(trap,(trapCounts.get(trap)||0)+1)
  const orderedTraps=[...trapCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),mostFrequentTrap=orderedTraps.find(([trap])=>trap!=='Other')?.[0]||null
  const traps=orderedTraps.map(([name,count])=>({name,count,questions:trapRows.filter(row=>row.trap===name).map(({q})=>({block:q.block,number:q.number}))}))
  const lessons=orderedTraps.map(([trap])=>{const {q}=trapRows.find(row=>row.trap===trap);return {block:q.block,number:q.number,trap,text:trapLesson(trap)||q.analysis?.idealThinkingProcess?.[0]||q.analysis?.optionAnalysis?.find(o=>o.optionId===q.response)?.explanation}}).filter(x=>x.text).slice(0,3)
  const focusType=misses[0],typeTrap=focusType&&trapRows.find(row=>row.q.type===focusType.type&&row.trap!=='Other')?.trap
  const focus=focusType?(typeTrap?`${focusType.type} — especially ${typeTrap.toLocaleLowerCase()} distractors. ${trapDescription(typeTrap)||trapLesson(typeTrap)}`:`${focusType.type}: ${focusType.analysis.idealThinkingProcess?.[0]||'Compare your saved response with the authored explanation.'}`)
    :report.answered?'Carry forward the reasoning you verified today. Check why the closest alternative fails; no missed-answer pattern appeared in this session.':'Today provides no answered-question evidence for a skill diagnosis.'
  const reflection=orderedTraps.length?`In this session, ${orderedTraps.map(([trap,n])=>`${n} ${trap} distractor${n===1?'':'s'}`).join(' and ')} were selected. Review the matching questions below to see what each option changed.`
    :misses.length?'The answered mistakes in this session do not have enough authored option-level trap detail to summarize a distractor pattern. The question explanations below show the available evidence.':'No incorrect answered options were recorded in this session, so there is no distractor pattern to summarize.'
  return {...report,questionTypes,timing:{observed:observed.length,total:questions.length,
    averageSeconds:observed.length?observed.reduce((n,q)=>n+q.activeMs,0)/observed.length/1000:null,
    fastest:observed.length>1?timingRef(ranked[0]):null,slowest:observed.length>1?timingRef(ranked.at(-1)):null},
    debrief:{good,attention:attention.slice(0,3),lessons,traps,unclassifiedTrapSelections:misses.length-trapRows.length,blockReflection:reflection,
      watch:mostFrequentTrap?`I’ll check whether ${mostFrequentTrap.toLocaleLowerCase()} distractors recur in later completed attempts.`:'I’ll use later completed attempts to see whether any specific question type or distractor trap recurs.',focus}}
}
