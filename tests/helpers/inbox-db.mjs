import { randomUUID } from "node:crypto"
export const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
export class MemoryDb {
  constructor(tables = {}) { this.tables = structuredClone(tables); this.calls = []; this.fail = null }
  from(table) { return new Query(this, table) }
}
class Query {
  constructor(db, table) { this.db = db; this.table = table; this.filters = []; this.orders = []; this.method = "select"; this.start = 0; this.end = Infinity; this.head = false }
  abortSignal(signal) { this.signal = signal; return this }
  select(fields = "*", options = {}) { this.fields = fields; this.head = options.head; return this }
  update(patch) { this.method = "update"; this.patch = patch; return this }
  insert(row) { this.method = "insert"; this.input = row; return this }
  upsert(row, options) { this.method = "upsert"; this.input = row; this.options = options; return this }
  eq(key, value) { this.filters.push((row) => row[key] === value); return this }
  is(key, value) { this.filters.push((row) => (row[key] ?? null) === value); return this }
  not(key, _, value) { this.filters.push((row) => (row[key] ?? null) !== value); return this }
  in(key, values) { this.filters.push((row) => values.includes(row[key])); return this }
  gte(key, value) { this.filters.push((row) => row[key] != null && row[key] >= value); return this }
  gt(key, value) { this.filters.push((row) => row[key] > value); return this }
  lt(key, value) { this.filters.push((row) => row[key] < value); return this }
  order(key, options) { this.orders.push([key, options.ascending]); return this }
  limit(n) { this.end = this.start + n; return this }
  range(start, end) { this.start = start; this.end = end + 1; return this }
  textSearch(_, query) { this.search = query; this.filters.push((row) => [row.title, row.preview, row.body, row.source].join(" ").toLowerCase().includes(query.toLowerCase())); return this }
  or(expression) {
    this.expression = expression
    const match = expression.match(/^priority\.lt\.(\d+),and\(priority\.eq\.\d+,created_at\.lt\.(.+?)\),and\(priority\.eq\.\d+,created_at\.eq\.(.+?),id\.lt\.([0-9a-f-]+)\)$/)
    if (!match) throw new Error(`Invalid cursor expression: ${expression}`)
    const [, priority, time, , id] = match
    this.filters.push((row) => row.priority < Number(priority) || row.priority === Number(priority) && (row.created_at < time || row.created_at === time && row.id < id))
    return this
  }
  maybeSingle() { this.singleRow = true; return this }
  single() { this.singleRow = true; return this }
  then(resolve, reject) { return Promise.resolve().then(() => this.execute()).then(resolve, reject) }
  execute() {
    this.db.calls.push(this)
    const failure = this.db.fail?.(this)
    if (failure) return { data: null, error: failure, count: null }
    const table = this.db.tables[this.table] ||= []
    let rows
    if (this.method === "insert" || this.method === "upsert") {
      const input = this.input
      const duplicate = table.find((row) => row.user_id === input.user_id && ((input.idempotency_key && row.idempotency_key === input.idempotency_key) || (input.proactive_date && row.proactive_date === input.proactive_date) || (input.rule_key && row.rule_key === input.rule_key)))
      if (duplicate) return this.method === "upsert" && duplicate.idempotency_key === input.idempotency_key ? { data: null, error: null } : { data: null, error: { code: "23505" } }
      const row = { id: randomUUID(), created_at: "2026-09-13T02:30:00.000Z", read_at: null, archived_at: null, deleted_at: null, ...input }
      table.push(row); rows = [row]
    } else {
      rows = table.filter((row) => this.filters.every((filter) => filter(row)))
      for (const [key, asc] of [...this.orders].reverse()) rows.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (asc ? 1 : -1))
      if (this.method === "update") rows.forEach((row) => Object.assign(row, this.patch))
    }
    const count = rows.length
    rows = rows.slice(this.start, this.end)
    const data = this.head ? null : this.singleRow ? structuredClone(rows[0] || null) : structuredClone(rows)
    return { data, count, error: null }
  }
}
export function message(n, overrides = {}) { return { id: uid(n), user_id: uid(9000), type: "SYSTEM", source: "Auctor", title: `Message ${n}`, preview: "Study today", body: "Saved message", metadata: {}, priority: 2, created_at: "2026-09-12T04:00:00.000Z", read_at: null, archived_at: null, deleted_at: null, ...overrides } }
