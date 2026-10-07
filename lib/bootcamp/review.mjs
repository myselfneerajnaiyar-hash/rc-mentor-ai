// Presentation-only adapter for completed, authorized Boot Camp reviews.
// Never used by scoring or by the public activity projection.
export function validateReview(review, key) {
  if (!review || review.key !== key || !review.result || !Array.isArray(review.questions) || !review.questions.length
    || review.questions.some(q => !q?.id || !q.analysis || !Array.isArray(q.options) || !Array.isArray(q.sentences))
    || (review.passage && !review.passageAnalysis)) {
    throw new Error('Review data is missing or incomplete for this block. Your submitted answers are saved. Reload saved progress to retry.')
  }
  return review
}

const outcomeLabel = value => ({correct:'Correct',incorrect:'Incorrect',skipped:'Skipped',not_reached:'Not reached',timed_out:'Timed out'})[value]
export function dailyRCQuestion(q) {
  const a = q.analysis || {}
  const selected = a.optionAnalysis?.find(o => o.optionId === q.response)
  return {
    id:q.id, question_text:q.text,
    options:['A','B','C','D'].map(id=>q.options.find(o=>o.id===id)?.text || ''),
    correct_answer:['A','B','C','D'].indexOf(q.answer)+1,
    reviewMetadata:{type:q.type,skill:a.primarySkill},
    question_enrichment:{
      stemAnalysis:a.typeSpecific?.stemAnalysis,
      trapType:selected?.trapType,
      authorTrapMechanism:selected && !selected.isCorrect ? selected.explanation : undefined,
      idealThinkingProcess:a.idealThinkingProcess?.map((step,i)=>`${i+1}. ${step}`).join('\n'),
      whatCorrectOptionDoesBetter:a.explanation,
      evidence:a.evidence || [],
      eliminationLogic:Object.fromEntries((a.optionAnalysis || []).map(o=>[`option${o.optionId}`,[o.trapType && `Trap: ${o.trapType}`,o.explanation,o.looksCorrectBecause && `Why it can look tempting: ${o.looksCorrectBecause}`].filter(Boolean).join('\n\n')])),
      contentDetails:a.typeSpecific,
      // Retain the authored enrichment; cognitive hypotheses are not student diagnoses.
      sourceAnalysis:a
    }
  }
}
export function dailyRCResponse(q) {
  return {question_id:q.id,selected_option:q.response,is_correct:q.outcome==='correct',outcomeLabel:outcomeLabel(q.outcome)}
}
export function dailyRCReview(review) {
  const p = review.passageAnalysis
  return {
    attempt:{id:review.key},
    rcSet:{passage:review.passage.text,passage_enrichment:{
      ...p,
      vocabulary:Array.isArray(p.vocabulary) ? p.vocabulary : [],
      passageFlow:(p.passageFlow || []).map(para=>({...para,actualMeaning:para.actualMeaning || para.simpleExplanation,simpleExplanation:undefined})),
      passageFlowMap:p.passageFlowMap || (p.passageFlow || []).map(para=>({paragraph:para.paragraph,title:para.whyThisParagraphExists,description:para.simpleExplanation})),
      reviewObservations:p.readingPsychology,
      reviewGaps:[
        !p.vocabulary?.length && 'Vocabulary intelligence is not supplied for this passage.',
        !p.readingPsychology?.authorTrapMoments?.length && 'Explicit author trap moments are not supplied.',
        !p.readingPsychology?.scopeShiftMoments?.length && 'Explicit scope-shift annotations are not supplied.',
        'The source supplies paragraph explanations, not observed student interpretations.'
      ].filter(Boolean)
    }},
    questions:review.questions.map(dailyRCQuestion),responses:review.questions.map(dailyRCResponse)
  }
}
export function reviewObservation(review, questionId) {
  if (!review) return null
  const q = questionId ? review.questions.find(q=>q.id===questionId) : review.questions.find(q=>q.outcome==='incorrect') || review.questions.find(q=>q.outcome==='correct')
  if (!q) return {observation:'No answer was recorded in this block.',interpretation:'There is no selected-response evidence to interpret.',confidence:'Insufficient evidence for a reasoning pattern.'}
  const index=review.questions.indexOf(q)+1
  if(q.response === null) return {observation:`Question ${index}: ${outcomeLabel(q.outcome).toLowerCase()}. No answer was saved.`,interpretation:'There is no selected-response evidence to explain this outcome. Review the supporting text before drawing conclusions.',confidence:'An unanswered question does not establish a reasoning weakness.'}
  const response=Array.isArray(q.response) ? q.response.join(' → ') : q.type==='Sentence Placement' ? `position [${q.response}]` : q.response
  const selected=q.analysis.optionAnalysis?.find(o=>o.optionId===q.response)
  return {observation:`On question ${index}, you chose ${response}. This answer was ${q.outcome}.`,interpretation:selected?.explanation || q.analysis.explanation,confidence:'This is one response in this block. It does not establish a stable cognitive weakness.'}
}
