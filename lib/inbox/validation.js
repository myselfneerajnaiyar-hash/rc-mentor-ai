import { INBOX_FILTERS } from "./config.js"

export class InboxInputError extends Error {}
export const isUuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
export function requireId(value) {
  if (!isUuid(value)) throw new InboxInputError("Invalid notification ID")
  return value
}
export function internalPath(value) {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(value)) throw new InboxInputError("actionUrl must be an internal path")
  let decoded
  try { decoded = decodeURIComponent(value) } catch { throw new InboxInputError("Invalid internal path encoding") }
  if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith("//") || /%[0-9a-f]{2}/i.test(decoded)) throw new InboxInputError("actionUrl must be an internal path")
  const url = new URL(value, "https://inbox.invalid")
  const decodedUrl = new URL(decoded, "https://inbox.invalid")
  if ([url, decodedUrl].some((candidate) => candidate.origin !== "https://inbox.invalid" || candidate.pathname.startsWith("//") || /^\/(?:api|_next)(?:\/|$)/.test(candidate.pathname))) throw new InboxInputError("actionUrl must be an internal path")
  return value
}
export function encodeCursor(row, scope) {
  return Buffer.from(JSON.stringify({ p: row.priority, t: row.created_at, id: row.id, scope })).toString("base64url")
}
export function parseList(params) {
  const filter = params.get("filter") || "ALL"
  const folder = params.get("folder") || "INBOX"
  const search = (params.get("search") || "").trim()
  const pageSize = Number(params.get("pageSize") || 20)
  if (!["ALL", "UNREAD", ...Object.keys(INBOX_FILTERS)].includes(filter)) throw new InboxInputError("Invalid category")
  if (!["INBOX", "ARCHIVE", "TRASH"].includes(folder)) throw new InboxInputError("Invalid folder")
  if (search.length > 120 || /[\u0000-\u001f\u007f]/.test(search)) throw new InboxInputError("Invalid search query")
  if (!/^\d+$/.test(params.get("pageSize") || "20") || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 || params.has("page")) throw new InboxInputError("Invalid pagination")
  const scope = JSON.stringify([folder, filter, search])
  let cursor = null
  if (params.has("cursor")) {
    const raw = params.get("cursor")
    try {
      if (!raw || raw.length > 1500 || !/^[\w-]+$/.test(raw)) throw new Error()
      cursor = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"))
      if (!Number.isInteger(cursor.p) || cursor.p < 0 || cursor.p > 10 || !isUuid(cursor.id) || typeof cursor.t !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(cursor.t) || !Number.isFinite(Date.parse(cursor.t)) || new Date(cursor.t).toISOString().slice(0, 10) !== cursor.t.slice(0, 10) || cursor.scope !== scope) throw new Error()
    } catch { throw new InboxInputError("Invalid pagination cursor") }
  }
  return { filter, folder, search, pageSize, scope, cursor }
}
export function parseAction(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["action", "ids", "all", "ifUpdatedAt"].includes(key))) throw new InboxInputError("Invalid action payload")
  if (!["read", "unread", "archive", "delete", "restore", "unarchive"].includes(body.action)) throw new InboxInputError("Unsupported action")
  const ifUpdatedAt = body.ifUpdatedAt ?? null
  if (body.ifUpdatedAt !== undefined && (typeof ifUpdatedAt !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(ifUpdatedAt) || !Number.isFinite(Date.parse(ifUpdatedAt)))) throw new InboxInputError("Invalid action version")
  if (body.all === true) {
    if (body.action !== "read" || body.ids !== undefined || ifUpdatedAt) throw new InboxInputError("Only mark all read supports all")
    return { action: body.action, all: true, ids: [] }
  }
  if (body.all !== undefined && body.all !== false) throw new InboxInputError("Invalid all flag")
  if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 5000) throw new InboxInputError("Select between 1 and 5000 messages")
  return { action: body.action, all: false, ids: [...new Set(body.ids.map(requireId))], ifUpdatedAt }
}
