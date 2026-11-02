import { BootCampError, BLOCK_KEYS } from './content.mjs'

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' }
const uuid = value => /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value || '')
const phases = new Set(['mission', 'ready', 'activity', 'review', 'commentary', 'report'])
const blockStatuses = new Set(['pending', 'active', 'completed'])
const operations = new Set(['responses', 'finish', 'block_start', 'advance', 'chat', 'analytics', 'leaderboard', 'home', 'enroll', 'start', 'get', 'review', 'coach'])
function safeConflictDiagnostics(operation, params, error) {
  const details = error?.conflictDetails || {}
  const state = details.attemptState || {}
  const code = /^[a-z0-9_]{1,48}$/.test(String(error?.code || '')) ? error.code : 'conflict'
  return {
    operation: operations.has(operation) ? operation : 'other',
    block: BLOCK_KEYS.includes(params.key) ? params.key : (BLOCK_KEYS.includes(state.currentBlock) ? state.currentBlock : 'unknown'),
    attempt_state: {
      phase: phases.has(state.phase) ? state.phase : 'unknown',
      block_status: blockStatuses.has(state.blockStatus) ? state.blockStatus : 'unknown',
      current_block: BLOCK_KEYS.includes(state.currentBlock) ? state.currentBlock : 'unknown',
    },
    expected_state: details.expectedState === 'same_revision_active_block' || details.expectedState === 'phase_activity_block_active' ? details.expectedState : 'unknown',
    conflict_code: code,
  }
}
export function createHandler(service, authenticate) {
  return async function handle(request, operation, params = {}) {
    try {
      const user = await authenticate(request)
      if (!user) throw new BootCampError('Sign in to continue Boot Camp.',401)
      const requestService = typeof service === 'function' ? service(user, request) : service
      if (params.id && !uuid(params.id)) throw new BootCampError('Invalid session.',400)
      if (params.key && !BLOCK_KEYS.includes(params.key)) throw new BootCampError('Invalid block.',400)
      let input = {}
      if (['responses','finish','block_start','advance','chat'].includes(operation)) {
        const raw = await request.text()
        if (raw.length > (operation === 'chat' ? 52000 : 4096)) throw new BootCampError('Request too large.',413)
        try { input = JSON.parse(raw) } catch { throw new BootCampError('Invalid request.',400) }
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BootCampError('Invalid request.',400)
      }
      let value
      if (operation === 'chat') value = await requestService.chat(user.id,input)
      else if (operation === 'analytics') value = await requestService.getBootCampOverallAnalytics(user.id)
      else if (operation === 'leaderboard') value = await requestService.getBootCampLeaderboard(user.id,new URL(request.url).searchParams.get('mode') || 'daily')
      else if (operation === 'home') value = await requestService.home(user.id,new URL(request.url).searchParams.get('day'))
      else if (operation === 'enroll') value = await requestService.enroll(user.id)
      else if (operation === 'start') value = await requestService.start(user.id,params.day ?? 1)
      else if (operation === 'get') value = await requestService.get(user.id,params.id,new URL(request.url).searchParams.get('presentedQuestionId'))
      else if (operation === 'review') value = await requestService.review(user.id,params.id,params.key)
      else if (operation === 'coach') value = await requestService.coach(user.id,params.id)
      else value = await requestService.act(user.id,params.id,operation,{ ...input, key: params.key })
      return new Response(JSON.stringify(value),{ headers })
    } catch (e) {
      const status = e instanceof BootCampError ? e.status : 500
      const diagnostics = status === 409 ? safeConflictDiagnostics(operation, params, e) : null
      if (diagnostics) console.warn('[bootcamp] PATCH_CONFLICT', diagnostics)
      return new Response(JSON.stringify({
        error: e instanceof BootCampError ? e.message : 'Boot Camp is temporarily unavailable. Please try again.',
        ...(e instanceof BootCampError && e.code ? { code: e.code } : {}),
        ...(diagnostics || {}),
      }),{ status, headers })
    }
  }
}
