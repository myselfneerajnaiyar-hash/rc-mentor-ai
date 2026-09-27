import { completedEvidence, reportDetails } from './report.mjs'
import { coachKey, metrics, buildReport } from './session.mjs'
import { LABELS } from './content.mjs'
import { trainerPromptContext } from './trainer.mjs'

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
    const ranked = [...report.skills].sort((a, c) => (c.total-c.correct)-(a.total-a.correct) || c.total-a.total)
    const target = ranked[0]
    return { title: 'Your next training focus', text: `You completed Day ${snapshot.dayNumber} with ${report.correct} correct answers out of ${report.total} and answered ${report.answered} questions. This is a starting point, not a fixed assessment of your ability.`,
      focus: report.answered === 0 ? 'Tomorrow, start by committing to one supported answer at a time. Today has no answered-question evidence to diagnose a skill weakness.' : report.correct === 25 ? 'Tomorrow, keep the same evidence-first approach under time pressure. Explain why the closest distractor fails before moving on.' : `Tomorrow, revisit ${target.skill}: ${target.correct} correct across ${target.total} questions today. Reconstruct the reasoning from the explanation before trying again. This focus is provisional after one day.`, evidenceIds: target.questionIds }
  }
  const m = metrics(b.questions), unanswered = m.skipped + m.not_reached + m.timed_out
  const wrongIndex = b.questions.findIndex(q => q.outcome === 'incorrect')
  const wrong = wrongIndex >= 0 ? snapshot.blocks[s.current_block].questions[wrongIndex] : null
  const observedIndex = wrongIndex >= 0 ? wrongIndex : b.questions.findIndex(q => q.outcome === 'correct')
  const observed = observedIndex >= 0 ? snapshot.blocks[s.current_block].questions[observedIndex] : null
  const response = observedIndex >= 0 ? b.questions[observedIndex].response : null
  const option = observed?.analysis.optionAnalysis?.find(o => o.optionId === response)
  const observation = observed ? ` On question ${observedIndex + 1}, you chose ${Array.isArray(response) ? response.join(' > ') : observed.type === 'Sentence Placement' ? 'position [' + response + ']' : response}. ${option?.explanation || observed.analysis.explanation}` : ''
  return { title: `${LABELS[b.key]} — let’s take one lesson forward`,
    text: `You got ${m.correct} of ${m.total} correct and answered ${m.answered}. ${unanswered ? `${m.skipped} skipped, ${m.not_reached} not reached, and ${m.timed_out} timed out. ` : ''}${b.result.elapsed_seconds} seconds elapsed in this block.${observation}`,
    focus: wrong ? `Revisit ${wrong.type}: ${wrong.analysis.idealThinkingProcess[0] || wrong.analysis.explanation}` : m.answered === 0 ? 'Begin the next activity with one question and look for direct support before choosing.' : 'Carry forward the reasoning you verified in review. Check the scope of the claim before committing to your next answer.',
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
