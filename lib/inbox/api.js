import { INBOX_FILTERS } from "./config.js"
import { applyInboxAction } from "./service.js"
import { InboxInputError, parseList, parseAction, encodeCursor, requireId } from "./validation.js"

const TABLE = "inbox_notifications"
const FIELDS = "id,type,source,title,preview,body,metadata,action_url,priority,read_at,archived_at,deleted_at,created_at"
function result({ data, error }) { if (error) throw error; return data || [] }
export async function unreadCount(db, userId, signal = AbortSignal.timeout(10000)) {
  const { count, error } = await db.from(TABLE).select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null).is("archived_at", null).is("deleted_at", null).abortSignal(signal)
  if (error) throw error
  return count || 0
}
export async function listInbox(db, userId, params) {
  const { filter, folder, search, pageSize, scope, cursor } = parseList(params)
  let query = db.from(TABLE).select(FIELDS).eq("user_id", userId)
  if (folder === "TRASH") query = query.not("deleted_at", "is", null)
  else {
    query = query.is("deleted_at", null)
    query = folder === "ARCHIVE" ? query.not("archived_at", "is", null) : query.is("archived_at", null)
  }
  if (filter === "UNREAD") query = query.is("read_at", null)
  else if (INBOX_FILTERS[filter]) query = query.in("type", INBOX_FILTERS[filter])
  if (search) query = query.textSearch("search_document", search, { type: "websearch", config: "english" })
  if (cursor) query = query.or(`priority.lt.${cursor.p},and(priority.eq.${cursor.p},created_at.lt.${cursor.t}),and(priority.eq.${cursor.p},created_at.eq.${cursor.t},id.lt.${cursor.id})`)
  const rows = result(await query.order("priority", { ascending: false }).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(pageSize + 1))
  const messages = rows.slice(0, pageSize)
  return { messages, unreadCount: await unreadCount(db, userId), hasMore: rows.length > pageSize, nextCursor: rows.length > pageSize ? encodeCursor(messages.at(-1), scope) : null }
}
export async function mutateInbox(db, userId, body, { signal = AbortSignal.timeout(40000) } = {}) {
  const { action, ids, all } = parseAction(body)
  const updated = []
  // Bound each request without discarding any selected IDs. Return partial success explicitly.
  let failure = null
  const changes = applyInboxAction({}, action)
  const bounded = (query) => {
    signal.throwIfAborted()
    return query.abortSignal(AbortSignal.any([signal, AbortSignal.timeout(10000)]))
  }
  try {
    for (let offset = 0; all || offset < ids.length; offset += 100) {
      let query = db.from(TABLE).update(changes).eq("user_id", userId)
      if (action !== "restore") query = query.is("deleted_at", null)
      else query = query.not("deleted_at", "is", null)
      if (action === "read") query = query.is("read_at", null)
      if (action === "unread") query = query.not("read_at", "is", null)
      if (all) {
        const next = result(await bounded(db.from(TABLE).select("id").eq("user_id", userId).is("deleted_at", null).is("archived_at", null).is("read_at", null).order("id", { ascending: true }).limit(100)))
        if (!next.length) break
        query = query.is("archived_at", null).is("read_at", null).in("id", next.map((row) => row.id))
      }
      else query = query.in("id", ids.slice(offset, offset + 100))
      const response = await bounded(query.select("id,read_at,archived_at,deleted_at"))
      if (response.error) { failure = "Some messages could not be updated. Refresh and retry."; break }
      updated.push(...(response.data || []))
      if (all && !response.data?.length) break
    }
    const current = [], missingIds = []
    if (!all) {
      for (let offset = 0; offset < ids.length; offset += 100) {
        current.push(...result(await bounded(db.from(TABLE).select("id,read_at,archived_at,deleted_at").eq("user_id", userId).in("id", ids.slice(offset, offset + 100)))))
      }
      const found = new Set(current.map((row) => row.id))
      missingIds.push(...ids.filter((id) => !found.has(id)))
    }
    return { current: all ? updated : current, missingIds, updated, unreadCount: await unreadCount(db, userId, AbortSignal.any([signal, AbortSignal.timeout(10000)])), partial: Boolean(failure), error: failure }
  } catch {
    // An aborted write may have committed. Report only acknowledged writes and
    // never classify IDs from an unfinished reconciliation as missing.
    return { current: updated, missingIds: [], updated, unreadCount: null, partial: true, refreshRequired: true, error: "Bulk action incomplete. Some changes may have been saved. Refresh before retrying." }
  }
}
export async function getInboxMessage(db, userId, id) {
  requireId(id)
  const { data, error } = await db.from(TABLE).select(FIELDS).eq("user_id", userId).eq("id", id).maybeSingle()
  if (error) throw error
  return data
}
// Injected dependencies allow tests to exercise the actual authenticated route behavior.
export function inboxHandlers({ db, authenticate, logger = console }) {
  const handle = (operation) => async (request, context) => {
    try {
      const identity = await authenticate(request)
      if (identity.error || !identity.user?.id) return Response.json({ error: "Authentication required" }, { status: 401 })
      const payload = await operation(request, identity.user.id, context)
      if (payload === null) return Response.json({ error: "Message not found" }, { status: 404 })
      return Response.json(payload, { headers: { "Cache-Control": "no-store" } })
    } catch (error) {
      if (error instanceof InboxInputError || error instanceof SyntaxError) return Response.json({ error: error.message }, { status: 400 })
      logger.error("Inbox request failed", { message: error?.message || String(error), code: error?.code })
      return Response.json({ error: "Unable to complete Inbox request" }, { status: 500 })
    }
  }
  return {
    GET: handle((request, id) => listInbox(db, id, new URL(request.url).searchParams)),
    PATCH: handle(async (request, id) => mutateInbox(db, id, await request.json())),
    detail: handle(async (_, id, context) => { const message = await getInboxMessage(db, id, context.params.id); return message ? { message, unreadCount: await unreadCount(db, id) } : null }),
    unread: handle(async (_, id) => ({ unreadCount: await unreadCount(db, id) })),
  }
}
