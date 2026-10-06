import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { adaptDay, BootCampError } from '@/lib/bootcamp/content.mjs'
import { actPreview, BOOTCAMP_PREVIEW_DAY, coachPreview, readPreview, reviewPreview, startPreview } from '@/lib/bootcamp/preview.mjs'

let publishedContent

async function publishedPreview() {
  if (publishedContent) return publishedContent
  const { data, error } = await supabaseAdmin
    .from('bootcamp_days')
    .select('id,day_number,document,lock_token,updated_at')
    .eq('day_number', BOOTCAMP_PREVIEW_DAY)
    .maybeSingle()
  if (error) throw new BootCampError('The public Boot Camp preview is temporarily unavailable.', 503)
  if (!data) throw new BootCampError('The public Boot Camp preview is not available yet.', 503)
  const adapted = adaptDay(data)
  publishedContent = { snapshot: adapted.snapshot, sourceRevision: adapted.source_revision || adapted.source_hash }
  return publishedContent
}

function home(attempt) {
  const status = attempt?.state?.status || attempt?.status || 'not_started'
  return {
    enrolled: false,
    currentDay: BOOTCAMP_PREVIEW_DAY,
    attempt: attempt || null,
    calendar: { today: false },
    days: [{ day: BOOTCAMP_PREVIEW_DAY, available: true, unlocked: true, accessible: true, status, state: status.toUpperCase(), isToday: false }],
  }
}

function json(value, attempt) {
  return Response.json({ value, attempt: attempt ?? null })
}

export async function POST(request) {
  try {
    const raw = await request.text()
    if (raw.length > 64000) throw new BootCampError('Preview request is too large.', 413)
    let input
    try { input = JSON.parse(raw) } catch { throw new BootCampError('Invalid preview request.', 400) }
    const path = new URL(input.path || '/', 'https://preview.local')
    const method = input.method || 'GET'
    const attempt = input.attempt || null
    const { snapshot, sourceRevision } = await publishedPreview()

    if (path.pathname === '/' && method === 'GET') {
      if (!attempt) return json(home(null), null)
      const result = readPreview(attempt, snapshot, sourceRevision)
      return json(home(result.value), result.attempt)
    }
    if (path.pathname === '/enroll' && method === 'POST') return json({ enrolled: false }, attempt)
    if (path.pathname === `/days/${BOOTCAMP_PREVIEW_DAY}/start` && method === 'POST') {
      if (attempt) {
        const result = readPreview(attempt, snapshot, sourceRevision)
        return json(result.value, result.attempt)
      }
      const result = startPreview(snapshot, sourceRevision)
      return json(result.value, result.attempt)
    }

    const match = path.pathname.match(/^\/attempts\/([0-9a-f-]{36})(?:\/blocks\/([a-z0-9]+)\/(review|start|responses|finish)|\/(coach|advance))?$/i)
    if (!match || !attempt || attempt.id !== match[1]) throw new BootCampError('Preview session not found. Reload to start a fresh preview.', 404)
    const [, , blockKey, blockOperation, attemptOperation] = match
    const operation = blockOperation || attemptOperation

    if (operation === 'review' && method === 'GET') {
      const result = reviewPreview(attempt, snapshot, sourceRevision, blockKey)
      return json(result.value, result.attempt)
    }
    if (operation === 'coach' && method === 'POST') {
      const result = coachPreview(attempt, snapshot, sourceRevision)
      return json(result.value, result.attempt)
    }
    if (!operation && method === 'GET') {
      const result = readPreview(attempt, snapshot, sourceRevision, Date.now(), path.searchParams.get('presentedQuestionId'))
      return json(result.value, result.attempt)
    }

    const body = input.body || {}
    if (operation === 'advance' && method === 'POST') {
      const result = actPreview(attempt, snapshot, sourceRevision, 'advance', body)
      return json(result.value, result.attempt)
    }
    if (operation === 'start' && method === 'POST') {
      const result = actPreview(attempt, snapshot, sourceRevision, 'block_start', { ...body, key: blockKey })
      return json(result.value, result.attempt)
    }
    if (operation === 'responses' && method === 'PATCH') {
      const result = actPreview(attempt, snapshot, sourceRevision, 'responses', { ...body, key: blockKey })
      return json(result.value, result.attempt)
    }
    if (operation === 'finish' && method === 'POST') {
      const result = actPreview(attempt, snapshot, sourceRevision, 'finish', { ...body, key: blockKey })
      return json(result.value, result.attempt)
    }
    throw new BootCampError('Preview action not found.', 404)
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500
    return Response.json({ error: status === 500 ? 'The Boot Camp preview is temporarily unavailable.' : error.message }, { status })
  }
}
