import { inboxQuery } from "./request.js"
import { INBOX_TYPES, PROACTIVE_DAILY_TYPES } from "./config.js"
import { internalPath, requireId } from "./validation.js"

const TABLE = "inbox_notifications"

export function normalizeNotification(input) {
  requireId(input?.userId)
  if (!INBOX_TYPES.includes(input.type)) throw new Error("Unsupported inbox notification type")
  const title = String(input.title || "").trim()
  const body = String(input.body || "").trim()
  if (!title || title.length > 180) throw new Error("title must contain 1 to 180 characters")
  if (!body || body.length > 10000) throw new Error("body must contain 1 to 10000 characters")
  const actionUrl = input.actionUrl ? String(input.actionUrl) : null
  if (actionUrl) internalPath(actionUrl)
  if (input.idempotencyKey != null && (typeof input.idempotencyKey !== "string" || !input.idempotencyKey.length || input.idempotencyKey.length > 180)) throw new Error("Invalid idempotency key")
  const priority = input.priority ?? 0
  if (!Number.isInteger(priority) || priority < 0 || priority > 10) throw new Error("priority must be an integer from 0 to 10")
  const proactiveDate = input.proactiveDate ?? null
  if (PROACTIVE_DAILY_TYPES.has(input.type) && !proactiveDate) throw new Error("Proactive messages require a calendar date")
  if (proactiveDate && (!/^\d{4}-\d{2}-\d{2}$/.test(proactiveDate) || !Number.isFinite(Date.parse(proactiveDate)) || new Date(proactiveDate).toISOString().slice(0, 10) !== proactiveDate)) throw new Error("Invalid proactive date")
  if (input.ruleKey != null && (typeof input.ruleKey !== "string" || !input.ruleKey.length || input.ruleKey.length > 180)) throw new Error("Invalid rule key")
  return {
    user_id: input.userId,
    proactive_date: proactiveDate,
    rule_key: input.ruleKey || null,
    type: input.type,
    source: String(input.source || "Auctor").trim().slice(0, 80) || "Auctor",
    title,
    preview: String(input.preview || "").trim().slice(0, 320),
    body,
    metadata: input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {},
    action_url: actionUrl,
    priority: priority,
    idempotency_key: input.idempotencyKey ? String(input.idempotencyKey).slice(0, 180) : null,
  }
}

export async function createInboxNotification(db, input, { signal } = {}) {
  const row = normalizeNotification(input)
  const query = row.idempotency_key
    ? db.from(TABLE).upsert(row, { onConflict: "user_id,idempotency_key", ignoreDuplicates: true })
    : db.from(TABLE).insert(row)
  const { data, error } = await inboxQuery(query.select().maybeSingle(), { signal, timeoutMs: 15000 })
  if (error?.code === "23505") return null
  if (error) throw error
  return data || null
}

export function dailyIdempotencyKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("dateKey must use YYYY-MM-DD")
  return `daily:${dateKey}`
}

export { chooseDailyNotification } from "./rules.js"

export function applyInboxAction(row, action, now = new Date().toISOString()) {
  if (action === "read") return { read_at: row.read_at || now, updated_at: now }
  if (action === "unread") return { read_at: null, updated_at: now }
  if (action === "archive") return { archived_at: now, updated_at: now }
  if (action === "delete") return { deleted_at: now, updated_at: now }
  if (action === "restore") return { deleted_at: null, updated_at: now }
  if (action === "unarchive") return { archived_at: null, updated_at: now }
  throw new Error("Unsupported inbox action")
}

