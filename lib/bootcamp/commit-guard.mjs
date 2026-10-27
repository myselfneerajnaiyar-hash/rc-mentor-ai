const inFlight = new Map()

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function bootCampCommitKey(userId, path, method, body) {
  if (!['POST', 'PATCH'].includes(String(method || 'GET').toUpperCase()) || !Number.isInteger(body?.revision)) return null
  const match = String(path).match(/^\/attempts\/([0-9a-f-]{36})(?:\/blocks\/([a-z0-9]+)\/(start|responses|finish)|\/(advance))$/i)
  if (!match) return null
  const action = match[3] || match[4]
  return `${userId}:${match[1]}:${action}:${body.revision}:${stable(body)}`
}

export function dedupeBootCampCommit(key, operation) {
  if (!key) return operation()
  const existing = inFlight.get(key)
  if (existing) return existing
  const pending = Promise.resolve().then(operation)
  inFlight.set(key, pending)
  pending.finally(() => {
    if (inFlight.get(key) === pending) inFlight.delete(key)
  }).catch(() => {})
  return pending
}
