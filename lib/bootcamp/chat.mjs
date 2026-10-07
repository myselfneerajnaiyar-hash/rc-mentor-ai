import { completedEvidence, reportDetails } from './report.mjs'
import { BootCampError, LABELS, BLOCK_KEYS } from './content.mjs'
import { reviewObservation } from './review.mjs'
import { buildReport } from './session.mjs'
import { trainerPromptContext, trainerBriefing } from './trainer.mjs'
export function validateChat(input) {
  if(!input || typeof input!=='object' || Array.isArray(input))throw new BootCampError('Invalid conversation.',400)
  if(input.attemptId && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.attemptId))throw new BootCampError('Invalid session.',400)
  if(input.questionId !== undefined && (typeof input.questionId!=='string' || !input.questionId || input.questionId.length>160 || !input.block))throw new BootCampError('Invalid review question.',400)
  if(input.block && !BLOCK_KEYS.includes(input.block))throw new BootCampError('Invalid block.',400)
  if(!Array.isArray(input.messages) || !input.messages.length || input.messages.length>12 || input.messages.at(-1)?.role!=='user')throw new BootCampError('Send a question to Birbal.',400)
  if(input.messages.some(m=>!m || !['user','assistant'].includes(m.role) || typeof m.content!=='string' || !m.content.trim() || m.content.length>4000))throw new BootCampError('Please keep each message under 4,000 characters.',400)
}
function typePerformance(record,field='type') {
  const types={}
  record.state.blocks.forEach((b,i)=>{if(b.status==='completed')b.questions.forEach((q,n)=>{
    const question=record.snapshot.blocks[i].questions[n]
    const type=field==='skill' ? question.analysis.primarySkill : question.type
    const row=types[type] ||= {[field]:type,total:0,correct:0,incorrect:0,skipped:0,not_reached:0,timed_out:0,activeMs:0}
    row.total++;row[q.outcome]++;row.activeMs+=q.active_ms || 0
  })})
  return Object.values(types)
}
function historySummary(record) {
  const report=record.state.report || buildReport(record.state,record.snapshot)
  return {day:record.day_number,score:report.score,skills:report.skills,questionTypes:typePerformance(record),
    blocks:report.blocks.map(b=>({key:b.key,correct:b.correct,total:b.total,elapsedSeconds:b.elapsed_seconds,answered:b.answered})),
    mistakes:record.state.blocks.flatMap((b,i)=>b.questions.flatMap((q,n)=>q.outcome==='incorrect' ? [{type:record.snapshot.blocks[i].questions[n].type,skill:record.snapshot.blocks[i].questions[n].analysis.primarySkill,response:q.response,answer:record.snapshot.blocks[i].questions[n].answer,explanation:record.snapshot.blocks[i].questions[n].analysis.explanation}] : [])).slice(0,3)}
}
export function chatContext(record, key, history=[], questionId) {
  if(!record) {
    if(key || questionId)throw new BootCampError('Complete this block before discussing its answers.',409)
    if(!Array.isArray(history)) return {day:{number:history.currentDay.dayNumber,title:history.currentDay.title,status:'not_started',currentBlock:'warmup'},plan:trainerBriefing(history).briefing.workout,blocks:[],history:[],trainerHistory:trainerPromptContext(history),rule:'Describe only the actual workout structure, types and historical observations. Do not reveal unseen questions, passages, enrichment or answers.'}
    throw new BootCampError('Current training content is unavailable. Please reload.',503)
  }
  const {state,snapshot}=record
  const completed=state.blocks.map((b,i)=>b.status==='completed'?i:-1).filter(i=>i>=0)
  const wholeDay=state.phase==='report' && !key
  const selected=wholeDay ? undefined : key ? state.blocks.findIndex(b=>b.key===key) : completed.at(-1)
  if(key && !completed.includes(selected))throw new BootCampError('Complete this block before discussing its answers.',409)
  const blocks=completed.map(i=>{
    const b=state.blocks[i], content=snapshot.blocks[i]
    return {key:b.key,label:LABELS[b.key],result:b.result,endReason:b.end_reason,
      questions:b.questions.map((q,n)=>({number:n+1,id:q.source_question_id,type:content.questions[n].type,skill:content.questions[n].analysis.primarySkill,response:q.response,outcome:q.outcome,activeMs:q.active_ms}))}
  })
  const selectedBlock=Number.isInteger(selected)?state.blocks[selected]:null
  const focusedQuestions=selectedBlock ? snapshot.blocks[selected].questions.map((q,n)=>({...q,response:selectedBlock.questions[n].response,outcome:selectedBlock.questions[n].outcome,active_ms:selectedBlock.questions[n].active_ms})) : []
  const currentQuestionIndex=questionId ? focusedQuestions.findIndex(q=>q.id===questionId) : -1
  if(questionId && currentQuestionIndex<0)throw new BootCampError('This question is not part of the completed review.',400)
  const currentQuestion=currentQuestionIndex>=0 ? focusedQuestions[currentQuestionIndex] : null
  return {day:{number:record.day_number,title:`Day ${record.day_number} · Evidence-first VARC training`,status:state.status,phase:state.phase,currentBlock:state.blocks[state.current_block].key},blocks,
    focus:selectedBlock ? {key:selectedBlock.key,label:LABELS[selectedBlock.key],result:selectedBlock.result,passage:snapshot.blocks[selected].passage,passageEnrichment:snapshot.blocks[selected].passageAnalysis,
      questions:snapshot.blocks[selected].questions.map((q,n)=>({number:n+1,...q,response:selectedBlock.questions[n].response,outcome:selectedBlock.questions[n].outcome,activeMs:selectedBlock.questions[n].active_ms}))}:null,
    currentQuestion:currentQuestion ? {id:currentQuestion.id,number:currentQuestionIndex+1,activeMs:currentQuestion.active_ms,...reviewObservation({questions:focusedQuestions},currentQuestion.id)} : null,
    blockCommentary:selectedBlock ? state.coaching?.[`${selectedBlock.key}:${selected+1}`] || null : null,
    ...(wholeDay?{dayEvidence:completedEvidence(record),report:reportDetails(record,state.report || buildReport(state,snapshot))}:{}),
    questionTypes:typePerformance(record),skills:typePerformance(record,'skill'),
    history:Array.isArray(history)?history.filter(r=>r.state.status==='completed').slice(0,7).map(historySummary):[],
    ...(Array.isArray(history)?{}:{trainerHistory:trainerPromptContext(history)}),
    rule:'Current-day evidence takes priority. Only completed blocks are supplied. Explain an incorrect option using its authored temptation, trap and explanation when present. If trap evidence is missing, say so briefly. Do not repeat confidence disclaimers or infer a stable weakness from one answer. Timing is approximate active-view time; do not call it reading speed.'}
}
