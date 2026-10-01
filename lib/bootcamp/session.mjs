import { reportDetails } from './report.mjs'
import { BootCampError, LABELS, publicQuestion } from './content.mjs'

export const POLICY = { version: 1, correct: 1, incorrect: 0, skipped: 0, not_reached: 0, timed_out: 0, total: 25 }
export const OUTCOMES = ['correct', 'incorrect', 'skipped', 'not_reached', 'timed_out']
const iso = now => new Date(now).toISOString()
const assert = (condition, message, status = 409) => { if (!condition) throw new BootCampError(message, status) }
export function initialState(snapshot, now = Date.now()) {
  return { phase: 'mission', current_block: 0, status: 'in_progress', started_at: iso(now), completed_at: null, scoring_policy: POLICY, coaching: {}, report: null,
    blocks: snapshot.blocks.map((b, position) => ({ key: b.key, position, status: 'pending', started_at: null, deadline_at: null, finished_at: null, end_reason: null, current_question: 0, result: null, reviewed_at: null, commentary_seen_at: null,
      questions: b.questions.map(q => ({ source_question_id: q.id, response: null, presented_at: null, saved_at: null, active_ms: 0, outcome: null, points: null })) })) }
}
export function metrics(questions) {
  const counts = Object.fromEntries(OUTCOMES.map(k => [k, questions.filter(q => q.outcome === k).length]))
  const answered = counts.correct + counts.incorrect
  return { ...counts, score: counts.correct, total: questions.length, answered, accuracy: answered ? counts.correct / answered * 100 : 0, coverage: questions.length ? answered / questions.length * 100 : 0 }
}
export function expired(state, now) { const b = state.blocks[state.current_block]; return state.phase === 'activity' && b.deadline_at && now >= Date.parse(b.deadline_at) }
function finish(state, snapshot, now) {
  const b = state.blocks[state.current_block], source = snapshot.blocks[state.current_block]
  const timeout = !!b.deadline_at && now >= Date.parse(b.deadline_at)
  b.end_reason = timeout ? 'timeout' : 'submitted'
  b.finished_at = timeout ? b.deadline_at : iso(now)
  b.status = 'completed'
  b.questions.forEach((q, i) => {
    q.outcome = q.response !== null ? (JSON.stringify(q.response) === JSON.stringify(source.questions[i].answer) ? 'correct' : 'incorrect') : !q.presented_at ? 'not_reached' : timeout ? 'timed_out' : 'skipped'
    q.points = q.outcome === 'correct' ? 1 : 0
  })
  b.result = { ...metrics(b.questions), elapsed_seconds: Math.max(0, Math.round((Date.parse(b.finished_at) - Date.parse(b.started_at)) / 1000)) }
  state.phase = 'review'
}
export function validResponse(q, value) {
  if (value === null) return true
  if (q.mode === 'MCQ') return typeof value === 'string' && q.options.some(o => o.id === value)
  if (q.type === 'Para Jumble') return Array.isArray(value) && value.length > 0 && value.length <= 4 && new Set(value).size === value.length && value.every(n => Number.isInteger(n) && n >= 1 && n <= 4)
  return Number.isInteger(value) && value >= 1 && value <= (q.type === 'Odd Sentence Out' ? 5 : 4)
}

export function transition(original, snapshot, action, input = {}, now = Date.now()) {
  const s = structuredClone(original), b = s.blocks[s.current_block]
  if (expired(s, now)) {
    assert(action !== 'responses', 'Time is up. Your saved answers have been kept.')
    if(action==='expire'&&input.questionId) {
      const index=b.questions.findIndex(q=>q.source_question_id===input.questionId)
      if(index===b.current_question)b.questions[index].presented_at ||= iso(now)
    }
    finish(s, snapshot, now); return s
  }
  if (action === 'expire') return s
  if (action === 'block_start') {
    assert(s.phase === 'ready' && b.key === input.key && b.status === 'pending', 'Complete the current step first.')
    b.status = 'active'; b.started_at = iso(now)
    const seconds = snapshot.blocks[s.current_block].seconds
    b.deadline_at = seconds ? iso(now + seconds * 1000) : null
    s.phase = 'activity'
  } else if (action === 'responses') {
    assert(s.phase === 'activity' && b.key === input.key, 'This activity is no longer open.')
    const index = b.questions.findIndex(q => q.source_question_id === input.questionId)
    assert(index >= 0, 'Question does not belong to this block.', 400)
    const q = b.questions[index]
    if (input.presented === true) { q.presented_at ||= iso(now); b.current_question = index }
    if(input.nextQuestionId) {
      const nextIndex=b.questions.findIndex(question=>question.source_question_id===input.nextQuestionId)
      assert(nextIndex>=0&&nextIndex<=index+1,'Invalid next question.',400)
      b.current_question=nextIndex
      if(nextIndex===index+1)b.questions[nextIndex].presented_at ||= iso(now)
    }
    if (Object.hasOwn(input, 'response')) {
      assert(q.presented_at, 'Open the question before answering.', 400)
      assert(validResponse(snapshot.blocks[s.current_block].questions[index], input.response), 'Invalid answer format.', 400)
      q.response = input.response; q.saved_at = iso(now)
    }
    if (input.activeMs !== undefined) {
      const max = Math.max(0, now - Date.parse(b.started_at))
      assert(Number.isInteger(input.activeMs) && input.activeMs >= 0 && input.activeMs <= max + 1000, 'Invalid timing.', 400)
      q.active_ms = Math.max(q.active_ms, Math.min(input.activeMs, max))
    }
  } else if (action === 'finish') {
    assert(b.key === input.key, 'Wrong block.')
    if (b.status === 'completed') return s
    assert(s.phase === 'activity', 'Start this activity first.')
    if(input.questionId) {
      const index=b.questions.findIndex(q=>q.source_question_id===input.questionId)
      assert(index>=0&&index===b.current_question,'Question does not belong to the current position.',400)
      const q=b.questions[index]
      q.presented_at ||= iso(now)
      if(input.activeMs!==undefined) {
        const max=Math.max(0,now-Date.parse(b.started_at))
        assert(Number.isInteger(input.activeMs)&&input.activeMs>=0&&input.activeMs<=max+1000,'Invalid timing.',400)
        q.active_ms=Math.max(q.active_ms,Math.min(input.activeMs,max))
      }
    }
    finish(s, snapshot, now)
  } else if (action === 'advance') {
    assert(s.coaching[coachKey(s)] || s.phase === 'review', 'Read Birbal’s message before continuing.')
    if (s.phase === 'mission') s.phase = 'ready'
    else if (s.phase === 'review') { b.reviewed_at = iso(now); s.phase = 'commentary' }
    else if (s.phase === 'commentary') {
      b.commentary_seen_at = iso(now)
      if (s.current_block < 4) { s.current_block++; s.phase = 'ready' }
      else { s.phase = 'report'; s.status = 'completed'; s.completed_at = iso(now); s.report = buildReport(s, snapshot) }
    } else throw new BootCampError('This step cannot advance.')
  } else throw new BootCampError('Unknown action.', 400)
  return s
}
export function coachKey(state) {
  if (state.phase === 'mission') return 'mission:0'
  if (state.phase === 'report') return 'report:5'
  const b = state.blocks[state.current_block]
  return `${b.key}:${state.blocks.filter(x => x.status === 'completed').length}`
}
export function buildReport(state, snapshot) {
  const skills = {}
  state.blocks.forEach((b, i) => b.questions.forEach((q, n) => {
    const skill = snapshot.blocks[i].questions[n].analysis.primarySkill
    ;(skills[skill] ||= []).push(q)
  }))
  return { ...metrics(state.blocks.flatMap(b => b.questions)), elapsed_seconds: state.blocks.reduce((n, b) => n + b.result.elapsed_seconds, 0),
    skills: Object.entries(skills).map(([skill, rows]) => ({ skill, ...metrics(rows), questionIds: rows.map(q => q.source_question_id) })),
    blocks: state.blocks.map(b => ({ key: b.key, label: LABELS[b.key], ...b.result })) }
}

// Explicit allowlists: protected snapshots, keys and future activities never leave here.
export function publicState(record, now = Date.now()) {
  const { state: s, snapshot, id, revision } = record, b = s.blocks[s.current_block]
  const source = snapshot.blocks[s.current_block]
  const activity = s.phase === 'activity' ? { key: b.key, label: LABELS[b.key], passage: source.passage || null,
    deadline_at: b.deadline_at, started_at: b.started_at, current_question: b.current_question,
    questions: source.questions.map(publicQuestion), responses: b.questions.map(q => ({ questionId: q.source_question_id, response: q.response, presented_at: q.presented_at, active_ms: q.active_ms })) } : null
  return { id, revision, dayNumber: snapshot.dayNumber, phase: s.phase, status: s.status, currentBlock: b.key, blockLabel: LABELS[b.key], serverNow: iso(now),
    progress: s.blocks.map(x => ({ key: x.key, label: LABELS[x.key], completed: x.status === 'completed' })),
    seconds: source.seconds, activity, commentary: s.coaching[coachKey(s)] || null, report: s.phase === 'report' ? reportDetails(record,s.report || buildReport(s,snapshot)) : null }
}
export function reviewState(record, key) {
  const { state: s, snapshot } = record, index = s.blocks.findIndex(b => b.key === key), b = s.blocks[index]
  assert(b && b.status === 'completed' && index <= s.current_block, 'Review is not available yet.')
  const source = snapshot.blocks[index]
  return { key, label: LABELS[key], result: b.result, endReason: b.end_reason, passage: source.passage || null, passageAnalysis: source.passageAnalysis || null,
    questions: source.questions.map((q, i) => ({ ...publicQuestion(q), answer: q.answer, analysis: q.analysis, ...b.questions[i] })) }
}
