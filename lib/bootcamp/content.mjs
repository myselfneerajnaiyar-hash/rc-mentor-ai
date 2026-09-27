import { createHash } from 'node:crypto'

export class BootCampError extends Error {
  constructor(message, status = 409) { super(message); this.status = status }
}
export const BLOCK_KEYS = ['warmup', 'rc1', 'rc2', 'rc3', 'va']
export const LABELS = { warmup: 'Warm-up', rc1: 'RC 1', rc2: 'RC 2', rc3: 'RC 3', va: 'Verbal Ability' }
const warmupTypes = ['Inference', 'Main Idea', 'Author Tone', 'Weaken', 'Strengthen']
const vaTypes = ['Para Jumble', 'Para Jumble', 'Para Summary', 'Para Summary', 'Sentence Placement', 'Sentence Placement', 'Odd Sentence Out', 'Odd Sentence Out']
export function trainingDay(value) {
  const day = Number(value)
  if (!Number.isInteger(day) || day<1 || day>50) throw new BootCampError('Choose a Boot Camp day from 1 to 50.',400)
  return day
}
function requireContent(condition, message) { if (!condition) throw new BootCampError(`Boot Camp content unavailable: ${message}`, 503) }
function ordered(items, count) {
  requireContent(Array.isArray(items) && items.length === count, `expected ${count} items`)
  const result = [...items].sort((a, b) => a.order - b.order)
  requireContent(result.every((q, i) => q.order === i + 1), 'invalid ordering')
  return result
}

// The verified Content Engine contract. No legacy answer conversion is used here.
export function adaptDay(row) {
  const day = trainingDay(row?.day_number)
  requireContent(row?.id === `bootcamp-day-${day}`, 'missing training day')
  const { content: c, enrichment: e, status } = row.document || {}
  requireContent(status === 'enriched', 'day is not enriched')
  requireContent(c?.id === row.id && c.dayNumber === day && e, 'invalid document')
  const passages = ordered(c.passages, 3)
  const blocks = [
    { key: 'warmup', seconds: null, questions: ordered(c.warmup, 5) },
    ...passages.map((p, i) => {
      requireContent(p.dayId === c.id && typeof p.text === 'string' && p.text.trim() && p.solveMinutes === 7, 'invalid RC passage')
      requireContent(e[p.id]?.kind === 'passage' && e[p.id].targetId === p.id && e[p.id].coreTheme && Array.isArray(e[p.id].passageFlow), 'missing passage analysis')
      return { key: `rc${i + 1}`, seconds: 420, passage: { id: p.id, text: p.text }, passageAnalysis: e[p.id], questions: ordered(p.questions, 4) }
    }),
    { key: 'va', seconds: 480, questions: ordered(c.verbalAbility, 8) },
  ]
  requireContent(c.vaSolveMinutes === 8, 'invalid VA duration')
  requireContent(blocks[0].questions.map(q=>q.type).sort().join('|') === [...warmupTypes].sort().join('|'), 'unexpected warm-up composition')
  requireContent(blocks[4].questions.map(q=>q.type).sort().join('|') === [...vaTypes].sort().join('|'), 'unexpected VA composition')
  const ids = new Set([c.id])
  for (const block of blocks) {
    if (block.passage) { requireContent(!ids.has(block.passage.id), 'duplicate passage ID'); ids.add(block.passage.id) }
    block.questions = block.questions.map(q => {
      requireContent(typeof q.id === 'string' && q.id && !ids.has(q.id), 'invalid/duplicate question ID'); ids.add(q.id)
      requireContent(q.dayId === c.id && q.passageId === (block.passage?.id || null) && q.block === (block.passage ? 'rc' : block.key), 'invalid question relationship')
      requireContent(typeof q.text === 'string' && q.text.trim(), 'missing question text')
      requireContent(Array.isArray(q.options) && Array.isArray(q.sentences), 'invalid question shape')
      if (q.mode === 'MCQ') {
        requireContent(q.options.map(o => o.id).join('') === 'ABCD' && q.options.every(o => typeof o.text === 'string' && o.text.trim()) && q.options.some(o => o.id === q.answer) && q.sourceAnswer === q.answer, 'invalid MCQ key')
      } else {
        requireContent(q.mode === 'TITA' && block.key === 'va' && q.options.length === 0, 'unsupported response mode')
        if (q.type === 'Para Jumble') requireContent(q.sentences.map(s => s.number).join(',') === '1,2,3,4' && Array.isArray(q.answer) && [...q.answer].sort().join(',') === '1,2,3,4' && q.sourceAnswer === q.answer.join(','), 'invalid jumble key')
        else requireContent(Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= (q.type === 'Odd Sentence Out' ? 5 : 4) && Number(q.sourceAnswer) === q.answer, 'invalid position key')
      }
      if (q.type === 'Odd Sentence Out') requireContent(q.sentences.map(s => s.number).join(',') === '1,2,3,4,5', 'invalid sentence list')
      if (q.type === 'Sentence Placement') requireContent([...q.context.matchAll(/\[(\d+)\]/g)].map(m => m[1]).join(',') === '1,2,3,4' && q.sentenceToPlace?.trim(), 'invalid insertion slots')
      const analysis = e[q.id]
      requireContent(analysis?.kind === 'question' && analysis.targetId === q.id && analysis.explanation && analysis.primarySkill && Array.isArray(analysis.idealThinkingProcess) && Array.isArray(analysis.evidence), 'missing question analysis')
      requireContent(analysis.analysisKind === 'content_hypothesis', 'unsupported analysis contract')
      requireContent(analysis.typeSpecific?.type === (block.key === 'va' ? q.type : 'RC'), 'analysis type mismatch')
      if (q.mode === 'MCQ') requireContent(analysis.optionAnalysis?.length === 4 && analysis.optionAnalysis.every((o, n) => o.optionId === q.options[n].id && o.isCorrect === (o.optionId === q.answer)), 'option analysis/key mismatch')
      if (q.type === 'Sentence Placement') requireContent(analysis.typeSpecific.correctPosition === q.answer, 'placement analysis/key mismatch')
      if (q.type === 'Odd Sentence Out') requireContent(analysis.typeSpecific.oddSentence === q.answer, 'odd-sentence analysis/key mismatch')
      return { ...q, analysis }
    })
  }
  const snapshot = { dayNumber: day, title:c.title || null, sourceId: row.id, blocks }
  return { snapshot, source_revision: row.lock_token, source_hash: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex') }
}

export function publicQuestion(q) {
  return { id: q.id, type: q.type, mode: q.mode, text: q.text, context: q.context, options: q.options, sentences: q.sentences, sentenceToPlace: q.sentenceToPlace }
}
