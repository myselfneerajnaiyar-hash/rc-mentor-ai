"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Archive, ArrowLeft, Bell, BookOpen, Check, CheckCheck, ChevronRight,
  Clock3, Gift, Inbox, Loader2, Mail, MailOpen, Search, Sparkles,
  Target, Trash2, Trophy, X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useTenant } from "@/components/providers/TenantProvider"
import TenantLogo from "@/components/tenant/TenantLogo"
import styles from "./inbox.module.css"
import { createInboxRequest } from "@/lib/inbox/request"
import { internalPath } from "@/lib/inbox/validation"
import { mergeMessages, reconcileMessages, reconcileDetail, requestGate, publishInboxUpdate, inboxUndo } from "@/lib/inbox/state"

const FILTERS = ["ALL", "UNREAD", "STUDY", "PROGRESS", "ACHIEVEMENTS", "REMINDERS", "OFFERS"]
const TYPE_DETAILS = {
  STUDY_REMINDER: [BookOpen, "Study"], DAILY_RECOMMENDATION: [Target, "Study"], PERFORMANCE_UPDATE: [Sparkles, "Progress"],
  PROGRESS: [Sparkles, "Progress"], STREAK: [Sparkles, "Progress"], ACHIEVEMENT: [Trophy, "Achievement"],
  MILESTONE: [Trophy, "Milestone"], INACTIVITY: [Clock3, "Reminder"], EXAM_PREP: [BookOpen, "Study"],
  FEATURE_UPDATE: [Sparkles, "Update"], ACCOUNT: [Mail, "Account"], OFFER: [Gift, "Offer"], TRIAL: [Clock3, "Trial"], SYSTEM: [Bell, "System"],
}

const api = createInboxRequest(() => supabase.auth.getSession())

export default function InboxApp() {
  const router = useRouter()
  const { branding } = useTenant()
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState("ALL")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [searchPending, setSearchPending] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [folder, setFolder] = useState("INBOX")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const mutationLock = useRef(false)
  const mutationController = useRef(null)
  const listGate = useRef(requestGate())
  const detailGate = useRef(requestGate())
  const mounted = useRef(true)
  const [hasMore, setHasMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => { if (searchInput.trim() === search) { if (searchPending) load() } else setSearch(searchInput.trim()); setSearchPending(false) }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filter, folder])


  const load = useCallback(async ({ nextCursor = null, append = false } = {}) => {
    const ticket = listGate.current.start()
    append ? setLoadingMore(true) : setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ pageSize: "20", filter, folder, search })
      if (nextCursor) params.set("cursor", nextCursor)
      const result = await api(`/api/inbox?${params}`, { signal: ticket.signal })
      if (!ticket.current() || !mounted.current) return
      setMessages((current) => append ? mergeMessages(current, result.messages) : result.messages)
      if (Number.isInteger(result.unreadCount)) setUnreadCount(result.unreadCount)
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
      if (!append) setSelected(new Set())
    } catch (loadError) {
      if (ticket.current() && mounted.current) setError(loadError.message)
    } finally {
      if (ticket.current() && mounted.current) { setLoading(false); setLoadingMore(false) }
    }
  }, [filter, folder, search])
  useEffect(() => { load(); return () => listGate.current.cancel() }, [load])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; mutationController.current?.abort(); listGate.current.cancel(); detailGate.current.cancel() } }, [])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible" && !mutationLock.current) { detailGate.current.cancel(); setActive(null); load() } }
    const storage = (event) => { if (event.key === "auctor:inbox-updated") refresh() }
    window.addEventListener("focus", refresh); window.addEventListener("storage", storage)
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", storage) }
  }, [load])
  const closeDetail = useCallback(() => { detailGate.current.cancel(); setActive(null) }, [])
  const changeView = (nextFilter, nextFolder = folder) => {
    if (mutationLock.current) return
    if (nextFilter === filter && nextFolder === folder) { load(); return }
    listGate.current.cancel(); closeDetail(); setMessages([]); setSelected(new Set()); setLoading(true)
    setFilter(nextFilter); setFolder(nextFolder)
  }
  const allVisibleSelected = messages.length > 0 && messages.every((message) => selected.has(message.id))
  const selectedCount = selected.size
  const toggle = (id) => { if (!mutationLock.current) setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next }) }
  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(messages.map((message) => message.id)))
  const reconcile = (result) => {
    setMessages((current) => reconcileMessages(current.filter((row) => !result.missingIds?.includes(row.id)), result.current || result.updated, { folder, filter }))
    setActive((current) => result.missingIds?.includes(current?.id) ? null : reconcileDetail(current, result.current || result.updated))
    if (Number.isInteger(result.unreadCount)) setUnreadCount(result.unreadCount)
    setSelected(new Set())
    publishInboxUpdate()
    if (result.partial) setError(result.error)
  }
  const act = async (action, ids = [...selected], all = false, ifUpdatedAt = null) => {
    if (mutationLock.current || searchPending || (!all && !ids.length)) return
    mutationController.current = new AbortController()
    mutationLock.current = true; setBusy(true); setError(""); setNotice(null)
    detailGate.current.cancel(); setActive((current) => current?.loading ? null : current); listGate.current.cancel(); setLoading(false); setLoadingMore(false)
    try {
      const result = await api("/api/inbox", { method: "PATCH", signal: mutationController.current.signal, body: JSON.stringify(all ? { action, all: true } : { action, ids, ...(ifUpdatedAt ? { ifUpdatedAt } : {}) }) })
      if (!mounted.current) return
      reconcile(result)
      setNotice(result.partial ? { text: result.error } : result.updated.length ? {
        text: `${result.updated.length} message${result.updated.length === 1 ? "" : "s"} updated${all ? ". Mark all read cannot be undone; use Mark unread on selected messages." : ""}`,
        undo: ifUpdatedAt ? null : inboxUndo(action, result, { all }),
      } : { text: "No messages changed. Refresh to see the latest state." })
      if (ifUpdatedAt || action === "restore" || action === "unarchive" || (action === "unread" && filter === "UNREAD") || result.partial) { await load(); if (result.partial) setError(result.error) }
    } catch (actionError) {
      if (mounted.current) { closeDetail(); await load(); setError("Bulk action incomplete. Some changes may have been saved. Refresh before retrying.") }
    } finally { mutationLock.current = false; if (mounted.current) setBusy(false) }
  }
  const markAllRead = () => act("read", [], true)
  const openMessage = async (message) => {
    if (mutationLock.current || searchPending) return
    const ticket = detailGate.current.start()
    setActive({ ...message, loading: true }); setError("")
    try {
      const result = await api(`/api/inbox/${message.id}`, { signal: ticket.signal })
      if (!ticket.current() || !mounted.current) return
      setActive(result.message)
      setMessages((current) => reconcileMessages(current, [result.message], { folder, filter }))
      if (Number.isInteger(result.unreadCount)) setUnreadCount(result.unreadCount)
      if (!result.message.read_at && !result.message.deleted_at) {
        mutationController.current = new AbortController()
        mutationLock.current = true; setBusy(true); listGate.current.cancel(); setLoading(false); setLoadingMore(false)
        try {
          const changed = await api("/api/inbox", { method: "PATCH", signal: mutationController.current.signal, body: JSON.stringify({ action: "read", ids: [message.id] }) })
          if (mounted.current) reconcile(changed)
        } finally { mutationLock.current = false; if (mounted.current) setBusy(false) }
      }
    } catch (openError) { if (ticket.current() && mounted.current) { setError(openError.message); setActive(null) } }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button className={styles.brand} onClick={() => router.push("/")} aria-label="Back to Auctor home"><TenantLogo className={styles.logo} /><span>{branding.brandName}</span></button>
        <button className={styles.mobileHome} onClick={() => router.push("/")}><ArrowLeft size={18} /> Home</button>
      </header>
      <section className={styles.workspace}>
        <div className={styles.heading}>
          <div><p className={styles.eyebrow}>Your Auctor</p><h1>{label(folder)}</h1><p className={styles.subtitle}>{unreadCount ? `${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"}` : "You're all caught up"}</p></div>
          <div className={styles.search}><Search size={18} /><input value={searchInput} disabled={busy} maxLength={120} onChange={(event) => { listGate.current.cancel(); setSearchPending(true); setSearchInput(event.target.value) }} placeholder="Search your inbox" aria-label="Search inbox" />{searchInput && <button disabled={busy} onClick={() => { listGate.current.cancel(); setLoading(true); setSearchInput("") }} aria-label="Clear search"><X size={16} /></button>}</div>
        </div>

        <nav className={styles.folders} aria-label="Message folders">{["INBOX", "ARCHIVE", "TRASH"].map((item) => <button key={item} disabled={busy} aria-current={folder === item ? "page" : undefined} onClick={() => changeView("ALL", item)}>{label(item)}</button>)}<button disabled={busy || loading || searchPending} onClick={() => load()}>Refresh</button></nav>
        <div className={styles.inboxFrame}>
          <div className={styles.filters} role="tablist" aria-label="Inbox filters">
            {FILTERS.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? styles.activeFilter : ""} disabled={busy} onClick={() => changeView(item)}>{label(item)}{item === "UNREAD" && unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>)}
          </div>


          <fieldset className={styles.toolbar} disabled={busy || loading} aria-busy={busy}>
            <button className={styles.selectAll} onClick={toggleAll} role="checkbox" aria-checked={allVisibleSelected} aria-label="Select all visible messages"><span className={allVisibleSelected ? styles.checkboxChecked : styles.checkbox}>{allVisibleSelected && <Check size={13} />}</span><span>{selectedCount ? `${selectedCount} selected` : "Select all"}</span></button>
            {selectedCount ? <div className={styles.toolbarActions}>
              {folder === "INBOX" && <ToolButton icon={Archive} label="Archive" onClick={() => act("archive")} />}
              {folder === "ARCHIVE" && <ToolButton icon={Inbox} label="Move to Inbox" onClick={() => act("unarchive")} />}
              {folder === "TRASH" ? <ToolButton icon={Inbox} label="Restore" onClick={() => act("restore")} /> : <><ToolButton icon={MailOpen} label="Mark read" onClick={() => act("read")} /><ToolButton icon={Mail} label="Mark unread" onClick={() => act("unread")} /><ToolButton icon={Trash2} label="Delete" danger onClick={() => act("delete")} /></>}
            </div> : <button className={styles.markAll} onClick={markAllRead} disabled={!unreadCount || busy}><CheckCheck size={17} /> Mark all as read</button>}
          </fieldset>
          {notice && <div className={styles.notice} role="status">{notice.text}{notice.undo && <button disabled={busy} onClick={() => { const undo = notice.undo; setNotice(null); act(undo.action, undo.ids, false, undo.ifUpdatedAt) }}>Undo</button>}<button aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={14} /></button></div>}

          {error && <div className={styles.error} role="alert">{error}<button disabled={busy} onClick={() => load()}>Try again</button></div>}
          {loading || searchPending ? <LoadingRows /> : messages.length ? <div className={styles.rows}>{messages.map((message) => <InboxRow key={message.id} message={message} selected={selected.has(message.id)} onToggle={toggle} onOpen={openMessage} disabled={busy || loading || searchPending} />)}</div> : <EmptyState search={search} filter={filter} folder={folder} />}
          {hasMore && !loading && <div className={styles.loadMore}><button onClick={() => load({ nextCursor: cursor, append: true })} disabled={loadingMore || busy || searchPending}>{loadingMore ? <Loader2 className={styles.spin} size={18} /> : null}{loadingMore ? "Loading" : "Load older messages"}</button></div>}
        </div>
      </section>
      {active && <MessageView message={active} onBack={closeDetail} onAction={act} router={router} busy={busy} />}
    </main>
  )
}

function InboxRow({ message, selected, onToggle, onOpen, disabled }) {
  const [Icon, category] = TYPE_DETAILS[message.type] || [Bell, "Auctor"]
  const unread = !message.read_at
  return <article className={`${styles.row} ${unread ? styles.unread : ""} ${selected ? styles.selectedRow : ""}`}>
    <button className={styles.rowCheck} role="checkbox" aria-checked={selected} disabled={disabled} onClick={() => onToggle(message.id)} aria-label={`${selected ? "Deselect" : "Select"} ${message.title}`}><span className={selected ? styles.checkboxChecked : styles.checkbox}>{selected && <Check size={13} />}</span></button>
    <button className={styles.rowMain} disabled={disabled} onClick={() => onOpen(message)}>
      <span className={`${styles.typeIcon} ${styles[`type${message.type}`] || ""}`}><Icon size={18} /></span>
      <span className={styles.sender}><strong>{message.source}</strong><small>{category}</small></span>
      <span className={styles.copy}><strong>{message.title}</strong><span>{message.preview}</span></span>
      <time dateTime={message.created_at}>{formatDate(message.created_at)}</time>
      <ChevronRight className={styles.chevron} size={18} />
    </button>
  </article>
}

function MessageView({ message, onBack, onAction, router, busy }) {
  const [Icon, category] = TYPE_DETAILS[message.type] || [Bell, "Auctor"]
  const dialog = useRef(null)
  useEffect(() => {
    const prior = document.activeElement, overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.current?.querySelector("button")?.focus()
    const keydown = (event) => {
      if (event.key === "Escape") onBack()
      if (event.key === "Tab") {
        const nodes = [...dialog.current.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')]
        const first = nodes[0], last = nodes.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener("keydown", keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); if (prior?.isConnected) prior.focus() }
  }, [onBack])
  let safeUrl = null
  try { if (message.action_url) safeUrl = internalPath(message.action_url) } catch {}
  return <div className={styles.readerBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onBack() }}><section ref={dialog} className={styles.reader} role="dialog" aria-modal="true" aria-label={message.title || "Open inbox message"}>

    <div className={styles.readerToolbar}><button onClick={onBack}><ArrowLeft size={19} /> Back</button><fieldset disabled={busy || message.loading}>
    {message.deleted_at ? <ToolButton icon={Inbox} label="Restore" onClick={() => onAction("restore", [message.id])} /> : <><ToolButton icon={Archive} label={message.archived_at ? "Move to Inbox" : "Archive"} onClick={() => onAction(message.archived_at ? "unarchive" : "archive", [message.id])} /><ToolButton icon={message.read_at ? Mail : MailOpen} label={message.read_at ? "Mark unread" : "Mark read"} onClick={() => onAction(message.read_at ? "unread" : "read", [message.id])} /><ToolButton icon={Trash2} label="Delete" danger onClick={() => onAction("delete", [message.id])} /></>}
    </fieldset></div>

    {message.loading ? <div className={styles.readerLoading}><Loader2 className={styles.spin} /></div> : <div className={styles.readerBody}>
      <div className={styles.messageIcon}><Icon size={22} /></div><p className={styles.messageCategory}>{category}</p><h2>{message.title}</h2>
      <div className={styles.from}><span className={styles.avatar}>A</span><span><strong>{message.source}</strong><small>to you</small></span><time>{formatFullDate(message.created_at)}</time></div>
      <div className={styles.messageContent}>{message.body.split("\n").map((line, index) => <p key={index}>{line || <br />}</p>)}</div>
      <MessageMetrics metadata={message.metadata} />
      {safeUrl && <button className={styles.cta} onClick={() => router.push(safeUrl)}>{typeof message.metadata?.actionLabel === "string" ? message.metadata.actionLabel : message.type === "DAILY_RECOMMENDATION" ? "Start recommended practice" : "Continue learning"} <ChevronRight size={17} /></button>}
    </div>}
  </section></div>
}

function ToolButton({ icon: Icon, label: text, danger, onClick }) { return <button className={danger ? styles.dangerTool : styles.tool} title={text} aria-label={text} onClick={onClick}><Icon size={17} /><span>{text}</span></button> }
function LoadingRows() { return <div>{[1,2,3,4,5].map((item) => <div className={styles.skeletonRow} key={item}><i /><span /><b /></div>)}</div> }
function EmptyState({ search, filter, folder }) { return <div className={styles.empty}><span><Inbox size={28} /></span><h2>{search ? "No matching messages" : filter === "UNREAD" ? "Everything is read" : folder === "ARCHIVE" ? "No archived messages" : folder === "TRASH" ? "Trash is empty" : "Your inbox is ready"}</h2><p>{search ? "Try a different word or clear your search." : "Useful study updates, recommendations and milestones will appear here."}</p></div> }
function label(value) { return value.charAt(0) + value.slice(1).toLowerCase() }
function formatDate(value) { const date = new Date(value); const today = new Date(); if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1); if (date.toDateString() === yesterday.toDateString()) return "Yesterday"; return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) }) }
function formatFullDate(value) { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }

function MessageMetrics({ metadata = {} }) {
  const fields = [["questions", "Questions"], ["questionActivitiesCount", "Practice sessions"], ["accuracyPercent", "Accuracy", "%"], ["previousAccuracy", "Previous accuracy", "%"], ["averageSeconds", "Seconds per timed question", " s"], ["timedQuestions", "Questions with timing"], ["streakDays", "Consecutive days"]]
  const metrics = fields.filter(([key]) => typeof metadata[key] === "number" && Number.isFinite(metadata[key]) && (metadata[key] > 0 || key.toLowerCase().includes("accuracy")))
  return <>{metadata.period && <p className={styles.metricPeriod}>Practice date: {String(metadata.period)}</p>}{metrics.length > 0 && <dl className={styles.metrics}>{metrics.map(([key, text, suffix = ""]) => <div key={key}><dt>{text}</dt><dd>{metadata[key]}{suffix}</dd></div>)}</dl>}{metadata.skill && <p>Recommended focus: {String(metadata.skill)}</p>}</>
}
