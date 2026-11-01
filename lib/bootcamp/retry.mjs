const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 502, 503, 504])
const RETRYABLE_OPERATIONS = new Set(['GET:/', 'POST:/enroll'])

export function isBootCampRetrySafe(method, path) {
  const verb = String(method || 'GET').toUpperCase()
  const route = String(path || '').split(/[?#]/, 1)[0] || '/'
  return RETRYABLE_OPERATIONS.has(`${verb}:${route}`)
    || (verb === 'POST' && /^\/days\/\d+\/start$/.test(route))
}

export function isBootCampTransientError(error) {
  if (error?.retryable === true) return true
  const status = Number(error?.status)
  if (Number.isFinite(status) && status > 0) return RETRYABLE_STATUS_CODES.has(status)
  return error?.name === 'TypeError' || /network|fetch|timeout|connection/i.test(String(error?.message || ''))
}

export async function retryBootCampOperation(operation, {
  method,
  path,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  maxRetries = 2,
} = {}) {
  const canRetry = isBootCampRetrySafe(method, path)
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (!canRetry || attempt >= maxRetries || !isBootCampTransientError(error)) throw error
      await wait(200 * (2 ** attempt))
    }
  }
}
