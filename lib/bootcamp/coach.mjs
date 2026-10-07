import { completedEvidence, reportDetails } from './report.mjs'
import { coachKey, metrics, buildReport } from './session.mjs'
import { LABELS } from './content.mjs'
import { trainerPromptContext } from './trainer.mjs'
import { normalizeTrapType, trapLesson } from './traps.mjs'

export function coachContext(record, history = []) {
  const { state, snapshot } = record
  return { day: snapshot.dayNumber, stage: state.phase, currentBlock: state.blocks[state.current_block].key,
    completedBlocks: state.blocks.flatMap((b, i) => b.status !== 'completed' ? [] : [{ key: b.key, result: b.result,
      questions: b.questions.map((q, n) => ({ id: q.source_question_id, response: q.response, outcome: q.outcome, activeMs: q.active_ms,
        type: snapshot.blocks[i].questions[n].type, skill: snapshot.blocks[i].questions[n].analysis.primarySkill,
        explanation: snapshot.blocks[i].questions[n].analysis.explanation,
        question: snapshot.blocks[i].questions[n].text, correctAnswer: snapshot.blocks[i].questions[n].answer,
        evidence: snapshot.blocks[i].questions[n].analysis.evidence,
        selectedOptionAnalysis: snapshot.blocks[i].questions[n].analysis.optionAnalysis?.find(o => o.optionId === q.response) || null })) }]),
    ...(state.phase==='report'?{dayEvidence:completedEvidence(record),report:reportDetails(record,state.report || buildReport(state,snapshot))}:{}),
    previousDays: Array.isArray(history)?history:[], ...(Array.isArray(history)?{}:{trainerHistory:trainerPromptContext(history)}), analysisRule: 'Enrichment describes content hypotheses, not observed mental states. Timing is approximate active-view time.' }
}
export function fallbackCoach(record) {
  const { state: s, snapshot } = record
  if (s.phase === 'mission') return { title: 'Today, build the habit of finding evidence.', text: 'We’ll start with five short reasoning questions, then work through three passages and eight verbal questions. After every block, we’ll inspect the reasoning together. Take your time in the warm-up. In each passage, find the main claim before choosing an answer.', focus: 'Choose what the text supports. Keep its qualifications intact.' }
  const b = s.blocks[s.current_block]
  if (s.phase === 'report') {
    const report = s.report || buildReport(s, snapshot)
    const debrief=reportDetails({state:s,snapshot},report).debrief
    return { title: 'Your next training focus', text: debrief.blockReflection, focus: debrief.focus, evidenceIds: [] }
  }
  const m = metrics(b.questions)
  const wrongIndex = b.questions.findIndex(q => q.outcome === 'incorrect')
  const wrong = wrongIndex >= 0 ? snapshot.blocks[s.current_block].questions[wrongIndex] : null
  const observedIndex = wrongIndex >= 0 ? wrongIndex : b.questions.findIndex(q => q.outcome === 'correct')
  const observed = observedIndex >= 0 ? snapshot.blocks[s.current_block].questions[observedIndex] : null
  const response = observedIndex >= 0 ? b.questions[observedIndex].response : null
  const option = observed?.analysis.optionAnalysis?.find(o => o.optionId === response)
  const trapRows=b.questions.flatMap((answer,i)=>{
    if(answer.outcome!=='incorrect')return []
    const source=snapshot.blocks[s.current_block].questions[i],selected=source.analysis.optionAnalysis?.find(o=>o.optionId===answer.response),trap=normalizeTrapType(selected?.trapType)
    return trap?[{trap}]:[]
  })
  const trapCounts=new Map();for(const row of trapRows)trapCounts.set(row.trap,(trapCounts.get(row.trap)||0)+1)
  const reflection=trapCounts.size?`In this block, ${[...trapCounts].sort((a,c)=>c[1]-a[1]||a[0].localeCompare(c[0])).map(([trap,n])=>`${n} ${trap} distractor${n===1?'':'s'}`).join(' and ')} were selected. Compare the matching question explanations to see what made each option tempting.`
    :m.incorrect?`There ${m.incorrect===1?'was':'were'} ${m.incorrect} incorrect answer${m.incorrect===1?'':'s'} in this block, but the authored option reasoning does not support a clear trap summary. Review the available explanations below.`:'No incorrect answered options in this block; there is no distractor pattern to summarize.'
  const observation = observed ? ` On question ${observedIndex + 1}, you chose ${Array.isArray(response) ? response.join(' > ') : observed.type === 'Sentence Placement' ? 'position [' + response + ']' : response}. ${option?.explanation || observed.analysis.explanation}` : ''
  return { title: `${LABELS[b.key]} — let’s take one lesson forward`,
    text: `${reflection}${observation}`,
    focus: wrong ? (trapLesson(normalizeTrapType(snapshot.blocks[s.current_block].questions[wrongIndex].analysis.optionAnalysis?.find(o=>o.optionId===b.questions[wrongIndex].response)?.trapType)) || `Revisit ${wrong.type}: ${wrong.analysis.idealThinkingProcess?.[0] || wrong.analysis.explanation}`) : m.answered === 0 ? 'Begin the next activity with one question and look for direct support before choosing.' : 'Carry forward the reasoning you verified in review.',
    evidenceIds: wrong ? [wrong.id] : b.questions.filter(q => q.outcome === 'correct').map(q => q.source_question_id) }
}

export async function generateCoach(record, history, generate) {
  const fallback = fallbackCoach(record)
  let result = { ...fallback, generatedBy: 'deterministic' }
  if (generate) {
    try {
      const value = await generate(coachContext(record, history), fallback)
      const allowedIds = new Set(record.state.blocks.filter(b => b.status === 'completed').flatMap(b => b.questions.map(q => q.source_question_id)))
      if (value && ['title','text','focus'].every(k => typeof value[k] === 'string' && value[k].length > 0 && value[k].length <= 1800)
        && Array.isArray(value.evidenceIds) && value.evidenceIds.every(id => allowedIds.has(id))) {
        result = { title: value.title, text: value.text, focus: value.focus, evidenceIds: value.evidenceIds, generatedBy: 'ai' }
      }
    } catch { /* Training continues with saved-performance-based commentary. */ }
  }
  return { ...result, cacheKey: `${record.id}:${coachKey(record.state)}`, performanceRevision: record.state.blocks.filter(b => b.status === 'completed').length }
}
