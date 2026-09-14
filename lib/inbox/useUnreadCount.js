"use client"
import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { createInboxRequest } from "./request.js"
const api = createInboxRequest(() => supabase.auth.getSession())
export function useInboxUnreadCount(enabled = true) {
  const [count, setCount] = useState(0)
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    if (!enabled) { setCount(0); return () => controller.abort() }
    ;(async () => {
      try {
        const body = await api("/api/inbox/unread-count", { signal: controller.signal })
        if (alive) setCount(Number(body.unreadCount) || 0)
      } catch (error) {
        if (alive && error.status === 401) setCount(0)
        // Preserve the last known count on transient failures.
      }
    })()
    return () => { alive = false; controller.abort() }
  }, [enabled, revision])
  useEffect(() => {
    const visible = () => { if (document.visibilityState === "visible") refresh() }
    const storage = (event) => { if (event.key === "auctor:inbox-updated") refresh() }
    const { data } = supabase.auth.onAuthStateChange(() => { setCount(0); refresh() })
    window.addEventListener("auctor:inbox-updated", refresh)
    window.addEventListener("focus", visible)
    window.addEventListener("storage", storage)
    document.addEventListener("visibilitychange", visible)
    return () => {
      data.subscription.unsubscribe()
      window.removeEventListener("auctor:inbox-updated", refresh)
      window.removeEventListener("focus", visible)
      window.removeEventListener("storage", storage)
      document.removeEventListener("visibilitychange", visible)
    }
  }, [refresh])
  return { count, refresh }
}
