'use client'

const STORAGE_KEY = 'auctor-bootcamp-day-one-preview'

function savedAttempt() {
  try { return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}

export async function bootcampPreviewRequest(path = '', method = 'GET', body) {
  const attempt = savedAttempt()
  const response = await fetch('/api/bootcamp/preview', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method, body: body || {}, attempt }),
  })
  const result = await response.json()
  if (!response.ok) {
    if (response.status === 409) { try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* A stale preview is disposable. */ } }
    const error = new Error(result.error || 'The preview could not be loaded. Please retry.')
    error.status = response.status
    throw error
  }
  try {
    if (result.attempt) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result.attempt))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* Preview progress is optional and never touches a student record. */ }
  return result.value
}
