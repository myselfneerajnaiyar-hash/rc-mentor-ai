import { INBOX_FILTERS } from "./config.js"
export function matchesView(message, { folder = "INBOX", filter = "ALL" } = {}) {
  if (folder === "TRASH" ? !message.deleted_at : message.deleted_at) return false
  if (folder === "INBOX" && message.archived_at || folder === "ARCHIVE" && !message.archived_at) return false
  if (filter === "UNREAD" && message.read_at) return false
  return !INBOX_FILTERS[filter] || INBOX_FILTERS[filter].includes(message.type)
}
export function reconcileMessages(messages, updated, view) {
  const changes = new Map(updated.map((row) => [row.id, row]))
  return messages.map((row) => changes.has(row.id) ? { ...row, ...changes.get(row.id) } : row).filter((row) => matchesView(row, view))
}
export function mergeMessages(current, incoming) {
  return [...new Map([...current, ...incoming].map((row) => [row.id, row])).values()]
}
export function reconcileDetail(active, updated) {
  if (!active) return null
  const patch = updated.find((row) => row.id === active.id)
  if (!patch) return active
  if (patch.deleted_at !== active.deleted_at || patch.archived_at !== active.archived_at) return null
  return { ...active, ...patch }
}
export function requestGate() {
  let version = 0, controller
  return {
    cancel() { version++; controller?.abort() },
    start() { this.cancel(); controller = new AbortController(); const current = version; return { signal: controller.signal, current: () => current === version } },
  }
}
export function publishInboxUpdate() {
  window.dispatchEvent(new Event("auctor:inbox-updated"))
  try { localStorage.setItem("auctor:inbox-updated", `${Date.now()}:${Math.random()}`) } catch { /* Storage may be disabled. Local refresh still works. */ }
}

// Undo only acknowledged, selected actions. Compare versions to avoid undoing a
// subsequent action in another tab. Automatic reads use the reader's Mark unread.
export function inboxUndo(action, result, { all = false } = {}) {
  const inverse = { read: "unread", unread: "read", archive: "unarchive", unarchive: "archive", delete: "restore", restore: "delete" }[action]
  const rows = result.updated || []
  if (!inverse || all || result.partial || !rows.length || rows.length > 5000) return null
  const version = rows[0].updated_at
  if (!version || rows.some(row => row.updated_at !== version)) return null
  return { action: inverse, ids: rows.map(row => row.id), ifUpdatedAt: version }
}
