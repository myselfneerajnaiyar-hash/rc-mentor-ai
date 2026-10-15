let currentContext = { userId: null, value: {} }
const identifiedUserIds = new Set()

export function setBootCampAnalyticsContext(userId, context = {}) {
  currentContext = { userId, value: { ...context } }
}

export function getBootCampAnalyticsContext(userId) {
  return currentContext.userId === userId ? { ...currentContext.value } : {}
}

export function bootCampErrorCategory(error) {
  const status = Number(error?.status)
  if (status === 401) return 'authentication'
  if (status === 402 || status === 403) return 'entitlement'
  if (status === 409) return 'conflict'
  if (status >= 400 && status < 500) return 'request'
  if (status >= 500) return 'server'
  if (error?.name === 'TypeError' || /network|fetch|timeout/i.test(error?.message || '')) return 'network'
  return 'unknown'
}

export function createBootCampEventTracker({ getUserId, identify = () => {}, capture }) {
  const emitted = new Set()
  const pending = new Set()
  return async function track(event, { eventKey = event, userId: providedUserId, properties = {} } = {}) {
    if (emitted.has(eventKey) || pending.has(eventKey)) return false
    pending.add(eventKey)
    try {
      const userId = providedUserId || await getUserId()
      if (!userId) return false
      if (!identifiedUserIds.has(userId)) {
        identify(userId)
        identifiedUserIds.add(userId)
      }
      capture(event, { user_id: userId, ...properties })
      emitted.add(eventKey)
      return true
    } catch {
      // Analytics must never interrupt Boot Camp.
      return false
    } finally {
      pending.delete(eventKey)
    }
  }
}
