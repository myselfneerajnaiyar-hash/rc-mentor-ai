// Bound session, network and response-body waits, including clients that ignore abort.
export class InboxTimeoutError extends Error {
  constructor() { super("Inbox request timed out. Please try again."); this.name = "InboxTimeoutError" }
}
export async function withInboxDeadline(operation, { signal, timeoutMs = 20000 } = {}) {
  const controller = new AbortController()
  const forward = () => controller.abort(signal.reason)
  if (signal?.aborted) forward()
  else signal?.addEventListener("abort", forward, { once: true })
  const timer = setTimeout(() => controller.abort(new InboxTimeoutError()), timeoutMs)
  let onAbort
  try {
    controller.signal.throwIfAborted()
    const interrupted = new Promise((_, reject) => {
      onAbort = () => reject(controller.signal.reason)
      controller.signal.addEventListener("abort", onAbort, { once: true })
    })
    return await Promise.race([Promise.resolve().then(() => {
      controller.signal.throwIfAborted()
      return operation(controller.signal)
    }), interrupted])
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", forward)
    if (onAbort) controller.signal.removeEventListener("abort", onAbort)
  }
}

export function createInboxRequest(getSession, fetcher = fetch, { sessionTimeoutMs = 10000, readTimeoutMs = 25000, writeTimeoutMs = 55000 } = {}) {
  return (path, options = {}) => withInboxDeadline(async (signal) => {
    const { data } = await withInboxDeadline(() => getSession(), { signal, timeoutMs: sessionTimeoutMs })
    if (!data.session?.access_token) {
      const error = new Error("Please sign in again"); error.status = 401; throw error
    }
    signal.throwIfAborted()
    const response = await fetcher(path, { ...options, signal, cache: "no-store", headers: { "Content-Type": "application/json", ...options.headers, Authorization: "Bearer " + data.session.access_token } })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload) {
      const error = new Error(payload?.error || "Inbox request failed"); error.status = response.status; throw error
    }
    return payload
  }, { signal: options.signal, timeoutMs: options.method === "PATCH" ? writeTimeoutMs : readTimeoutMs })
}

export function inboxQuery(query, { signal, timeoutMs = 10000 } = {}) {
  return withInboxDeadline((boundedSignal) => query.abortSignal(boundedSignal), { signal, timeoutMs })
}
